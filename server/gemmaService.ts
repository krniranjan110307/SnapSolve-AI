import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type {
  AnalyzeRequestPayload,
  DifficultyLevel,
  FollowUpRequestPayload,
  PracticeQuestion,
  StudyGuide,
} from '../src/types/study.ts';

export const PRIMARY_GEMMA_MODEL = 'gemma-4-31b-it';
export const FALLBACK_GEMMA_MODEL = 'gemma-4-26b-a4b-it';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new GemmaServiceError(
      'MISSING_API_KEY',
      'Server GEMINI_API_KEY is not configured. Configure it in your environment or AI Studio Secrets panel.',
      false,
      500
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export class GemmaServiceError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly statusCode: number;

  constructor(code: string, message: string, retryable: boolean, statusCode = 500) {
    super(message);
    this.name = 'GemmaServiceError';
    this.code = code;
    this.retryable = retryable;
    this.statusCode = statusCode;
  }
}

function isTransientUpstreamError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('"code":500') ||
    msg.includes('"code":503') ||
    msg.includes('INTERNAL') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('overloaded')
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls Gemma 4 31B first (`gemma-4-31b-it`), retrying once on transient upstream 500/503
 * errors and seamlessly falling back to Gemma 4 26B (`gemma-4-26b-a4b-it`) if the 31B
 * endpoint experiences temporary server-side capacity issues.
 */
async function generateWithGemmaResilience(
  ai: GoogleGenAI,
  requestFactory: (model: string) => Parameters<typeof ai.models.generateContent>[0]
): Promise<{ text: string; modelUsed: string }> {
  const candidates = [
    { model: PRIMARY_GEMMA_MODEL, backoffMs: 0 },
    { model: PRIMARY_GEMMA_MODEL, backoffMs: 600 },
    { model: FALLBACK_GEMMA_MODEL, backoffMs: 250 },
  ];

  let lastError: unknown = null;

  for (const attempt of candidates) {
    if (attempt.backoffMs > 0) {
      await delay(attempt.backoffMs);
    }

    try {
      const response = await ai.models.generateContent(requestFactory(attempt.model));
      const text = response.text?.trim();
      if (text) {
        return { text, modelUsed: attempt.model };
      }
      lastError = new Error('Empty model response');
    } catch (err) {
      lastError = err;
      if (!isTransientUpstreamError(err)) {
        throw err;
      }
    }
  }

  throw lastError ?? new Error('Gemma 4 inference failed after retries.');
}

/**
 * Extracts a valid JSON object from Gemma 4's text output, stripping optional
 * markdown code fences (```json ... ```) or surrounding commentary if present.
 */
function parseModelJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const stripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    const firstBrace = stripped.indexOf('{');
    const lastBrace = stripped.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = stripped.slice(firstBrace, lastBrace + 1);
      return JSON.parse(candidate) as Record<string, unknown>;
    }
    throw new GemmaServiceError(
      'INVALID_MODEL_JSON',
      'Gemma 4 returned an unexpected format. Please click retry to analyze again.',
      true,
      502
    );
  }
}

function normalizeDifficulty(val: unknown): DifficultyLevel {
  if (val === 'Introductory' || val === 'Intermediate' || val === 'Advanced') {
    return val;
  }
  return 'Intermediate';
}

const STUDY_GUIDE_INSTRUCTIONS = [
  'Analyze this academic study image carefully—inspecting every diagram label, arrow, axis, equation, handwritten note, or printed passage.',
  'Never invent unreadable symbols or numbers. If any region is blurry, dark, or cropped, explain that honestly in "readabilityWarning"; otherwise set "readabilityWarning" to "".',
  'Keep every explanation crisp, scannable, and beginner-friendly (1 to 3 concise sentences per step/concept—no walls of text).',
  'Return ONLY a single valid JSON object (no markdown text outside the JSON) with these exact keys:',
  '- "title": string (clear academic title of the material)',
  '- "subject": string (e.g., Biology, Physics, Calculus, Chemistry, History)',
  '- "topic": string (specific subtopic)',
  '- "difficulty": "Introductory" | "Intermediate" | "Advanced"',
  '- "detectedMaterialType": string (e.g., "Textbook Diagram", "Handwritten Notes", "Printed Problem")',
  '- "readabilityWarning": string ("" if clear, or honest note if partially illegible)',
  '- "plainEnglishOverview": string (2-3 intuitive sentences explaining the big picture)',
  '- "executiveSummary": array of 4 concise takeaway strings',
  '- "explanationSteps": array of 4 objects, each with { "stepNumber": number, "heading": string, "explanation": string, "formulaOrNote": string }',
  '- "keyConcepts": array of 4 objects, each with { "term": string, "definition": string, "whyItMatters": string, "formulaOrSymbol": string }',
  '- "practiceQuestions": array of 4 objects (3 with "type": "multiple_choice" having 4 distinct strings in "options" and 0-3 "correctOptionIndex", plus 1 with "type": "short_answer" having "options": [] and "correctOptionIndex": 0), each with { "id": string, "type": string, "question": string, "options": string[], "correctOptionIndex": number, "answer": string, "hint": string, "explanation": string }',
  '- "suggestedFollowUps": array of 3 specific follow-up questions a student might ask about this image.',
].join('\n');

