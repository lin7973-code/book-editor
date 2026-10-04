import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Chapter } from '../../types/manuscript';
import { SectionItem } from './SectionItem';

interface ChapterItemProps {
  chapter: Chapter;
  collapsed: boolean;
  activeSectionId: string;
  onToggle: (chapterId: string) => void;
  onSelectSection: (sectionId: string) => void;
}

export function ChapterItem({
  chapter,
  collapsed,
  activeSectionId,
  onToggle,
  onSelectSection,
}: ChapterItemProps) {
  return (
    <div className="chapter">
      <button className="chapter-button" onClick={() => onToggle(chapter.id)}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        <span>{chapter.title}</span>
      </button>

      {!collapsed &&
        chapter.sections.map((section) => (
          <SectionItem
            key={section.id}
            section={section}
            active={activeSectionId === section.id}
            onSelect={onSelectSection}
          />
        ))}
    </div>
  );
}
