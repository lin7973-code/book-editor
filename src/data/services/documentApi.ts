import type { ManuscriptBlock } from '../../types/manuscript';

export interface ServerDocument {
  documentId: string;
  sourcePath: string;
  markdown: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? `문서 API 요청에 실패했습니다. (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export const documentApi = {
  list(): Promise<ServerDocument[]> {
    return request<ServerDocument[]>('/api/documents');
  },

  update(documentId: string, blocks: ManuscriptBlock[]): Promise<{ documentId: string; sourcePath: string; savedAt: string }> {
    return request(`/api/documents/${encodeURIComponent(documentId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ blocks }),
    });
  },
};
