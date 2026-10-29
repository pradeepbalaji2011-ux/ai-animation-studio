import {
  GenerateScriptInput,
  ScriptOutput,
  ScriptOutputSchema,
  SCRIPT_WRITER_SYSTEM_PROMPT,
  enforceSceneRules,
} from './schema.js';
import stylePresets from '../../app/src/data/style-presets.json' with { type: 'json' };

interface StylePreset {
  id: string;
  name: string;
  route: string;
  motionRules: string[];
  cameraRules: string[];
  palette: string[];
}

export interface SpendStatus {
  dailyLimit: number;
  spentToday: number;
  remainingToday: number;
}

// In-memory daily spend tracker (persists per server run)
let spentToday = 0;
let lastResetDate = new Date().toISOString().split('T')[0];

function checkAndResetDay() {
  const today = new Date().toISOString().split('T')[0];
  if (today !== lastResetDate) {
    spentToday = 0;
    lastResetDate = today;
  }
}

export function getSpendStatus(): SpendStatus {
  checkAndResetDay();
  const limit = parseFloat(process.env.DAILY_SPEND_LIMIT || '2.00');
  return {
    dailyLimit: limit,
    spentToday: parseFloat(spentToday.toFixed(4)),
    remainingToday: parseFloat(Math.max(0, limit - spentToday).toFixed(4)),
  };
}

export function recordSpend(amountUsd: number) {
  checkAndResetDay();
  spentToday += amountUsd;
}

function extractJson(text: string): unknown {
  // Strip markdown code fences if model wrapped in ```json ... ```
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const clean = match ? match[1] : text;
  return JSON.parse(clean.trim());
}

export async function callClaudeApi(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  model: string,
  apiKey: string
): Promise<{ text: string; costUsd: number }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 3000,
      system: SCRIPT_WRITER_SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
    usage?: { input_tokens: number; output_tokens: number };
  };

  const textBlock = data.content.find((b) => b.type === 'text');
  const text = textBlock ? textBlock.text : '';

  // Calculate approximate cost (Sonnet 3.5 pricing: $3/M input, $15/M output)
  const inputTokens = data.usage?.input_tokens || 1000;
  const outputTokens = data.usage?.output_tokens || 800;
  const costUsd = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;

  return { text, costUsd };
}

export async function generateScriptWithClaude(
  input: GenerateScriptInput
): Promise<{ script: ScriptOutput; costUsd: number; retried: boolean }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server. Please set it in server/.env.');
  }

  const spend = getSpendStatus();
  if (spend.remainingToday <= 0.005) {
    throw new Error(
      `Daily spend limit ($${spend.dailyLimit.toFixed(2)}) reached. Spent today: $${spend.spentToday.toFixed(2)}. Adjust DAILY_SPEND_LIMIT in server/.env to proceed.`
    );
  }

  const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

  // Find style preset details
  const presets = stylePresets as unknown as StylePreset[];
  const preset = presets.find((p) => p.id === input.stylePresetId) || presets[0];

  const userPrompt = `Topic: ${input.topic}
Genre: ${input.genre}
Animation Style: ${preset.name} (${preset.route})
Style Camera Rules: ${preset.cameraRules?.join('; ') || 'Standard cinematic 9:16'}
Style Motion Rules: ${preset.motionRules?.join('; ') || 'Smooth motion'}
Style Color Palette: ${preset.palette?.join(', ') || '#ffffff, #000000'}
Target Audience: ${input.audience}
Tone: ${input.tone}
Target Video Length: ${input.length} seconds

Generate a short-form vertical 9:16 script adhering strictly to the scene timing (3-6s per scene, total length ~${input.length}s), 140-160 WPM narration density, max 5 words onScreenText, and one visible action per scene. Return ONLY valid JSON.`;

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: userPrompt },
  ];

  // First Attempt
  const firstCall = await callClaudeApi(messages, model, apiKey);
  let totalCost = firstCall.costUsd;
  let retried = false;

  try {
    const rawJson = extractJson(firstCall.text);
    const parsed = ScriptOutputSchema.parse(rawJson);
    const ruleCheck = enforceSceneRules(parsed);

    if (ruleCheck.valid) {
      recordSpend(totalCost);
      return { script: parsed, costUsd: totalCost, retried: false };
    }

    // Rules failed on first try -> retry once with feedback
    retried = true;
    const errorDetails = ruleCheck.errors.map((e) => `- [${e.sceneId || 'Global'}] ${e.field}: ${e.message}`).join('\n');
    messages.push({ role: 'assistant', content: firstCall.text });
    messages.push({
      role: 'user',
      content: `Your response had the following validation rule errors:\n${errorDetails}\n\nPlease fix these issues and return corrected, valid JSON conforming to the schema and all rules.`,
    });

    const secondCall = await callClaudeApi(messages, model, apiKey);
    totalCost += secondCall.costUsd;

    const secondJson = extractJson(secondCall.text);
    const secondParsed = ScriptOutputSchema.parse(secondJson);
    const secondRuleCheck = enforceSceneRules(secondParsed);

    if (!secondRuleCheck.valid) {
      throw new Error(
        `Script failed scene validation after retry: ${secondRuleCheck.errors.map((e) => e.message).join('; ')}`
      );
    }

    recordSpend(totalCost);
    return { script: secondParsed, costUsd: totalCost, retried: true };
  } catch (err: unknown) {
    if (retried) {
      throw err;
    }

    // JSON parse or schema failure on first attempt -> retry once
    retried = true;
    const message = err instanceof Error ? err.message : String(err);
    messages.push({ role: 'assistant', content: firstCall.text });
    messages.push({
      role: 'user',
      content: `Your output could not be parsed or failed schema validation: ${message}\n\nPlease output ONLY pure, well-formatted JSON conforming to the required schema.`,
    });

    const secondCall = await callClaudeApi(messages, model, apiKey);
    totalCost += secondCall.costUsd;

    const secondJson = extractJson(secondCall.text);
    const secondParsed = ScriptOutputSchema.parse(secondJson);
    const secondRuleCheck = enforceSceneRules(secondParsed);

    if (!secondRuleCheck.valid) {
      throw new Error(
        `Script failed scene validation after retry: ${secondRuleCheck.errors.map((e) => e.message).join('; ')}`
      );
    }

    recordSpend(totalCost);
    return { script: secondParsed, costUsd: totalCost, retried: true };
  }
}
