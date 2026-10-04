import type { Manuscript } from '../../types/manuscript';
import type { ManuscriptRepository } from './ManuscriptRepository';

export class LocalStorageManuscriptRepository implements ManuscriptRepository {
  constructor(private readonly storageKey: string) {}

  async load(): Promise<Manuscript | null> {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? (JSON.parse(raw) as Manuscript) : null;
  }

  async save(manuscript: Manuscript): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(manuscript));
  }
}
