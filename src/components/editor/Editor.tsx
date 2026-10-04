import type { DragEvent } from 'react';
import type { Chapter, ManuscriptBlock, RevisionSuggestion, Section } from '../../types/manuscript';
import { EditorBlock } from './EditorBlock';

interface EditorProps {
  chapter?: Chapter;
  section: Section;
  suggestions: RevisionSuggestion[];
  activeBlockId: string | null;
  draggedBlockId: string | null;
  dragOverBlockId: string | null;
  highlightedBlockId: string | null;
  onClearSelection: () => void;
  onSelectBlock: (blockId: string) => void;
  onOpenSuggestion: (suggestionId: string, blockId: string) => void;
  onChangeBlock: (blockId: string, text: string) => void;
  onAddBlockAfter: (afterBlockId?: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onRequestReview: (blockId: string) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, blockId: string) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>, blockId: string) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, targetBlockId: string) => void;
}

export function Editor({ chapter, section, suggestions, activeBlockId, draggedBlockId, dragOverBlockId, highlightedBlockId, onClearSelection, onSelectBlock, onOpenSuggestion, onChangeBlock, onAddBlockAfter, onDeleteBlock, onRequestReview, onDragStart, onDragEnd, onDragOver, onDrop }: EditorProps) {
  return (
    <div className="editor-scroll" onClick={onClearSelection}>
      <article className="paper" onClick={(event) => event.stopPropagation()}>
        <div className="paper-meta"><span>{chapter?.title ?? '원고'}</span><span>{section.fileName}</span></div>
        <h1>{section.title}</h1><div className="title-rule" />
        <div className="blocks">
          {section.blocks.map((block: ManuscriptBlock) => {
            const blockSuggestions = suggestions.filter((item) => item.documentId === section.id && item.blockId === block.id && item.status === 'draft');
            return <EditorBlock
              key={block.id}
              block={block}
              active={activeBlockId === block.id}
              dragging={draggedBlockId === block.id}
              dragOver={dragOverBlockId === block.id && draggedBlockId !== block.id}
              highlighted={highlightedBlockId === block.id}
              suggestionCount={blockSuggestions.length}
              onOpenSuggestion={() => blockSuggestions[0] && onOpenSuggestion(blockSuggestions[0].suggestionId, block.id)}
              onSelect={() => onSelectBlock(block.id)}
              onChange={(text) => onChangeBlock(block.id, text)}
              onAddAfter={() => onAddBlockAfter(block.id)}
              onDelete={() => onDeleteBlock(block.id)}
              onRequestReview={() => onRequestReview(block.id)}
              onDragStart={(event) => onDragStart(event, block.id)}
              onDragEnd={onDragEnd}
              onDragOver={(event) => onDragOver(event, block.id)}
              onDrop={(event) => onDrop(event, block.id)}
            />;
          })}
        </div>
        <button className="add-paragraph" onClick={() => onAddBlockAfter()}>+ 새 문단 추가</button>
      </article>
    </div>
  );
}
