import type { RevisionRequest, RevisionSuggestion, RevisionSuggestionStatus } from '../../types/manuscript';

const BASE_URL = '/api/revision-suggestions';

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json() as { message?: string };
      if (payload.message) message = payload.message;
    } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface SuggestionActionResult {
  suggestion: RevisionSuggestion;
  request?: RevisionRequest | null;
  document?: { documentId: string; blockId: string; text: string; savedAt: string };
}

export const revisionSuggestionApi = {
  async list(): Promise<RevisionSuggestion[]> {
    return parseResponse<RevisionSuggestion[]>(await fetch(BASE_URL));
  },

  async create(requestId: string): Promise<RevisionSuggestion> {
    return parseResponse<RevisionSuggestion>(await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
    }));
  },

  async update(suggestionId: string, patch: { suggestedText?: string; status?: RevisionSuggestionStatus }): Promise<RevisionSuggestion> {
    return parseResponse<RevisionSuggestion>(await fetch(`${BASE_URL}/${encodeURIComponent(suggestionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }));
  },

  async approve(suggestionId: string): Promise<SuggestionActionResult> {
    return parseResponse<SuggestionActionResult>(await fetch(`${BASE_URL}/${encodeURIComponent(suggestionId)}/approve`, { method: 'POST' }));
  },

  async reject(suggestionId: string): Promise<SuggestionActionResult> {
    return parseResponse<SuggestionActionResult>(await fetch(`${BASE_URL}/${encodeURIComponent(suggestionId)}/reject`, { method: 'POST' }));
  },

  async remove(suggestionId: string): Promise<void> {
    await parseResponse<void>(await fetch(`${BASE_URL}/${encodeURIComponent(suggestionId)}`, { method: 'DELETE' }));
  },
};
