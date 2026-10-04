import { AlertCircle, CheckCircle2, Download, LoaderCircle, MoreHorizontal, Upload } from 'lucide-react';
import type { SaveStatus } from '../types/manuscript';

interface TopbarProps {
  chapterTitle: string;
  sectionTitle: string;
  fileName: string;
  saveStatus: SaveStatus;
  onSave: () => void;
}

export function Topbar({ chapterTitle, sectionTitle, fileName, saveStatus, onSave }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumbs" aria-label="현재 원고 위치">
        <span>{chapterTitle}</span>
        <span>/</span>
        <strong>{sectionTitle}</strong>
        <span className="file-pill">{fileName}</span>
      </div>

      <div className="topbar-actions">
        <div className={`save-status save-status--${saveStatus}`} aria-live="polite">
          {saveStatus === 'saving' && <><LoaderCircle size={14} className="save-spinner" /> 저장 중</>}
          {saveStatus === 'saved' && <><CheckCircle2 size={14} /> 저장 완료</>}
          {saveStatus === 'error' && <><AlertCircle size={14} /> 저장 실패</>}
        </div>
        <button title="Markdown 불러오기 기능 예정">
          <Upload size={16} /> 불러오기
        </button>
        <button onClick={onSave} title="현재 원고를 즉시 저장">
          <Download size={16} /> 저장
        </button>
        <button className="icon-button" title="추가 기능">
          <MoreHorizontal size={17} />
        </button>
      </div>
    </header>
  );
}
