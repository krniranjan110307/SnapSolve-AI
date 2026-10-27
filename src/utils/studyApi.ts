import type {
  AnalyzeRequestPayload,
  AnalyzeResponsePayload,
  ApiErrorPayload,
  FollowUpRequestPayload,
  FollowUpResponsePayload,
  StudyGuide,
} from '../types/study';

export class StudyApiClientError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;

  constructor(code: string, message: string, retryable = true) {
    super(message);
    this.name = 'StudyApiClientError';
    this.code = code;
    this.retryable = retryable;
  }
}

async function parseErrorResponse(res: Response): Promise<StudyApiClientError> {
  try {
    const data = (await res.json()) as Partial<ApiErrorPayload>;
    if (data?.error?.message) {
      return new StudyApiClientError(
        data.error.code || `HTTP_${res.status}`,
        data.error.message,
        data.error.retryable ?? res.status >= 500
      );
    }
  } catch {
    // Fall through to status-based error
  }

  if (res.status === 413) {
    return new StudyApiClientError(
      'PAYLOAD_TOO_LARGE',
      'This image is too large to send. Try cropping closer to the diagram or question.',
      false
    );
  }

  return new StudyApiClientError(
    `HTTP_${res.status}`,
    `Request failed with status ${res.status}. Please check your connection and try again.`,
    true
  );
}

export async function requestStudyAnalysis(
  payload: AnalyzeRequestPayload,
  signal?: AbortSignal
): Promise<StudyGuide> {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    const data = (await res.json()) as AnalyzeResponsePayload;
    if (!data?.guide) {
      throw new StudyApiClientError(
        'INVALID_PAYLOAD',
        'Received an incomplete study guide from the server.',
        true
      );
    }

    return data.guide;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    if (err instanceof StudyApiClientError) {
      throw err;
    }
    throw new StudyApiClientError(
      'NETWORK_ERROR',
      'Unable to reach the SnapSolve AI server. Please check your network connection and retry.',
      true
    );
  }
}

export async function requestFollowUpAnswer(
  payload: FollowUpRequestPayload,
  signal?: AbortSignal
): Promise<FollowUpResponsePayload> {
  try {
    const res = await fetch('/api/followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    const data = (await res.json()) as FollowUpResponsePayload;
    if (!data?.answer) {
      throw new StudyApiClientError(
        'EMPTY_ANSWER',
        'The server returned an empty follow-up response.',
        true
      );
    }

    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    if (err instanceof StudyApiClientError) {
      throw err;
    }
    throw new StudyApiClientError(
      'NETWORK_ERROR',
      'Network error while sending follow-up question. Please try again.',
      true
    );
  }
}
