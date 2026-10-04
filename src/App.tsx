import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Editor } from './components/editor/Editor';
import { ReviewPanel } from './components/ReviewPanel';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import {
  addBlockAfter,
  deleteBlock,
  moveBlock,
  updateBlockText,
} from './features/manuscript/manuscriptUtils';
import { bookManuscript, buildBookManuscriptFromServer } from './data/content/bookManuscript';
import { revisionRequestApi } from './data/services/revisionRequestApi';
import { revisionSuggestionApi } from './data/services/revisionSuggestionApi';
import { documentApi } from './data/services/documentApi';
import type { Manuscript, RevisionRequest, RevisionSuggestion, SaveStatus, Section } from './types/manuscript';


const SAVE_DEBOUNCE_MS = 800;

export default function App() {
  const [manuscript, setManuscript] = useState<Manuscript>(bookManuscript);
  const [requests, setRequests] = useState<RevisionRequest[]>([]);
  const [suggestions, setSuggestions] = useState<RevisionSuggestion[]>([]);
  const [activeSectionId, setActiveSectionId] = useState(bookManuscript.chapters[0]?.sections[0]?.id ?? '');
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);
  const [focusSuggestionId, setFocusSuggestionId] = useState<string | null>(null);
  const [saveStates, setSaveStates] = useState<Record<string, SaveStatus>>({});
  const saveTimersRef = useRef<Record<string, number>>({});
  const saveVersionsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    void documentApi.list()
      .then((documents) => {
        const loaded = buildBookManuscriptFromServer(documents);
        setManuscript(loaded);
        setActiveSectionId((current) =>
          loaded.chapters.some((chapter) => chapter.sections.some((section) => section.id === current))
            ? current
            : loaded.chapters[0]?.sections[0]?.id ?? '',
        );
        setSaveStates(Object.fromEntries(
          loaded.chapters.flatMap((chapter) => chapter.sections).map((section) => [section.id, 'saved' as const]),
        ));
      })
      .catch((error) => {
        console.error('Failed to load Markdown documents from server', error);
        setSaveStates(Object.fromEntries(
          bookManuscript.chapters.flatMap((chapter) => chapter.sections).map((section) => [section.id, 'error' as const]),
        ));
      });
  }, []);

  useEffect(() => {
    void revisionRequestApi.list()
      .then(setRequests)
      .catch((error) => console.error('Failed to load revision requests', error));
  }, []);

  useEffect(() => {
    void revisionSuggestionApi.list()
      .then(setSuggestions)
      .catch((error) => console.error('Failed to load revision suggestions', error));
  }, []);

  useEffect(() => {
    return () => {
      Object.values(saveTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!highlightedBlockId) return;
    const frame = requestAnimationFrame(() => {
      document.querySelector(`[data-block-id="${CSS.escape(highlightedBlockId)}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
    const timer = window.setTimeout(() => setHighlightedBlockId(null), 1800);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [activeSectionId, highlightedBlockId]);

  const activeSection = useMemo(
    () => manuscript.chapters.flatMap((chapter) => chapter.sections).find((section) => section.id === activeSectionId)
      ?? manuscript.chapters[0]?.sections[0],
    [manuscript, activeSectionId],
  );

  const activeChapter = useMemo(
    () => manuscript.chapters.find((chapter) => chapter.sections.some((section) => section.id === activeSectionId)),
    [manuscript, activeSectionId],
  );

  const activeBlock = useMemo(
    () => activeSection?.blocks.find((block) => block.id === activeBlockId),
    [activeSection, activeBlockId],
  );

  const getSection = (source: Manuscript, sectionId: string) =>
    source.chapters.flatMap((chapter) => chapter.sections).find((section) => section.id === sectionId);

  const saveSectionNow = async (section: Section, version: number) => {
    setSaveStates((current) => ({ ...current, [section.id]: 'saving' }));
    try {
      await documentApi.update(section.id, section.blocks);
      if (saveVersionsRef.current[section.id] === version) {
        setSaveStates((current) => ({ ...current, [section.id]: 'saved' }));
      }
    } catch (error) {
      console.error('Failed to save Markdown document', error);
      if (saveVersionsRef.current[section.id] === version) {
        setSaveStates((current) => ({ ...current, [section.id]: 'error' }));
      }
    }
  };

  const scheduleSectionSave = (section: Section, immediate = false) => {
    const sectionId = section.id;
    const nextVersion = (saveVersionsRef.current[sectionId] ?? 0) + 1;
    saveVersionsRef.current[sectionId] = nextVersion;
    setSaveStates((current) => ({ ...current, [sectionId]: 'saving' }));

    const currentTimer = saveTimersRef.current[sectionId];
    if (currentTimer) window.clearTimeout(currentTimer);

    if (immediate) {
      delete saveTimersRef.current[sectionId];
      void saveSectionNow(section, nextVersion);
      return;
    }

    saveTimersRef.current[sectionId] = window.setTimeout(() => {
      delete saveTimersRef.current[sectionId];
      void saveSectionNow(section, nextVersion);
    }, SAVE_DEBOUNCE_MS);
  };

  const applyManuscriptChange = (next: Manuscript, sectionId: string, immediate = false) => {
    setManuscript(next);
    const section = getSection(next, sectionId);
    if (section) scheduleSectionSave(section, immediate);
  };

  if (!activeSection) return null;

  const findNewBlockId = (next: Manuscript, afterBlockId?: string) => {
    const section = getSection(next, activeSection.id);
    if (!section) return null;
    if (!afterBlockId) return section.blocks.at(-1)?.id ?? null;
    const index = section.blocks.findIndex((block) => block.id === afterBlockId);
    return section.blocks[index + 1]?.id ?? null;
  };

  const clearDrag = () => {
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  };

  const focusBlock = (blockId: string) => {
    setActiveBlockId(blockId);
    requestAnimationFrame(() => {
      document.querySelector(`[data-block-id="${CSS.escape(blockId)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const navigateToRequest = (request: RevisionRequest) => {
    const targetExists = manuscript.chapters.some((chapter) =>
      chapter.sections.some((section) =>
        section.id === request.sectionId && section.blocks.some((block) => block.id === request.blockId),
      ),
    );
    if (!targetExists) return;

    setActiveSectionId(request.sectionId);
    setActiveBlockId(request.blockId);
    setHighlightedBlockId(request.blockId);
    clearDrag();
  };

  const addComment = async (content: string, images: File[]): Promise<boolean> => {
    if (!activeBlockId) return false;
    const uploaded = [];
    try {
      for (const [index, image] of images.entries()) {
        const uploadedImage = await revisionRequestApi.uploadImage(image);
        uploaded.push({ ...uploadedImage, order: index });
      }
      const created = await revisionRequestApi.create({
        blockId: activeBlockId,
        sectionId: activeSection.id,
        content,
        attachments: uploaded,
      });
      setRequests((current) => [...current, created]);
      return true;
    } catch (error) {
      console.error('Failed to create revision request', error);
      await Promise.allSettled(uploaded.map((attachment) => revisionRequestApi.removeUpload(attachment.id)));
      return false;
    }
  };

  const setRequestStatus = async (requestId: string, status: RevisionRequest['status']) => {
    try {
      const updated = await revisionRequestApi.update(requestId, { status });
      setRequests((current) => current.map((request) => request.requestId === requestId ? updated : request));
    } catch (error) {
      console.error('Failed to update revision request', error);
    }
  };

  const createSuggestion = async (requestId: string): Promise<boolean> => {
    try {
      const created = await revisionSuggestionApi.create(requestId);
      setSuggestions((current) => [...current, created]);
      return true;
    } catch (error) {
      console.error('Failed to create revision suggestion', error);
      return false;
    }
  };


  const openSuggestion = (suggestionId: string, blockId: string) => {
    setActiveBlockId(blockId);
    setFocusSuggestionId(suggestionId);
  };

  const approveSuggestion = async (suggestionId: string): Promise<boolean> => {
    try {
      const result = await revisionSuggestionApi.approve(suggestionId);
      setSuggestions((current) => current.map((item) => item.suggestionId === suggestionId ? result.suggestion : item));
      if (result.request) setRequests((current) => current.map((item) => item.requestId === result.request?.requestId ? result.request! : item));
      if (result.document) {
        const { blockId, text } = result.document;
        setManuscript((current) => updateBlockText(current, blockId, text));
        setSaveStates((current) => ({ ...current, [result.document!.documentId]: 'saved' }));
        setActiveSectionId(result.document.documentId);
        setActiveBlockId(blockId);
        setHighlightedBlockId(blockId);
      }
      return true;
    } catch (error) {
      console.error('Failed to approve revision suggestion', error);
      return false;
    }
  };

  const rejectSuggestion = async (suggestionId: string): Promise<boolean> => {
    try {
      const result = await revisionSuggestionApi.reject(suggestionId);
      setSuggestions((current) => current.map((item) => item.suggestionId === suggestionId ? result.suggestion : item));
      return true;
    } catch (error) {
      console.error('Failed to reject revision suggestion', error);
      return false;
    }
  };

  const deleteRequestsForBlock = async (blockId: string) => {
    const linked = requests.filter((request) => request.blockId === blockId);
    await Promise.allSettled(linked.map((request) => revisionRequestApi.remove(request.requestId)));
    setRequests((current) => current.filter((request) => request.blockId !== blockId));
  };

  const manualSave = () => {
    const section = getSection(manuscript, activeSection.id);
    if (section) scheduleSectionSave(section, true);
  };

  return (
    <div className="app-shell app-shell--review-open">
      <Sidebar
        manuscript={manuscript}
        activeSectionId={activeSection.id}
        onSelectSection={(id) => {
          setActiveSectionId(id);
          setActiveBlockId(null);
          clearDrag();
        }}
      />

      <main className="workspace">
        <Topbar
          chapterTitle={activeChapter?.title ?? ''}
          sectionTitle={activeSection.title}
          fileName={activeSection.fileName}
          saveStatus={saveStates[activeSection.id] ?? 'saved'}
          onSave={manualSave}
        />

        <Editor
          chapter={activeChapter}
          section={activeSection}
          suggestions={suggestions}
          activeBlockId={activeBlockId}
          draggedBlockId={draggedBlockId}
          dragOverBlockId={dragOverBlockId}
          highlightedBlockId={highlightedBlockId}
          onClearSelection={() => setActiveBlockId(null)}
          onSelectBlock={setActiveBlockId}
          onOpenSuggestion={openSuggestion}
          onRequestReview={focusBlock}
          onChangeBlock={(blockId, text) => {
            const next = updateBlockText(manuscript, blockId, text);
            applyManuscriptChange(next, activeSection.id);
          }}
          onAddBlockAfter={(afterBlockId) => {
            const next = addBlockAfter(manuscript, activeSection.id, afterBlockId);
            applyManuscriptChange(next, activeSection.id);
            setActiveBlockId(findNewBlockId(next, afterBlockId));
          }}
          onDeleteBlock={(blockId) => {
            const next = deleteBlock(manuscript, activeSection.id, blockId);
            applyManuscriptChange(next, activeSection.id);
            void deleteRequestsForBlock(blockId);
            if (activeBlockId === blockId) setActiveBlockId(null);
          }}
          onDragStart={(event: DragEvent<HTMLButtonElement>, blockId) => {
            setDraggedBlockId(blockId);
            setActiveBlockId(blockId);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', blockId);
          }}
          onDragEnd={clearDrag}
          onDragOver={(event, blockId) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setDragOverBlockId(blockId);
          }}
          onDrop={(event, targetBlockId) => {
            event.preventDefault();
            const sourceBlockId = draggedBlockId ?? event.dataTransfer.getData('text/plain');
            if (!sourceBlockId) return;
            const next = moveBlock(manuscript, activeSection.id, sourceBlockId, targetBlockId);
            applyManuscriptChange(next, activeSection.id);
            clearDrag();
          }}
        />
      </main>

      <ReviewPanel
        manuscript={manuscript}
        requests={requests}
        suggestions={suggestions}
        activeBlock={activeBlock}
        focusSuggestionId={focusSuggestionId}
        onSelectRequest={navigateToRequest}
        onAddComment={addComment}
        onSetStatus={setRequestStatus}
        onCreateSuggestion={createSuggestion}
        onApproveSuggestion={approveSuggestion}
        onRejectSuggestion={rejectSuggestion}
      />
    </div>
  );
}
