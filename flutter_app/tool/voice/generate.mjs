// Generates assets/audio/voice/<line>-<lang>.mp3 from tool/voice/lines.json
// with ElevenLabs. The API key is read from outside the repository
// (E:/Almas/keys/key.txt, or ELEVENLABS_API_KEY) and is never written here.
//
//   node tool/voice/generate.mjs            # only missing files
//   node tool/voice/generate.mjs --force    # regenerate everything
//   node tool/voice/generate.mjs welcome    # only these line ids
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const out = path.join(root, 'assets/audio/voice');
const spec = JSON.parse(fs.readFileSync(path.join(here, 'lines.json'), 'utf8'));
const keyFile = 'E:/Almas/keys/key.txt';
const key =
  process.env.ELEVENLABS_API_KEY?.trim() ||
  (fs.existsSync(keyFile) ? fs.readFileSync(keyFile, 'utf8').trim() : '');
if (!key) throw new Error('No ElevenLabs key: set ELEVENLABS_API_KEY or ' + keyFile);

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
fs.mkdirSync(out, { recursive: true });

// Warm, lively but not shrill: some variation for feeling, high similarity.
const settings = { stability: 0.4, similarity_boost: 0.8, style: 0.45, use_speaker_boost: true };

async function tts(voiceId, text, lang) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: settings,
      }),
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

let made = 0;
for (const [id, langs] of Object.entries(spec.lines)) {
  if (only.length && !only.includes(id)) continue;
  for (const lang of ['en', 'ur']) {
    const file = path.join(out, `${id}-${lang}.mp3`);
    if (!force && fs.existsSync(file)) continue;
    const audio = await tts(spec.voices[lang].id, langs[lang], lang);
    fs.writeFileSync(file, audio);
    made++;
    console.log('made', path.relative(root, file), audio.length, 'bytes');
  }
}
console.log('done,', made, 'new files');