export async function analyzeStudyImage(payload: AnalyzeRequestPayload): Promise<StudyGuide> {
  const { imageBase64, mimeType, focusPrompt } = payload;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new GemmaServiceError(
      'INVALID_IMAGE',
      'Please attach a valid study image before analyzing.',
      false,
      400
    );
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new GemmaServiceError(
      'UNSUPPORTED_MIME',
      'Unsupported image format. Please upload a JPEG, PNG, or WebP image.',
      false,
      400
    );
  }

  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  if (cleanBase64.length > 12 * 1024 * 1024) {
    throw new GemmaServiceError(
      'IMAGE_TOO_LARGE',
      'The uploaded image exceeds the maximum size limit. Please try a smaller or cropped image.',
      false,
      413
    );
  }

  const ai = getGenAIClient();

  const focusDirective = focusPrompt?.trim()
    ? `Student's specific question / focus request: "${focusPrompt.trim()}". Address this directly within the overview and explanation steps.\n\n`
    : '';

  const userPrompt = `${focusDirective}${STUDY_GUIDE_INSTRUCTIONS}`;

  try {
    const { text: rawText, modelUsed } = await generateWithGemmaResilience(ai, (model) => ({
      model,
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: userPrompt,
        },
      ],
      config: {
        systemInstruction:
          'You are SnapSolve AI, an accurate, beginner-friendly university tutor powered by Gemma 4. Respond strictly with valid JSON.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        temperature: 0.2,
      },
    }));

    const parsed = parseModelJsonObject(rawText);

    const practiceQuestions: PracticeQuestion[] = Array.isArray(parsed.practiceQuestions)
      ? parsed.practiceQuestions.map((rawQ: unknown, idx: number) => {
          const q = (rawQ && typeof rawQ === 'object' ? rawQ : {}) as Record<string, unknown>;
          const isMcq =
            q.type === 'multiple_choice' &&
            Array.isArray(q.options) &&
            q.options.length >= 2;
          const options = isMcq ? (q.options as unknown[]).map(String).slice(0, 4) : [];
          const rawIdx = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0;
          const safeIdx = isMcq ? Math.min(Math.max(0, rawIdx), options.length - 1) : 0;

          return {
            id: typeof q.id === 'string' && q.id.trim() ? q.id : `q-${idx + 1}`,
            type: isMcq ? 'multiple_choice' : 'short_answer',
            question: String(q.question || `Question ${idx + 1}`),
            options: isMcq ? options : undefined,
            correctOptionIndex: isMcq ? safeIdx : undefined,
            answer: String(q.answer || (isMcq ? options[safeIdx] : '')),
            hint: String(q.hint || 'Review the key concepts and step-by-step breakdown above.'),
            explanation: String(q.explanation || ''),
          };
        })
      : [];

    const guide: StudyGuide = {
      title: String(parsed.title || 'Visual Study Guide'),
      subject: String(parsed.subject || 'General Studies'),
      topic: String(parsed.topic || 'Core Concepts'),
      difficulty: normalizeDifficulty(parsed.difficulty),
      detectedMaterialType: String(parsed.detectedMaterialType || 'Study Material'),
      readabilityWarning:
        typeof parsed.readabilityWarning === 'string' && parsed.readabilityWarning.trim().length > 0
          ? parsed.readabilityWarning.trim()
          : undefined,
      plainEnglishOverview: String(parsed.plainEnglishOverview || ''),
      executiveSummary: Array.isArray(parsed.executiveSummary)
        ? parsed.executiveSummary.map(String).filter(Boolean)
        : [],
      explanationSteps: Array.isArray(parsed.explanationSteps)
        ? parsed.explanationSteps.map((rawStep: unknown, idx: number) => {
            const step = (rawStep && typeof rawStep === 'object' ? rawStep : {}) as Record<
              string,
              unknown
            >;
            return {
              stepNumber: typeof step.stepNumber === 'number' ? step.stepNumber : idx + 1,
              heading: String(step.heading || `Step ${idx + 1}`),
              explanation: String(step.explanation || ''),
              formulaOrNote:
                typeof step.formulaOrNote === 'string' && step.formulaOrNote.trim().length > 0
                  ? step.formulaOrNote.trim()
                  : undefined,
            };
          })
        : [],
      keyConcepts: Array.isArray(parsed.keyConcepts)
        ? parsed.keyConcepts.map((rawConcept: unknown) => {
            const c = (rawConcept && typeof rawConcept === 'object' ? rawConcept : {}) as Record<
              string,
              unknown
            >;
            return {
              term: String(c.term || ''),
              definition: String(c.definition || ''),
              whyItMatters: String(c.whyItMatters || ''),
              formulaOrSymbol:
                typeof c.formulaOrSymbol === 'string' && c.formulaOrSymbol.trim().length > 0
                  ? c.formulaOrSymbol.trim()
                  : undefined,
            };
          })
        : [],
      practiceQuestions,
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
        ? parsed.suggestedFollowUps.map(String).filter(Boolean).slice(0, 4)
        : [],
      modelUsed,
    };

    return guide;
  } catch (err) {
    if (err instanceof GemmaServiceError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Unexpected model error';
    if (
      message.includes('429') ||
      message.toLowerCase().includes('quota') ||
      message.toLowerCase().includes('rate')
    ) {
      throw new GemmaServiceError(
        'RATE_LIMITED',
        'The Gemma 4 API rate limit was reached momentarily. Please wait a few seconds and retry.',
        true,
        429
      );
    }
    throw new GemmaServiceError(
      'ANALYSIS_FAILED',
      `Could not complete Gemma 4 visual analysis: ${message}`,
      true,
      502
    );
  }
}

