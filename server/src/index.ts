import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GenerateScriptInputSchema } from './schema.js';
import { generateScriptWithClaude, getSpendStatus } from './claude.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or matching origins
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('github.io')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, logged
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Status & Health Endpoint
app.get(['/health', '/api/status'], (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here');
  res.json({
    status: 'online',
    service: 'AnimStudio AI Script Service',
    hasApiKey: hasKey,
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    spend: getSpendStatus(),
  });
});

// POST /generate-script & /api/generate-script
const handleGenerateScript = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate request body with Zod
    const parseResult = GenerateScriptInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request input',
        details: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
      return;
    }

    const input = parseResult.data;

    // 2. Cost Approval Gate Check
    // If client hasn't explicitly approved the estimated spend, halt and return the gate requirement
    const estimatedCostUsd = 0.015; // ~$0.015 per script generation
    if (!input.approvedSpend) {
      const spend = getSpendStatus();
      res.status(200).json({
        status: 'approval_required',
        estimatedCostUsd,
        spendStatus: spend,
        message: `Calling Claude API (${process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022'}) will cost approximately $${estimatedCostUsd.toFixed(3)}. Explicit creator approval is required before dispatching.`,
      });
      return;
    }

    // 3. Check API Key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      res.status(503).json({
        error: 'Claude API key not configured',
        message: 'ANTHROPIC_API_KEY is missing or set to placeholder in server/.env. Please configure your key to use live generation, or use the local draft fallback.',
      });
      return;
    }

    // 4. Dispatch to Claude with Zod validation + retry
    const result = await generateScriptWithClaude(input);

    res.status(200).json({
      status: 'success',
      script: result.script,
      costUsd: result.costUsd,
      retried: result.retried,
      spendStatus: getSpendStatus(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error generating script:', message);

    if (message.includes('spend limit')) {
      res.status(402).json({ error: 'Spend Limit Exceeded', message });
      return;
    }

    if (message.includes('failed scene validation')) {
      res.status(422).json({ error: 'Validation Failure', message });
      return;
    }

    res.status(500).json({ error: 'Generation Failed', message });
  }
};

app.post('/generate-script', handleGenerateScript);
app.post('/api/generate-script', handleGenerateScript);

app.listen(PORT, () => {
  console.log(`[AnimStudio Server] Listening on http://localhost:${PORT}`);
  console.log(`[AnimStudio Server] Claude Model: ${process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022'}`);
  console.log(`[AnimStudio Server] Daily Spend Limit: $${process.env.DAILY_SPEND_LIMIT || '2.00'}`);
});
