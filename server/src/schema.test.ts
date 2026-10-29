import { ScriptOutputSchema, enforceSceneRules } from './schema.js';

console.log('--- RUNNING SCENE VALIDATOR TESTS ---');

// Test 1: Valid script
const validScript = {
  title: 'The Whispering Clock',
  description: 'An antique clock that ticks only when secrets are spoken.',
  hook: 'This clock has not ticked in forty years.',
  cta: 'Follow for the next midnight secret.',
  hashtags: ['#animation', '#storytelling'],
  scenes: [
    {
      id: 'S01',
      duration: 4,
      location: 'Dusty clockmaker shop at midnight',
      characters: 'Elias',
      action: 'Elias wipes dust from the bronze pendulum',
      camera: 'Slow push-in, low angle',
      narration: 'This clock has remained silent for forty years in this empty shop.',
      onScreenText: 'FORTY YEARS SILENT',
      continuityTags: { character: 'elias_v1', outfit: 'brown_vest_v1', environment: 'clock_shop_night_v1' },
      aiRiskFlags: [],
    },
    {
      id: 'S02',
      duration: 5,
      location: 'Dusty clockmaker shop at midnight',
      characters: 'Elias',
      action: 'Elias leans his ear against the glass face',
      camera: 'Tight close-up, lantern rim light',
      narration: 'Tonight, the frozen gears suddenly whisper an old name he tried to forget.',
      onScreenText: 'A FORGOTTEN NAME',
      continuityTags: { character: 'elias_v1', outfit: 'brown_vest_v1', environment: 'clock_shop_night_v1' },
      aiRiskFlags: ['Ear close to glass may warp face angle'],
    },
    {
      id: 'S03',
      duration: 5,
      location: 'Dusty clockmaker shop at midnight',
      characters: 'Elias',
      action: 'Elias steps back as the brass hands spin backward',
      camera: 'Wide shot, shadows stretching on wallpaper',
      narration: 'The secret was never his father’s burden to carry. It was his own.',
      onScreenText: 'HIS SECRET',
      continuityTags: { character: 'elias_v1', outfit: 'brown_vest_v1', environment: 'clock_shop_night_v1' },
      aiRiskFlags: ['Spinning clock hands require simple motion'],
    },
    {
      id: 'S04',
      duration: 5,
      location: 'Dusty clockmaker shop at midnight',
      characters: 'Elias',
      action: 'Elias looks directly into the dark lens',
      camera: 'Static medium close-up, pendulum swinging',
      narration: 'Subscribe now to hear what the midnight clock reveals next.',
      onScreenText: 'LISTEN CLOSELY',
      continuityTags: { character: 'elias_v1', outfit: 'brown_vest_v1', environment: 'clock_shop_night_v1' },
      aiRiskFlags: [],
    },
  ],
  summary: 'A 19-second atmospheric micro-story with high contrast lighting.',
};

const parsed = ScriptOutputSchema.safeParse(validScript);
if (!parsed.success) {
  console.error('FAIL: ScriptOutputSchema rejected valid script:', parsed.error.format());
  process.exit(1);
}
console.log('PASS: ScriptOutputSchema accepts valid script');

const rules = enforceSceneRules(parsed.data);
if (!rules.valid) {
  console.error('FAIL: enforceSceneRules rejected valid script:', rules.errors);
  process.exit(1);
}
console.log(`PASS: enforceSceneRules passed (Pacing: ${rules.stats.wpm} WPM, Total: ${rules.stats.totalDuration}s)`);

// Test 2: Detect multi-action violation
const invalidActionScript = JSON.parse(JSON.stringify(validScript));
invalidActionScript.scenes[0].action = 'Elias wipes dust from the clock and then opens the drawer';
const multiActionResult = enforceSceneRules(invalidActionScript);
if (multiActionResult.valid || !multiActionResult.errors.some((e) => e.field === 'action')) {
  console.error('FAIL: Failed to catch multi-action phrasing');
  process.exit(1);
}
console.log('PASS: Caught multi-action phrasing correctly');

// Test 3: Detect onScreenText word limit violation (> 5 words)
const invalidTextScript = JSON.parse(JSON.stringify(validScript));
invalidTextScript.scenes[0].onScreenText = 'THIS CLOCK HAS BEEN SILENT FOR FORTY LONG YEARS';
const textResult = enforceSceneRules(invalidTextScript);
if (textResult.valid || !textResult.errors.some((e) => e.field === 'onScreenText')) {
  console.error('FAIL: Failed to catch onScreenText > 5 words');
  process.exit(1);
}
console.log('PASS: Caught onScreenText > 5 words correctly');

// Test 4: Detect scene duration violation (< 3s or > 6s)
const invalidDurationScript = JSON.parse(JSON.stringify(validScript));
invalidDurationScript.scenes[0].duration = 8;
const durationResult = enforceSceneRules(invalidDurationScript);
if (durationResult.valid || !durationResult.errors.some((e) => e.field === 'duration')) {
  console.error('FAIL: Failed to catch scene duration > 6s');
  process.exit(1);
}
console.log('PASS: Caught scene duration > 6s correctly');

console.log('--- ALL SCENE VALIDATION TESTS PASSED ---');
