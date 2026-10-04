export type BlockType = 'paragraph' | 'heading' | 'quote';

export interface ManuscriptBlock {
  id: string;
  type: BlockType;
  text: string;
}

export interface Section {
  id: string;
  title: string;
  fileName: string;
  sourcePath?: string;
  chapter?: number;
  sectionNumber?: string;
  order?: number;
  blocks: ManuscriptBlock[];
}

export interface Chapter {
  id: string;
  title: string;
  sections: Section[];
}

export interface Manuscript {
  id: string;
  title: string;
  subtitle?: string;
  chapters: Chapter[];
  updatedAt: string;
}

export type ReviewStatus = 'pending' | 'completed';

export interface RevisionAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  order: number;
}

export interface RevisionRequest {
  requestId: string;
  blockId: string;
  sectionId: string;
  content: string;
  createdAt: string;
  status: ReviewStatus;
  attachments: RevisionAttachment[];
}

export type SaveStatus = 'saved' | 'saving' | 'error';

export type RevisionSuggestionStatus = 'draft' | 'approved' | 'rejected';

export interface RevisionSuggestion {
  suggestionId: string;
  requestId: string;
  documentId: string;
  blockId: string;
  originalText: string;
  suggestedText: string;
  createdAt: string;
  status: RevisionSuggestionStatus;
}
