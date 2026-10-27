/**
 * Shared TypeScript contracts between the React frontend and Express backend.
 * Keep this module strictly free of browser-only or asset imports so Node/tsx can import it cleanly.
 */

export type DifficultyLevel = 'Introductory' | 'Intermediate' | 'Advanced';

export type QuestionType = 'multiple_choice' | 'short_answer';

export interface ExplanationStep {
  stepNumber: number;
  heading: string;
  explanation: string;
  formulaOrNote?: string;
}

export interface KeyConcept {
  term: string;
  definition: string;
  whyItMatters: string;
  formulaOrSymbol?: string;
}

export interface PracticeQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctOptionIndex?: number;
  answer: string;
  hint: string;
  explanation: string;
}

export interface StudyGuide {
  title: string;
  subject: string;
  topic: string;
  difficulty: DifficultyLevel;
  detectedMaterialType: string;
  readabilityWarning?: string;
  plainEnglishOverview: string;
  executiveSummary: string[];
  explanationSteps: ExplanationStep[];
  keyConcepts: KeyConcept[];
  practiceQuestions: PracticeQuestion[];
  suggestedFollowUps: string[];
  modelUsed: string;
}

export interface FollowUpTurn {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  createdAt: string;
  fileName: string;
  thumbnailDataUrl: string;
  imageMimeType: string;
  focusPrompt?: string;
  guide: StudyGuide;
  followUps: FollowUpTurn[];
}

export interface AnalyzeRequestPayload {
  imageBase64: string;
  mimeType: string;
  focusPrompt?: string;
}

export interface AnalyzeResponsePayload {
  guide: StudyGuide;
}

export interface FollowUpRequestPayload {
  imageBase64?: string;
  mimeType?: string;
  studyContext: {
    title: string;
    subject: string;
    topic: string;
    plainEnglishOverview: string;
    executiveSummary: string[];
  };
  history: Array<{
    question: string;
    answer: string;
  }>;
  question: string;
}

export interface FollowUpResponsePayload {
  answer: string;
  modelUsed: string;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
}
