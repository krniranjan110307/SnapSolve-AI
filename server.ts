import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  analyzeStudyImage,
  answerFollowUpQuestion,
  PRIMARY_GEMMA_MODEL,
  GemmaServiceError,
} from './server/gemmaService.ts';
import type {
  AnalyzeRequestPayload,
  ApiErrorPayload,
  FollowUpRequestPayload,
} from './src/types/study.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Parse JSON payloads up to 12MB to accommodate compressed high-DPI study photos
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      model: GEMMA_MODEL_ID,
      apiKeyConfigured: Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      ),
    });
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const payload = req.body as AnalyzeRequestPayload;
      const guide = await analyzeStudyImage(payload);
      res.json({ guide });
    } catch (err) {
      if (err instanceof GemmaServiceError) {
        const body: ApiErrorPayload = {
          error: {
            code: err.code,
            message: err.message,
            retryable: err.retryable,
          },
        };
        res.status(err.statusCode).json(body);
        return;
      }

      const body: ApiErrorPayload = {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected server error occurred while analyzing your study image.',
          retryable: true,
        },
      };
      res.status(500).json(body);
    }
  });

  app.post('/api/followup', async (req, res) => {
    try {
      const payload = req.body as FollowUpRequestPayload;
      const result = await answerFollowUpQuestion(payload);
      res.json(result);
    } catch (err) {
      if (err instanceof GemmaServiceError) {
        const body: ApiErrorPayload = {
          error: {
            code: err.code,
            message: err.message,
            retryable: err.retryable,
          },
        };
        res.status(err.statusCode).json(body);
        return;
      }

      const body: ApiErrorPayload = {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected server error occurred while answering your question.',
          retryable: true,
        },
      };
      res.status(500).json(body);
    }
  });

  // Catch oversized payloads cleanly with JSON instead of HTML error pages
  app.use(
    (
      err: Error & { type?: string; status?: number },
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (err?.type === 'entity.too.large' || err?.status === 413) {
        const body: ApiErrorPayload = {
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'The uploaded image is too large. Please upload an image under 15 MB.',
            retryable: false,
          },
        };
        res.status(413).json(body);
        return;
      }
      next(err);
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SnapSolve AI server running on http://0.0.0.0:${PORT} (model: ${GEMMA_MODEL_ID})`);
  });
}

startServer();
