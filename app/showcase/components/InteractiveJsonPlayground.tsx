'use client';

import React, { useState } from 'react';
import {
  FiFileText,
  FiCopy,
  FiCheck,
  FiPlay,
  FiCalendar,
  FiLayers,
  FiArrowRight,
} from 'react-icons/fi';
import Link from 'next/link';

interface CampaignPreset {
  id: string;
  name: string;
  platform: string;
  json: any;
}

const PRESETS: CampaignPreset[] = [
  {
    id: 'reels-7day',
    name: '7-Day Viral Reels Plan',
    platform: 'Facebook & Instagram',
    json: {
      theme: 'High-Retention Short Form Masterclass',
      platform: 'meta',
      page_name: 'Tech Creator Lab',
      daily_capacity: 'Automate 1 to 10 posts per day',
      content_plan: [
        {
          day: 1,
          theme: 'The 3-Second Hook Rule',
          hook: 'If your video doesnt grab them in 3 seconds, they are gone.',
          caption: 'Mastering the first 3 seconds of any Reel. Here is the formula that top creators use daily #CreatorTips #ViralReels #Growth',
          script: 'Stop introducing yourself in the first line. Start with the payoff, create visual tension, and deliver the punchline in the first three seconds.',
          tags: ['#CreatorTips', '#ViralReels', '#ShortsGrowth', '#RetentionHacks'],
          status: 'ready',
        },
        {
          day: 2,
          theme: 'Audio Pacing & Dynamic Voices',
          hook: 'Why bad audio ruins good videos faster than bad lighting.',
          caption: 'Audio is 50% of your video. Use multi-model voiceovers to keep pacing crisp and punchy #AudioAI #EditingHacks #SoundDesign',
          script: 'Viewers will forgive a 720p blurry camera, but they will instantly swipe away if your audio is muffled, quiet, or monotone. Use neural studio voiceovers to keep energy high.',
          tags: ['#AudioAI', '#VoiceoverStudio', '#SoundDesign', '#EditingTricks'],
          status: 'ready',
        },
        {
          day: 3,
          theme: 'Pattern Interrupt Visuals',
          hook: 'The 4-second scroll reset trick you must steal.',
          caption: 'How to eliminate retention drop-off in your Reels with effortless visual pattern interrupts #ContentStrategy #VideoEditing #ReelsAlgorithm',
          script: 'Every 4 seconds, change zoom level, insert a b-roll pop, or flash a kinetic caption. The human brain craves novelty, so give it a reason to keep watching.',
          tags: ['#PatternInterrupt', '#VideoEditing', '#ReelsAlgorithm', '#CapCut'],
          status: 'ready',
        },
        {
          day: 4,
          theme: 'Story Arc in 30 Seconds',
          hook: 'Nobody cares about your tips until you tell this story.',
          caption: 'The 30-second storytelling framework that turns passive scrollers into loyal followers #Storytelling #PersonalBrand #SocialGrowth',
          script: 'Start with an unexpected mistake you made last week. Show the struggle in 10 seconds, the breakthrough in 10 seconds, and the actionable takeaway at the end.',
          tags: ['#Storytelling', '#PersonalBrand', '#SocialGrowth', '#CreatorLife'],
          status: 'ready',
        },
        {
          day: 5,
          theme: 'Contrarian Industry Takes',
          hook: 'Stop posting every single day because it is killing your reach.',
          caption: 'Quality vs Quantity in 2026. Why strategic batching beats daily creator burnout #SocialMediaTips #AlgorithmSecrets #Strategy',
          script: 'The algorithm doesnt reward endless mediocre spam. Three high-retention, hyper-polished Reels per week will consistently outperform daily low-effort posts.',
          tags: ['#ContentMarketing', '#SocialMediaTips', '#AlgorithmSecrets', '#ViralGrowth'],
          status: 'ready',
        },
        {
          day: 6,
          theme: 'The Looping Ending Secret',
          hook: 'This 1 seamless trick doubles your total watch time.',
          caption: 'Infinite looping Reel formula. Keep retention above 100% with this simple seamless transition #LoopingReel #ReelsHack #RetentionSecret',
          script: 'Match the last word of your outro directly with the first word of your hook. When the Reel restarts, viewers wont even realize they started watching it twice.',
          tags: ['#LoopingReel', '#ReelsHack', '#RetentionSecret', '#VideoTricks'],
          status: 'ready',
        },
        {
          day: 7,
          theme: 'High-Converting Micro CTA',
          hook: 'The comment keyword trick that generated 1,400 leads.',
          caption: 'Stop losing clicks to bio links. Turn comments into automated engagement loops #Automation #LeadGen #InstagramTips',
          script: 'Never say link in bio. Instead, tell them to comment a specific keyword like SCRIPT, and have your automated messenger deliver the resource instantly.',
          tags: ['#LeadGeneration', '#InstagramMarketing', '#Automation', '#CommentGrowth'],
          status: 'ready',
        },
      ],
    },
  },
  {
    id: 'youtube-strategy',
    name: 'YouTube Documentary Strategy',
    platform: 'YouTube Long-Form & Shorts',
    json: {
      title: 'The Silent Architecture of Generative AI',
      channel: 'Future Horizon',
      category: 'Science & Technology',
      target_audience: 'AI Developers, Tech Enthusiasts, Founders',
      content_strategy: {
        long_video: {
          id: 'long_1',
          type: 'long_video',
          title: 'How Neural Weights Actually Reason (Full Documentary)',
          duration: '12:40',
          format: '16:9',
          description:
            'An investigative deep dive into latent space geometry, multi-head attention mechanisms, and how modern transformer architectures synthesize human-like reasoning without consciousness.',
          script:
            'Beyond the hype and chatbot interfaces lies a massive multi-dimensional matrix of mathematical weights working in parallel. Every token you enter is transformed into a high-dimensional vector, navigating billions of floating-point computations in milliseconds. In this documentary, we disassemble the internal machinery of modern frontier models.',
          tags: ['#AIArchitecture', '#DeepLearning', '#NeuralNetworks', '#Documentary', '#FutureHorizon'],
          status: 'ready',
        },
        shorts: [
          {
            id: 'short_1',
            type: 'short',
            title: 'The Transformer Translation Myth',
            hook: 'Did you know transformers were invented for translation, not chat?',
            duration: '0:45',
            format: '9:16',
            description:
              'The untold story of the 2017 Google paper that accidentally triggered the modern AI revolution.',
            script:
              'In 2017, Google researchers never intended to build ChatGPT. "Attention Is All You Need" was strictly an experiment to make Google Translate faster. Here is how that machine translation paper accidentally birthed general reasoning.',
            tags: ['#AIFacts', '#Transformers', '#TechHistory', '#ShortsViral'],
            status: 'ready',
          },
          {
            id: 'short_2',
            type: 'short',
            title: 'The #1 Local Model Fine-Tuning Mistake',
            hook: 'The single biggest mistake engineers make when training local models.',
            duration: '0:50',
            format: '9:16',
            description:
              'Why cranking up learning rates on LoRA adapters destroys foundational reasoning benchmarks.',
            script:
              'If you are fine-tuning Llama on your own data, stop turning your learning rate above 2e-4. Oversaturating rank adapters causes catastrophic forgetting in 3 epochs. Keep rank low and curate clean synthetic pairs instead.',
            tags: ['#LocalLLM', '#OpenSourceAI', '#FineTuning', '#MachineLearning'],
            status: 'ready',
          },
          {
            id: 'short_3',
            type: 'short',
            title: 'Inside an Attention Head',
            hook: 'Watch how an attention head actually reads this sentence.',
            duration: '0:38',
            format: '9:16',
            description:
              'Visualizing query, key, and value vectors in token self-attention.',
            script:
              'When an AI model reads "The animal didnt cross the street because it was too tired", how does it know what "it" refers to? Self-attention calculates dot products across 12,000 dimensions to connect "it" to "animal" in 2 milliseconds.',
            tags: ['#AttentionHeads', '#NeuralNets', '#TechExplained', '#AIConcepts'],
            status: 'ready',
          },
        ],
      },
    },
  },
];

