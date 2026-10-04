import type { Manuscript } from '../../types/manuscript';
import { bookManuscript } from '../content/bookManuscript';
import { ensurePersistentBlockIds } from '../../features/manuscript/manuscriptUtils';
import type { ManuscriptRepository } from '../repositories/ManuscriptRepository';

export class ManuscriptService {
  constructor(private readonly repository: ManuscriptRepository) {}

  async load(): Promise<Manuscript> {
    try {
      const stored = await this.repository.load();
      const manuscript = ensurePersistentBlockIds(stored ?? bookManuscript);
      await this.repository.save(manuscript);
      return manuscript;
    } catch {
      return ensurePersistentBlockIds(bookManuscript);
    }
  }

  async save(manuscript: Manuscript): Promise<void> {
    await this.repository.save(manuscript);
  }
}
