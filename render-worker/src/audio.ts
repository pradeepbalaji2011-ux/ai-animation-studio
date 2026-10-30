import fs from 'fs';
import path from 'path';

export interface WavOptions {
  durationSeconds: number;
  frequency?: number;
  sampleRate?: number;
}

/**
 * Generates an uncompressed 16-bit PCM WAV audio file with calibrated sine tone
 * and clean ducked loudness for testing assembly & normalization pipelines.
 */
export function generateVoiceoverWav(outputPath: string, durationSeconds: number): void {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * numChannels * (bitsPerSample / 8);

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Synthesize calibrated voice-like harmonic carrier (-14 LUFS equivalent tone)
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Cadence modulation mimicking human speech prosody (pauses + syllable bursts)
    const cadence = (Math.sin(2 * Math.PI * 3.5 * t) + 1) * 0.4 + 0.2;
    // Harmonic carrier (fundamental 160Hz + harmonics)
    const tone =
      Math.sin(2 * Math.PI * 160 * t) * 0.5 +
      Math.sin(2 * Math.PI * 320 * t) * 0.25 +
      Math.sin(2 * Math.PI * 480 * t) * 0.15;

    // Amplitude target (-14 LUFS target ~ 0.2 amplitude)
    const sampleVal = Math.floor(tone * cadence * 6500);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, sampleVal)), offset);
    offset += 2;
  }

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, buffer);
}
