import { z } from 'zod';

export const SCRIPT_WRITER_SYSTEM_PROMPT = `You are an experienced animation director and short-form scriptwriter.
Inputs: topic, genre, animation style (from preset), audience, tone, length (15-60s).
Return JSON: { hook, scenes[], cta, hashtags, title, description }.
Each scene: { id, duration, location, characters, action (ONE visible action),
camera, narration, onScreenText (max 5 words), continuityTags, aiRiskFlags[] }.
Rules: Hook in first 3s (question, pain point, or striking visual). Hook ~20%,
value ~60-70%, CTA ~10-20%, one clear CTA. Narration 140-160 wpm, no filler.
Show, don't tell. Split any multi-action sentence into separate scenes.
Flag AI risks (complex text, objects transforming, fast physics, hands) and
propose simpler shots. Match the chosen style's visual language.
End with a plain-English summary of what you created and what the creator should review.`;

export const GenerateScriptInputSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  genre: z.string().min(1, 'Genre is required'),
  stylePresetId: z.string().min(1, 'Style preset ID is required'),
  audience: z.string().optional().default('General audience interested in short-form content'),
  tone: z.string().optional().default('Engaging, cinematic, punchy'),
  length: z.number().min(15).max(60).default(30),
  approvedSpend: z.boolean().default(false),
});

export type GenerateScriptInput = z.infer<typeof GenerateScriptInputSchema>;

export const ContinuityTagsSchema = z.object({
  character: z.string().min(1, 'Character tag is required'),
  outfit: z.string().min(1, 'Outfit tag is required'),
  environment: z.string().min(1, 'Environment tag is required'),
});

export const ScriptSceneSchema = z.object({
  id: z.string().min(1),
  duration: z.number().min(3).max(6),
  location: z.string().min(1),
  characters: z.union([z.string(), z.array(z.string())]),
  action: z.string().min(1),
  camera: z.string().min(1),
  narration: z.string().min(1),
  onScreenText: z.string(),
  continuityTags: ContinuityTagsSchema,
  aiRiskFlags: z.array(z.string()).default([]),
});

export type ScriptScene = z.infer<typeof ScriptSceneSchema>;

export const ScriptOutputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  hook: z.string().min(1),
  cta: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  scenes: z.array(ScriptSceneSchema).min(2),
  summary: z.string().optional(),
});

export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;

export interface RuleViolation {
  sceneId?: string;
  field: string;
  message: string;
}

export function enforceSceneRules(script: ScriptOutput): {
  valid: boolean;
  errors: RuleViolation[];
  stats: { totalDuration: number; totalWords: number; wpm: number };
} {
  const errors: RuleViolation[] = [];
  let totalDuration = 0;
  let totalNarrationWords = 0;

  script.scenes.forEach((scene, index) => {
    const sceneId = scene.id || `S${String(index + 1).padStart(2, '0')}`;
    totalDuration += scene.duration;

    // 1. Scene Duration Check (3-6 seconds)
    if (scene.duration < 3 || scene.duration > 6) {
      errors.push({
        sceneId,
        field: 'duration',
        message: `Scene duration must be 3–6s (got ${scene.duration}s).`,
      });
    }

    // 2. onScreenText Max 5 words
    const textWords = scene.onScreenText ? scene.onScreenText.trim().split(/\s+/).filter(Boolean) : [];
    if (textWords.length > 5) {
      errors.push({
        sceneId,
        field: 'onScreenText',
        message: `onScreenText exceeds 5 words (${textWords.length} words: "${scene.onScreenText}").`,
      });
    }

    // 3. Continuity Tags Present
    if (!scene.continuityTags || !scene.continuityTags.character || !scene.continuityTags.outfit || !scene.continuityTags.environment) {
      errors.push({
        sceneId,
        field: 'continuityTags',
        message: 'Continuity tags must include character, outfit, and environment.',
      });
    }

    // 4. Single Visible Action Check (detect obvious multi-action phrasing)
    const multiActionPatterns = [
      /\band\s+then\b/i,
      /\bafter\s+which\b/i,
      /\bwhile\s+simultaneously\b/i,
      /\bfirst\s+.*,\s*then\b/i,
      /;\s*[A-Z]/,
    ];
    for (const pattern of multiActionPatterns) {
      if (pattern.test(scene.action)) {
        errors.push({
          sceneId,
          field: 'action',
          message: `Multi-action detected: "${scene.action}". Each scene must depict ONE single visible action.`,
        });
        break;
      }
    }

    // Accumulate narration words
    const words = scene.narration.trim().split(/\s+/).filter(Boolean);
    totalNarrationWords += words.length;
  });

  // 5. Narration 140-160 WPM Target
  const minutes = totalDuration / 60;
  const wpm = minutes > 0 ? Math.round(totalNarrationWords / minutes) : 0;
  if (wpm < 130 || wpm > 170) {
    errors.push({
      field: 'narration',
      message: `Pacing is ${wpm} WPM (${totalNarrationWords} words / ${totalDuration}s). Target is 140–160 WPM.`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: { totalDuration, totalWords: totalNarrationWords, wpm },
  };
}
