import { FileText } from 'lucide-react';
import type { Section } from '../../types/manuscript';

interface SectionItemProps {
  section: Section;
  active: boolean;
  onSelect: (sectionId: string) => void;
}

export function SectionItem({ section, active, onSelect }: SectionItemProps) {
  return (
    <button
      className={`section-button ${active ? 'active' : ''}`}
      onClick={() => onSelect(section.id)}
      aria-current={active ? 'page' : undefined}
    >
      <FileText size={13} />
      <span>{section.title}</span>
    </button>
  );
}
