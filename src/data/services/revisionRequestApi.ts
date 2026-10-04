import type { RevisionAttachment, RevisionRequest, ReviewStatus } from '../../types/manuscript';

const BASE_URL = '/api/revision-requests';

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

export const revisionRequestApi = {
  async list(): Promise<RevisionRequest[]> {
    return parseResponse<RevisionRequest[]>(await fetch(BASE_URL));
  },

  async uploadImage(file: File): Promise<Omit<RevisionAttachment, 'order'>> {
    const response = await fetch('/api/uploads/revision-requests', {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
      },
      body: file,
    });
    return parseResponse<Omit<RevisionAttachment, 'order'>>(response);
  },

  async removeUpload(id: string): Promise<void> {
    await parseResponse<void>(await fetch(`/api/uploads/revision-requests/${encodeURIComponent(id)}`, { method: 'DELETE' }));
  },

  async create(input: { blockId: string; sectionId: string; content: string; attachments?: RevisionAttachment[] }): Promise<RevisionRequest> {
    return parseResponse<RevisionRequest>(await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }));
  },

  async update(requestId: string, patch: { status?: ReviewStatus; content?: string; attachments?: RevisionAttachment[] }): Promise<RevisionRequest> {
    return parseResponse<RevisionRequest>(await fetch(`${BASE_URL}/${encodeURIComponent(requestId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }));
  },

  async remove(requestId: string): Promise<void> {
    await parseResponse<void>(await fetch(`${BASE_URL}/${encodeURIComponent(requestId)}`, {
      method: 'DELETE',
    }));
  },
};