export default function InteractiveJsonPlayground() {
  const [selectedPreset, setSelectedPreset] = useState<CampaignPreset>(PRESETS[0]);
  const [copied, setCopied] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [activeYoutubeIndex, setActiveYoutubeIndex] = useState(0);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedPreset.json, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedScriptId(id);
    setTimeout(() => setCopiedScriptId(null), 2000);
  };

  const handleSelectPreset = (p: CampaignPreset) => {
    setSelectedPreset(p);
    setActiveDay(0);
    setActiveYoutubeIndex(0);
  };

  // Normalize YouTube items (can contain 1 or multiple long videos, and multiple shorts)
  const longVideos = Array.isArray(selectedPreset.json.content_strategy?.long_videos)
    ? selectedPreset.json.content_strategy.long_videos
    : selectedPreset.json.content_strategy?.long_video
      ? [selectedPreset.json.content_strategy.long_video]
      : [];

  const shortsList = Array.isArray(selectedPreset.json.content_strategy?.shorts)
    ? selectedPreset.json.content_strategy.shorts
    : [];

  const allYoutubeItems = [
    ...longVideos.map((lv: any, i: number) => ({
      ...lv,
      itemType: 'long',
      displayLabel: longVideos.length > 1 ? `Long Video #${i + 1}` : 'Full Documentary',
      badge: '16:9 Long-Form',
    })),
    ...shortsList.map((sh: any, i: number) => ({
      ...sh,
      itemType: 'short',
      displayLabel: `Short #${i + 1}`,
      badge: '9:16 Vertical Short',
    })),
  ];

  const currentYoutubeItem = allYoutubeItems[activeYoutubeIndex] || allYoutubeItems[0];

  return (
    <section id="json-engine" className="py-12 sm:py-16 lg:py-20 bg-slate-50/60 border-t border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading without pill badges */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Prompt Any AI. Paste JSON. Get Instant Campaigns.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            GenZee parses structured campaign plans from Claude, ChatGPT, or DeepSeek and turns them
            into interactive calendars, scripts, and 1-click voiceovers.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${selectedPreset.id === p.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
                }`}
            >
              <span>{p.name}</span>
              <span className="ml-2 text-[10px] font-normal opacity-70">({p.platform})</span>
            </button>
          ))}
        </div>

        {/* Split Code & Visual Card (Single clean boundary, no box-in-box nesting) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Raw JSON View */}
          <div className="lg:col-span-6 bg-slate-900 rounded-2xl p-5 sm:p-6 text-slate-200 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2 font-mono">
                <FiFileText className="text-[#ff7d6e]" />
                <span>campaign_strategy.json</span>
              </div>
              <button
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="py-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[380px] scrollbar-thin scrollbar-thumb-slate-700 leading-relaxed">
              {JSON.stringify(selectedPreset.json, null, 2)}
            </pre>

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Standard schema supported</span>
              <span className="text-[#ff9b8f]">Paste directly in Studio</span>
            </div>
          </div>

          {/* Right: Interactive Parsed Plan Visualizer */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedPreset.json.theme || selectedPreset.json.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target: {selectedPreset.json.page_name || selectedPreset.json.channel || 'All Platforms'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedPreset.json.content_plan ? (
                    <>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                        7-Day Multi-Reels Plan
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">
                        Ready to Synthesize
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-[#c83a2a] border border-[#ff9b8f]/40 font-mono">
                        {longVideos.length} Long-Form • {shortsList.length} Shorts
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">
                        Multi-Format Ready
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Items: 1. Reels Plan */}
              {selectedPreset.json.content_plan ? (
                <div className="py-4 space-y-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {selectedPreset.json.content_plan.map((item: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveDay(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${activeDay === idx
                          ? 'bg-[#ff7d6e] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        Day {item.day}
                      </button>
                    ))}
                  </div>

                  {/* Active Day Card */}
                  <div className="p-4 bg-slate-50/80 rounded-xl space-y-2.5 text-xs text-slate-700 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          Day {selectedPreset.json.content_plan[activeDay].day}: {selectedPreset.json.content_plan[activeDay].theme}
                        </span>
                        <span className="text-slate-500 italic mt-0.5 block">
                          &quot;{selectedPreset.json.content_plan[activeDay].hook}&quot;
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200/60 shrink-0">
                        Post #{selectedPreset.json.content_plan[activeDay].day}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 block">Voiceover Script:</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              selectedPreset.json.content_plan[activeDay].script,
                              `reel-${activeDay}-script`
                            )
                          }
                          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedScriptId === `reel-${activeDay}-script` ? (
                            <FiCheck className="text-emerald-500" />
                          ) : (
                            <FiCopy className="text-xs" />
                          )}
                          <span>
                            {copiedScriptId === `reel-${activeDay}-script` ? 'Copied' : 'Copy Script'}
                          </span>
                        </button>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-mono bg-white p-2.5 rounded-lg border border-slate-200/70 text-xs">
                        {selectedPreset.json.content_plan[activeDay].script}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="font-semibold text-slate-800 block mb-1">Social Caption:</span>
                      <p className="text-slate-500 line-clamp-2">
                        {selectedPreset.json.content_plan[activeDay].caption}
                      </p>
                    </div>

                    {selectedPreset.json.content_plan[activeDay].tags && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <span className="font-semibold text-slate-800 block mb-1.5">Hashtags &amp; Tags:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPreset.json.content_plan[activeDay].tags.map((tag: string, tIdx: number) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-full bg-orange-50 text-[#c83a2a] text-[11px] font-mono font-medium border border-[#ff9b8f]/40 leading-tight"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Dynamic Items: 2. YouTube Strategy (Long-Form & Multi-Shorts) */
                <div className="py-4 space-y-3">
                  {/* Item Selector Tabs */}
                  {allYoutubeItems.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {allYoutubeItems.map((item: any, idx: number) => {
                        const isActive = activeYoutubeIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveYoutubeIndex(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${isActive
                              ? item.itemType === 'long'
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-[#ff7d6e] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            <span>{item.displayLabel}</span>
                            {item.duration && (
                              <span className="opacity-75 text-[10px] font-mono">({item.duration})</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Active YouTube Item Card */}
                  {currentYoutubeItem ? (
                    <div className="p-4 bg-slate-50/80 rounded-xl space-y-2.5 text-xs text-slate-700 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                      {/* Top Row: Format & Status Badges */}
                      <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${currentYoutubeItem.itemType === 'long'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                : 'bg-orange-50 text-[#c83a2a] border border-[#ff9b8f]/40 font-mono'
                                }`}
                            >
                              {currentYoutubeItem.badge}
                            </span>
                            {currentYoutubeItem.duration && (
                              <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200/60">
                                ⏱️ {currentYoutubeItem.duration}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm pt-1 leading-snug">
                            {currentYoutubeItem.title}
                          </h4>
                          {currentYoutubeItem.hook && (
                            <p className="text-slate-500 italic text-xs mt-0.5">
                              &quot;{currentYoutubeItem.hook}&quot;
                            </p>
                          )}
                        </div>

                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 shrink-0 flex items-center gap-1">
                          <FiCheck className="text-xs" /> Ready to Record
                        </span>
                      </div>

                      {/* Description */}
                      {currentYoutubeItem.description && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <span className="font-semibold text-slate-800 block mb-1">
                            Concept &amp; Overview:
                          </span>
                          <p className="text-slate-600 leading-relaxed font-sans">
                            {currentYoutubeItem.description}
                          </p>
                        </div>
                      )}

                      {/* Voiceover Script with 1-click Copy */}
                      {(currentYoutubeItem.script || currentYoutubeItem.script_intro) && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-800 block">Voiceover Script:</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(
                                  currentYoutubeItem.script || currentYoutubeItem.script_intro,
                                  `yt-${activeYoutubeIndex}-script`
                                )
                              }
                              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              {copiedScriptId === `yt-${activeYoutubeIndex}-script` ? (
                                <FiCheck className="text-emerald-500" />
                              ) : (
                                <FiCopy className="text-xs" />
                              )}
                              <span>
                                {copiedScriptId === `yt-${activeYoutubeIndex}-script` ? 'Copied' : 'Copy Script'}
                              </span>
                            </button>
                          </div>
                          <p className="text-slate-700 leading-relaxed font-mono bg-white p-3 rounded-xl border border-slate-200/70 text-xs">
                            {currentYoutubeItem.script || currentYoutubeItem.script_intro}
                          </p>
                        </div>
                      )}

                      {/* Hashtags & Keywords */}
                      {currentYoutubeItem.tags && currentYoutubeItem.tags.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <span className="font-semibold text-slate-800 block mb-1.5">
                            Hashtags &amp; Keywords:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {currentYoutubeItem.tags.map((tag: string, tIdx: number) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 rounded-full bg-orange-50 text-[#c83a2a] text-[11px] font-mono font-medium border border-[#ff9b8f]/40 leading-tight"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 1-Click Bridge CTA inside item */}
                      <div className="pt-2.5 flex items-center justify-between border-t border-slate-200/60 flex-wrap gap-2">
                        <span className="text-[11px] text-slate-500">
                          {currentYoutubeItem.itemType === 'long'
                            ? '16:9 Master Audio Track'
                            : '9:16 Shorts Voiceover Track'}
                        </span>
                        <Link
                          href="/admin"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                        >
                          <span>Synthesize in Voice Studio</span>
                          <FiArrowRight className="text-xs" />
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Bottom Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-400">
                {selectedPreset.id === 'reels-7day'
                  ? 'Schedule 1 to 10 posts daily • 1-click bridge to Voice Studio'
                  : 'Structured long-form & multi-shorts strategy • 1-click bridge to Voice Studio'}
              </span>
              <Link
                href="/json-generator"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c83a2a] hover:underline"
              >
                <span>Launch JSON Generator</span>
                <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
