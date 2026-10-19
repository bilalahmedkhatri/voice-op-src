"""Development-only static translation drafts. Inference never sends source text over the network.

Download public, pinned safetensors with --download. Run inference without that flag;
the inference path uses only local files and has HF offline mode enabled.
Requires an isolated development Python environment with torch, transformers,
sentencepiece and sacremoses. These are not application dependencies.
"""
import argparse
import gc
import json
import os
import re
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / '.next/cache/genzee-localization/models'
CACHE = ROOT / 'output/localization/translations'
REPOS = {
    'ru': ('Helsinki-NLP/opus-mt-en-ru', '3ff4dbd98515ba253f08f183e0de0b7ccf189ee3'),
    'romance': ('Helsinki-NLP/opus-mt-en-ROMANCE', 'b20efd9837bd3779d6306ad15f053e819db31f83'),
    'nl': ('Helsinki-NLP/opus-mt-en-nl', 'cb106147f56946f00045d2f9768539949e660489'),
}
# The model lists pt_PT but that undertrained token mixes Spanish into its output.
# Generic Portuguese produces coherent drafts; European terminology is applied below.
TARGETS = {'ru': ('ru', ''), 'pt': ('romance', '>>pt<< '), 'fr': ('romance', '>>fr<< '), 'es': ('romance', '>>es<< '), 'nl': ('nl', '')}


def european_portuguese(text):
    terms = {'usuário': 'utilizador', 'usuários': 'utilizadores', 'tela': 'ecrã', 'telas': 'ecrãs',
             'arquivo': 'ficheiro', 'arquivos': 'ficheiros', 'equipe': 'equipa', 'equipes': 'equipas',
             'salvar': 'guardar', 'salvo': 'guardado', 'salvos': 'guardados', 'salva': 'guardada',
             'salvas': 'guardadas', 'gerenciar': 'gerir', 'gerenciamento': 'gestão',
             'compartilhar': 'partilhar', 'compartilhamento': 'partilha', 'compartilhado': 'partilhado',
             'compartilhados': 'partilhados', 'planejamento': 'planeamento', 'roteiro': 'guião',
             'roteiros': 'guiões', 'configurações': 'definições', 'gênero': 'género',
             'gêneros': 'géneros', 'mídia': 'multimédia', 'contato': 'contacto'}
    def replace(match):
        word = match[0]
        translated = terms[word.lower()]
        return translated.capitalize() if word[0].isupper() else translated
    return re.sub(r'\b(' + '|'.join(terms) + r')\b', replace, text, flags=re.IGNORECASE)


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for attempt in range(20):
        try:
            temporary.replace(path)
            return
        except PermissionError:
            if attempt == 19:
                raise
            time.sleep(0.25)


def compile_literal(text):
    if text.startswith('{v0, plural,'):
        return text
    text = text.replace("'", "''")
    text = re.sub(r'[{}<]', lambda m: "'" + m[0] + "'", text)
    return re.sub(r"'\{'(v\d+)'\}'", r'{\1}', text)


def save_catalogs(locale, raw):
    for directory in ('', 'blog/'):
        english = read(ROOT / f'messages/{directory}en.json')['copy']
        path = ROOT / f'messages/{directory}{locale}.json'
        current = read(path)
        for key, value in raw.items():
            if key in english:
                current['copy'][key] = compile_literal(value)
        write(path, current)


# Placeholders, brands, URLs, emails, units and quoted code remain byte-for-byte stable.
PROTECTED = re.compile(
    r'\{v\d+\}|https?://[^\s)]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|'
    r'GenZee(?: Video)?|ElevenLabs|Fish Audio|Google Gemini(?: Voice)?|Gemini|YouTube|Facebook|Instagram|TikTok|'
    r'ChatGPT|Claude|DeepSeek|CapCut|DaVinci Resolve|Premiere Pro|Final Cut Pro|Google AdSense|AdSense|'
    r'Murf|Play\.ht|Speechify|Amazon Polly|Microsoft Azure|OpenAI|Notion|Google Docs|Canva|Adobe|'
    r'Audacity|Descript|Pictory|Synthesia|HeyGen|Runway|Midjourney|Stable Diffusion|LinkedIn|Pinterest|'
    r'\b(?:JSON|WAV|MP3|MP4|UTC|USD|HTTPS|HTTP|SEO|SRT|API|B2)\b|#[A-Za-z][\w]*|'
    r'\b\d+(?:[.,]\d+)*(?:\s?%|:\d+)?\b'
)


def protect(source):
    values = []

    def replace(match):
        index = len(values)
        values.append(match[0])
        return f'ZXQ{index}ZXQ'

    return PROTECTED.sub(replace, source), values


def restore(text, values):
    for index, value in enumerate(values):
        pattern = re.compile(r'Z\s*X\s*Q\s*' + str(index) + r'\s*Z\s*X\s*Q', re.I)
        if not pattern.search(text):
            return None
        text = pattern.sub(lambda _: value, text)
    if re.search(r'ZXQ\d*ZXQ', text, re.I):
        return None
    return text


