/** Read PCM WAV metadata without decoding audio or contacting storage. */
export function audioMetadata(bytes: Uint8Array, sizeBytes = bytes.byteLength) {
  const result = { duration_sec: null as number | null, size_bytes: sizeBytes };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
  if (bytes.length < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return result;
  let byteRate = 0;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const length = view.getUint32(offset + 4, true);
    if (tag(offset) === 'fmt ' && length >= 16 && offset + 24 <= bytes.length && view.getUint16(offset + 8, true) === 1) {
      byteRate = view.getUint32(offset + 16, true);
    }
    if (tag(offset) === 'data' && byteRate > 0 && length > 0 && offset + 8 + length <= sizeBytes) {
      result.duration_sec = Math.round(length / byteRate * 100) / 100;
      return result;
    }
    offset += 8 + length + (length % 2);
  }
  return result;
}

/** Historical inline WAVs need only their header plus original encoded length. */
export function inlineAudioMetadata(prefix?: string | null, fullLength?: number | string | null, tail = '') {
  if (!prefix || !/^data:[^,]+;base64,/.test(prefix)) return null;
  const start = prefix.indexOf(',') + 1;
  const encodedLength = Number(fullLength ?? prefix.length) - start;
  const padding = tail.endsWith('==') ? 2 : tail.endsWith('=') ? 1 : 0;
  const size = Math.floor(encodedLength * 3 / 4) - padding;
  if (size < 1) return null;
  return audioMetadata(Buffer.from(prefix.slice(start), 'base64'), size);
}
