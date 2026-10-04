import { GripVertical, MessageSquareText, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { DragEvent, MouseEvent } from 'react';
import type { ManuscriptBlock } from '../../types/manuscript';

interface EditorBlockProps {
  block: ManuscriptBlock;
  active: boolean;
  dragging: boolean;
  dragOver: boolean;
  highlighted: boolean;
  suggestionCount: number;
  onOpenSuggestion: () => void;
  onChange: (text: string) => void;
  onSelect: () => void;
  onAddAfter: () => void;
  onDelete: () => void;
  onRequestReview: () => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}

export function EditorBlock(props: EditorBlockProps) {
  const { block, active, dragging, dragOver, highlighted, suggestionCount, onOpenSuggestion, onChange, onSelect, onAddAfter, onDelete, onRequestReview, onDragStart, onDragEnd, onDragOver, onDrop } = props;
  const stopAndDelete = (event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); onDelete(); };
  return (
    <div className={`editor-block ${active ? 'editor-block--active' : ''} ${highlighted ? 'editor-block--highlighted' : ''} ${dragging ? 'editor-block--dragging' : ''} ${dragOver ? 'editor-block--drag-over' : ''} ${suggestionCount ? 'editor-block--has-suggestion' : ''}`} data-block-id={block.id} onClick={onSelect} onDragOver={onDragOver} onDrop={onDrop}>
      <button className="block-handle" aria-label="문단 순서 변경" title="드래그하여 문단 이동" draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={(event) => event.stopPropagation()}><GripVertical size={16} /></button>
      <div className={`block-content block-content--${block.type}`} contentEditable suppressContentEditableWarning spellCheck onFocus={onSelect} onInput={(event) => onChange(event.currentTarget.textContent ?? '')}>{block.text}</div>
      {suggestionCount > 0 && <button className="block-suggestion-badge" onClick={(event) => { event.stopPropagation(); onSelect(); onOpenSuggestion(); }} title="수정 제안 보기"><Sparkles size={12} /> 제안 {suggestionCount}</button>}
      <div className="block-actions">
        <button className="review-block-button" onClick={(event) => { event.stopPropagation(); onSelect(); onRequestReview(); }} title="수정 요청 작성"><MessageSquareText size={15} /></button>
        <button onClick={(event) => { event.stopPropagation(); onAddAfter(); }} title="아래에 새 문단 추가"><Plus size={15} /></button>
        <button className="delete-block" onClick={stopAndDelete} title="문단 삭제"><Trash2 size={15} /></button>
      </div>
      {active && <span className="block-id-badge">{block.id.slice(0, 18)}…</span>}
    </div>
  );
}