def split_text(text, tokenizer, prefix):
    if len(tokenizer.encode(prefix + text)) <= 380:
        return [text]
    # Split at a sentence/space boundary; never truncate text to fit model limits.
    midpoint = len(text) // 2
    spaces = [m.start() for m in re.finditer(r'\s+', text)]
    if not spaces:
        return [text[:midpoint], text[midpoint:]]
    point = min(spaces, key=lambda p: abs(p - midpoint))
    return split_text(text[:point].strip(), tokenizer, prefix) + split_text(text[point:].strip(), tokenizer, prefix)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--locales', default='fr,es,pt,ru,nl')
    parser.add_argument('--limit', type=int, default=0)
    parser.add_argument('--batch-size', type=int, default=16)
    args = parser.parse_args()
    if args.download:
        os.environ['HF_HUB_DISABLE_XET'] = '1'
        from huggingface_hub import snapshot_download
        for name, (repo, revision) in REPOS.items():
            snapshot_download(repo, revision=revision, token=False, local_dir=MODELS / name,
                              allow_patterns=['*.json', '*.spm', '*.safetensors'], max_workers=3)
            print(f'Downloaded {name} pinned safe tensor model', flush=True)
        return

    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    import torch
    from transformers import MarianMTModel, MarianTokenizer
    torch.set_num_threads(4)
    sources = read(ROOT / 'messages/sources.json')
    core = read(ROOT / 'messages/core-translations.json')
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    active_model = None
    model = tokenizer = None
    for locale in args.locales.split(','):
        name, prefix = TARGETS[locale]
        cache_file = CACHE / f'{locale}.json'
        raw = read(cache_file) if cache_file.exists() else {}
        remaining = [(key, value) for key, value in sources.items() if value not in core and key not in raw]
        if args.limit:
            remaining = remaining[:args.limit]
        if not remaining:
            save_catalogs(locale, raw)
            continue
        if active_model != name:
            model = tokenizer = None
            gc.collect()
            if device == 'cuda':
                torch.cuda.empty_cache()
            tokenizer = MarianTokenizer.from_pretrained(MODELS / name, local_files_only=True)
            model = MarianMTModel.from_pretrained(MODELS / name, local_files_only=True, use_safetensors=True)
            model = model.to(device).eval()
            if device == 'cuda':
                model = model.half()
            active_model = name
        started = time.monotonic()

        def translate_batch(texts):
            encoded = tokenizer([prefix + text for text in texts], return_tensors='pt', padding=True, truncation=False).to(device)
            if encoded.input_ids.shape[1] > 500:
                raise ValueError('Input must be split before translation')
            with torch.inference_mode():
                result = model.generate(**encoded, max_new_tokens=512, num_beams=3, early_stopping=True)
            return tokenizer.batch_decode(result, skip_special_tokens=True)

        # Translate segments in batches, retaining the original message boundaries.
        jobs = []
        for key, source in remaining:
            protected, values = protect(source)
            segments = split_text(protected.strip(), tokenizer, prefix)
            jobs.append((key, source, values, segments))
        segments = [(index, part_index, part) for index, job in enumerate(jobs) for part_index, part in enumerate(job[3])]
        # Similar lengths share batches so short labels do not wait for long article paragraphs.
        segments.sort(key=lambda item: len(tokenizer.encode(prefix + item[2])))
        outputs = {index: {} for index in range(len(jobs))}
        for offset in range(0, len(segments), args.batch_size):
            batch = segments[offset:offset + args.batch_size]
            translations = translate_batch([part for _, _, part in batch])
            for (index, part_index, _), text in zip(batch, translations):
                outputs[index][part_index] = text
            if offset % (args.batch_size * 10) == 0:
                print(f'{locale}: segments {min(offset + len(batch), len(segments))}/{len(segments)}; {time.monotonic() - started:.0f}s', flush=True)
        restored = {index: restore(' '.join(outputs[index][part_index] for part_index in range(len(job[3]))), job[2]) for index, job in enumerate(jobs)}
        fallback_parts = {}
        fallback_segments = []
        for index, job in enumerate(jobs):
            if restored[index] is not None:
                continue
            fallback_parts[index] = PROTECTED.split(job[1])
            for part_index, part in enumerate(fallback_parts[index]):
                if re.search(r'[A-Za-z]', part):
                    for chunk_index, chunk in enumerate(split_text(part.strip(), tokenizer, prefix)):
                        fallback_segments.append((index, part_index, chunk_index, chunk))
        fallback_segments.sort(key=lambda item: len(tokenizer.encode(prefix + item[3])))
        fallback_outputs = {}
        for offset in range(0, len(fallback_segments), args.batch_size):
            batch = fallback_segments[offset:offset + args.batch_size]
            for (index, part_index, chunk_index, _), text in zip(batch, translate_batch([part for _, _, _, part in batch])):
                fallback_outputs.setdefault((index, part_index), {})[chunk_index] = text
            if offset % (args.batch_size * 20) == 0:
                print(f'{locale}: protected spans {min(offset + len(batch), len(fallback_segments))}/{len(fallback_segments)}', flush=True)
        for index, (key, source, values, _) in enumerate(jobs):
            translated = restored[index]
            if translated is None:
                matches = list(PROTECTED.finditer(source))
                translated_parts = []
                for part_index, part in enumerate(fallback_parts[index]):
                    chunks = fallback_outputs.get((index, part_index))
                    translated_parts.append((' ' if part[:1].isspace() else '') + ' '.join(chunks[i] for i in sorted(chunks)) + (' ' if part[-1:].isspace() else '') if chunks else part)
                    if part_index < len(matches):
                        translated_parts.append(matches[part_index][0])
                translated = ''.join(translated_parts)
            if not translated.strip():
                raise ValueError(f'Empty translation: {locale}/{key}')
            leading = re.match(r'^\s*', source)[0]
            trailing = re.search(r'\s*$', source)[0]
            translated = european_portuguese(translated) if locale == 'pt' else translated
            raw[key] = leading + translated.strip() + trailing
            if index % 50 == 0:
                write(cache_file, raw)
                save_catalogs(locale, raw)
        write(cache_file, raw)
        save_catalogs(locale, raw)
        print(f'{locale}: saved {len(raw)} local translation drafts in {time.monotonic() - started:.0f}s', flush=True)


if __name__ == '__main__':
    main()
