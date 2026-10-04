import type { Manuscript, ManuscriptBlock } from '../../types/manuscript';

export function createBlockId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `block_${crypto.randomUUID()}`;
  }
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function ensurePersistentBlockIds(manuscript: Manuscript): Manuscript {
  let changed = false;
  const seen = new Set<string>();

  const next: Manuscript = {
    ...manuscript,
    chapters: manuscript.chapters.map((chapter) => ({
      ...chapter,
      sections: chapter.sections.map((section) => ({
        ...section,
        blocks: section.blocks.map((block) => {
          if (block.id && !seen.has(block.id)) {
            seen.add(block.id);
            return block;
          }

          changed = true;
          const id = createBlockId();
          seen.add(id);
          return { ...block, id };
        }),
      })),
    })),
  };

  return changed ? { ...next, updatedAt: new Date().toISOString() } : manuscript;
}

export function updateBlockText(
  manuscript: Manuscript,
  blockId: string,
  text: string,
): Manuscript {
  return {
    ...manuscript,
    updatedAt: new Date().toISOString(),
    chapters: manuscript.chapters.map((chapter) => ({
      ...chapter,
      sections: chapter.sections.map((section) => ({
        ...section,
        blocks: section.blocks.map((block) =>
          block.id === blockId ? { ...block, text } : block,
        ),
      })),
    })),
  };
}

export function addBlockAfter(
  manuscript: Manuscript,
  sectionId: string,
  afterBlockId?: string,
): Manuscript {
  const block: ManuscriptBlock = {
    id: createBlockId(),
    type: 'paragraph',
    text: '',
  };

  return {
    ...manuscript,
    updatedAt: new Date().toISOString(),
    chapters: manuscript.chapters.map((chapter) => ({
      ...chapter,
      sections: chapter.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (!afterBlockId) return { ...section, blocks: [...section.blocks, block] };

        const index = section.blocks.findIndex((item) => item.id === afterBlockId);
        if (index < 0) return { ...section, blocks: [...section.blocks, block] };

        const blocks = [...section.blocks];
        blocks.splice(index + 1, 0, block);
        return { ...section, blocks };
      }),
    })),
  };
}

export function deleteBlock(
  manuscript: Manuscript,
  sectionId: string,
  blockId: string,
): Manuscript {
  return {
    ...manuscript,
    updatedAt: new Date().toISOString(),
    chapters: manuscript.chapters.map((chapter) => ({
      ...chapter,
      sections: chapter.sections.map((section) =>
        section.id === sectionId
          ? { ...section, blocks: section.blocks.filter((block) => block.id !== blockId) }
          : section,
      ),
    })),
  };
}

export function moveBlock(
  manuscript: Manuscript,
  sectionId: string,
  draggedBlockId: string,
  targetBlockId: string,
): Manuscript {
  if (draggedBlockId === targetBlockId) return manuscript;

  return {
    ...manuscript,
    updatedAt: new Date().toISOString(),
    chapters: manuscript.chapters.map((chapter) => ({
      ...chapter,
      sections: chapter.sections.map((section) => {
        if (section.id !== sectionId) return section;

        const fromIndex = section.blocks.findIndex((block) => block.id === draggedBlockId);
        const toIndex = section.blocks.findIndex((block) => block.id === targetBlockId);
        if (fromIndex < 0 || toIndex < 0) return section;

        const blocks = [...section.blocks];
        const [dragged] = blocks.splice(fromIndex, 1);
        const insertionIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
        blocks.splice(insertionIndex, 0, dragged);

        return { ...section, blocks };
      }),
    })),
  };
}
