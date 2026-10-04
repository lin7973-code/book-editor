import type { Manuscript } from '../../types/manuscript';

export interface ManuscriptRepository {
  load(): Promise<Manuscript | null>;
  save(manuscript: Manuscript): Promise<void>;
}