export async function answerFollowUpQuestion(
  payload: FollowUpRequestPayload
): Promise<{ answer: string; modelUsed: string }> {
  const { imageBase64, mimeType, studyContext, history, question } = payload;

  const trimmedQuestion = question?.trim();
  if (!trimmedQuestion) {
    throw new GemmaServiceError('EMPTY_QUESTION', 'Please enter a follow-up question.', false, 400);
  }
  if (trimmedQuestion.length > 1000) {
    throw new GemmaServiceError(
      'QUESTION_TOO_LONG',
      'Please keep your follow-up question under 1,000 characters.',
      false,
      400
    );
  }

  const ai = getGenAIClient();

  const recentTurns = Array.isArray(history) ? history.slice(-6) : [];
  const formattedHistory =
    recentTurns.length > 0
      ? recentTurns
          .map((turn, idx) => `Q${idx + 1}: ${turn.question}\nA${idx + 1}: ${turn.answer}`)
          .join('\n\n')
      : 'No prior follow-up questions yet.';

  const contextBlock = [
    `Study Material Title: ${studyContext?.title || 'Uploaded Material'}`,
    `Subject & Topic: ${studyContext?.subject || 'Academic'} — ${studyContext?.topic || 'Study Guide'}`,
    `Overview: ${studyContext?.plainEnglishOverview || ''}`,
    `Summary Points: ${(studyContext?.executiveSummary || []).join(' | ')}`,
    `Previous Q&A History:\n${formattedHistory}`,
    `\nStudent's New Question: ${trimmedQuestion}`,
  ].join('\n');

  const contents: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];

  if (imageBase64 && mimeType && ALLOWED_MIME_TYPES.has(mimeType)) {
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    contents.push({
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    });
  }

  contents.push({ text: contextBlock });

  try {
    const { text: answer, modelUsed } = await generateWithGemmaResilience(ai, (model) => ({
      model,
      contents,
      config: {
        systemInstruction:
          'You are SnapSolve AI, a supportive, rigorous university tutor powered by Gemma 4. ' +
          "Answer the student's follow-up question directly using the uploaded study image and context. " +
          'Keep your response clear, well-structured, and concise (2 to 4 short paragraphs or clean numbered steps). ' +
          'Do not use markdown heading hashes (#); write clean prose or numbered lines, and if something is not visible in the image, state clearly that you are drawing on general subject knowledge.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        temperature: 0.3,
      },
    }));

    return {
      answer,
      modelUsed,
    };
  } catch (err) {
    if (err instanceof GemmaServiceError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Unexpected model error';
    throw new GemmaServiceError(
      'FOLLOWUP_FAILED',
      `Unable to answer follow-up question right now: ${message}`,
      true,
      502
    );
  }
}
