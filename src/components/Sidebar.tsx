import { BookOpen, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Manuscript } from '../types/manuscript';
import { ChapterItem } from './sidebar/ChapterItem';

interface SidebarProps {
  manuscript: Manuscript;
  activeSectionId: string;
  onSelectSection: (sectionId: string) => void;
}

export function Sidebar({ manuscript, activeSectionId, onSelectSection }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">M</div>
        <span>Manuscript</span>
      </div>

      <div className="document-card">
        <BookOpen size={17} />
        <div>
          <strong>{manuscript.title}</strong>
          <span>{manuscript.subtitle}</span>
        </div>
      </div>

      <div className="sidebar-heading">
        <span>목차</span>
        <button title="장 추가 기능 예정"><Plus size={15} /></button>
      </div>

      <nav className="toc">
        {manuscript.chapters.map((chapter) => (
          <ChapterItem
            key={chapter.id}
            chapter={chapter}
            collapsed={Boolean(collapsed[chapter.id])}
            activeSectionId={activeSectionId}
            onToggle={(chapterId) =>
              setCollapsed((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }))
            }
            onSelectSection={onSelectSection}
          />
        ))}
      </nav>

      <div className="sidebar-footer">자동 저장됨</div>
    </aside>
  );
}
