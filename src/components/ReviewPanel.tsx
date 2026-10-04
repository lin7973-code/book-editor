import { Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Eye, EyeOff, ImagePlus, MessageSquareText, Paperclip, Sparkles, Trash2, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Manuscript, ManuscriptBlock, RevisionRequest, RevisionSuggestion } from '../types/manuscript';

interface ReviewPanelProps {
  manuscript: Manuscript;
  requests: RevisionRequest[];
  suggestions: RevisionSuggestion[];
  activeBlock?: ManuscriptBlock;
  focusSuggestionId?: string | null;
  onSelectRequest: (request: RevisionRequest) => void;
  onAddComment: (content: string, images: File[]) => Promise<boolean>;
  onSetStatus: (requestId: string, status: RevisionRequest['status']) => void;
  onCreateSuggestion: (requestId: string) => Promise<boolean>;
  onApproveSuggestion: (suggestionId: string) => Promise<boolean>;
  onRejectSuggestion: (suggestionId: string) => Promise<boolean>;
}

type PendingImage = { id: string; file: File; previewUrl: string };
type DiffPart = { text: string; changed: boolean };
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function makePendingImage(file: File): PendingImage { return { id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`, file, previewUrl: URL.createObjectURL(file) }; }
function moveItems(items: PendingImage[], selected: Set<string>, direction: -1 | 1) {
  const next = [...items];
  if (direction < 0) for (let i = 1; i < next.length; i += 1) { if (selected.has(next[i].id) && !selected.has(next[i - 1].id)) [next[i - 1], next[i]] = [next[i], next[i - 1]]; }
  else for (let i = next.length - 2; i >= 0; i -= 1) { if (selected.has(next[i].id) && !selected.has(next[i + 1].id)) [next[i], next[i + 1]] = [next[i + 1], next[i]]; }
  return next;
}
function diffWords(a: string, b: string): { left: DiffPart[]; right: DiffPart[] } {
  const A = a.split(/(\s+)/).filter(Boolean), B = b.split(/(\s+)/).filter(Boolean);
  const dp = Array.from({ length: A.length + 1 }, () => Array(B.length + 1).fill(0));
  for (let i=A.length-1;i>=0;i--) for (let j=B.length-1;j>=0;j--) dp[i][j]=A[i]===B[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const left: DiffPart[] = [], right: DiffPart[] = []; let i=0,j=0;
  while(i<A.length||j<B.length){
    if(i<A.length&&j<B.length&&A[i]===B[j]){ left.push({text:A[i],changed:false}); right.push({text:B[j],changed:false}); i++;j++; }
    else if(j<B.length&&(i===A.length||dp[i][j+1]>=dp[i+1][j])){ right.push({text:B[j],changed:true}); j++; }
    else { left.push({text:A[i],changed:true}); i++; }
  }
  return { left, right };
}

export function ReviewPanel({ manuscript, requests, suggestions, activeBlock, focusSuggestionId, onSelectRequest, onAddComment, onSetStatus, onCreateSuggestion, onApproveSuggestion, onRejectSuggestion }: ReviewPanelProps) {
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<'requests' | 'suggestions'>('requests');
  const [showCompleted, setShowCompleted] = useState(false);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');
  const [generatingRequestId, setGeneratingRequestId] = useState<string | null>(null);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearImages = () => { setImages((current) => { current.forEach((image) => URL.revokeObjectURL(image.previewUrl)); return []; }); setSelectedImageIds(new Set()); setDraggedImageId(null); };
  useEffect(() => { setDraft(''); clearImages(); setAttachmentError(''); }, [activeBlock?.id]);
  useEffect(() => () => { images.forEach((image) => URL.revokeObjectURL(image.previewUrl)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!focusSuggestionId) return;
    setTab('suggestions');
    requestAnimationFrame(() => document.querySelector(`[data-suggestion-id="${CSS.escape(focusSuggestionId)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }, [focusSuggestionId]);

  const sectionLookup = useMemo(() => { const map = new Map<string, { chapterTitle: string; sectionTitle: string; sectionNumber?: string }>(); manuscript.chapters.forEach((chapter) => chapter.sections.forEach((section) => map.set(section.id, { chapterTitle: chapter.title, sectionTitle: section.title, sectionNumber: section.sectionNumber }))); return map; }, [manuscript]);
  const visibleRequests = requests.filter((request) => showCompleted || request.status !== 'completed');
  const pendingCount = requests.filter((request) => request.status === 'pending').length;
  const completedCount = requests.length - pendingCount;

  const addFiles = (files: File[]) => { if (!activeBlock) return; const valid: File[]=[]; const errors:string[]=[]; for(const file of files){ if(!IMAGE_TYPES.has(file.type)){errors.push(`${file.name}: 지원하지 않는 이미지 형식`);continue;} if(file.size>MAX_IMAGE_SIZE){errors.push(`${file.name}: 10MB를 초과함`);continue;} valid.push(file);} setAttachmentError(errors.join(' · ')); if(valid.length)setImages((current)=>[...current,...valid.map(makePendingImage)]); };
  const removePendingImage=(id:string)=>{setImages((current)=>current.filter((image)=>{if(image.id===id)URL.revokeObjectURL(image.previewUrl);return image.id!==id;}));setSelectedImageIds((current)=>{const next=new Set(current);next.delete(id);return next;});};
  const removeSelectedImages=()=>{if(!selectedImageIds.size)return;setImages((current)=>current.filter((image)=>{if(selectedImageIds.has(image.id))URL.revokeObjectURL(image.previewUrl);return !selectedImageIds.has(image.id);}));setSelectedImageIds(new Set());};
  const toggleImageSelection=(id:string)=>setSelectedImageIds((current)=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next;});
  const reorderByDrop=(targetId:string)=>{if(!draggedImageId||draggedImageId===targetId)return;setImages((current)=>{const sourceIndex=current.findIndex((x)=>x.id===draggedImageId),targetIndex=current.findIndex((x)=>x.id===targetId);if(sourceIndex<0||targetIndex<0)return current;const next=[...current];const[moved]=next.splice(sourceIndex,1);next.splice(targetIndex,0,moved);return next;});setDraggedImageId(null);};
  const submit=async()=>{const message=draft.trim();if(!message||!activeBlock||submitting)return;setSubmitting(true);const ok=await onAddComment(message,images.map((image)=>image.file));setSubmitting(false);if(ok){setDraft('');clearImages();setAttachmentError('');}};

  return <aside className="review-panel" aria-label="수정 요청 및 제안">
    <div className="review-header"><div><span className="eyebrow">REVIEW</span><h3>수정 요청 및 제안</h3></div><span className="count">{tab==='requests'?pendingCount:suggestions.length}</span></div>
    <div className="review-tabs"><button className={tab==='requests'?'active':''} onClick={()=>setTab('requests')}>수정 요청</button><button className={tab==='suggestions'?'active':''} onClick={()=>setTab('suggestions')}>AI 제안</button></div>

    {tab==='requests'?<>
      <div className={`review-composer ${dropActive?'review-composer--drop':''}`}
        onDragEnter={(e)=>{e.preventDefault();if(activeBlock)setDropActive(true);}} onDragOver={(e)=>{e.preventDefault();if(activeBlock){e.dataTransfer.dropEffect='copy';setDropActive(true);}}}
        onDragLeave={(e)=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setDropActive(false);}}
        onDrop={(e)=>{e.preventDefault();setDropActive(false);if(draggedImageId)return;addFiles(Array.from(e.dataTransfer.files));}}
        onPaste={(e)=>{const pasted=Array.from(e.clipboardData.items).filter((item)=>item.kind==='file'&&item.type.startsWith('image/')).map((item)=>item.getAsFile()).filter((file):file is File=>Boolean(file));if(pasted.length){e.preventDefault();addFiles(pasted);}}}>
        <div className="review-composer-label"><MessageSquareText size={14}/>{activeBlock?'선택한 문단에 수정 요청 남기기':'문단을 먼저 선택하세요'}</div>
        {activeBlock&&<div className="selected-block-preview"><span>선택된 문단</span><p>{activeBlock.text||'빈 문단'}</p></div>}
        <textarea value={draft} disabled={!activeBlock||submitting} placeholder={activeBlock?'수정 요청을 작성하세요. 이미지를 붙여넣을 수도 있어요.':'가운데 원고에서 문단을 선택하세요.'} onChange={(e)=>setDraft(e.target.value)} onKeyDown={(e)=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter')void submit();}}/>
        <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={(e)=>{addFiles(Array.from(e.target.files??[]));e.currentTarget.value='';}}/>
        <div className="attachment-tools"><button type="button" disabled={!activeBlock||submitting} onClick={()=>fileInputRef.current?.click()}><ImagePlus size={14}/> 이미지 선택</button><span><Paperclip size={12}/> 드래그 또는 Ctrl/⌘+V</span></div>
        {attachmentError&&<div className="attachment-error">{attachmentError}</div>}
        {images.length>0&&<div className="attachment-manager"><div className="attachment-manager-bar"><div><strong>첨부 이미지 {images.length}장</strong><span>{selectedImageIds.size?`${selectedImageIds.size}장 선택됨`:'클릭해서 여러 장 선택'}</span></div><div className="attachment-manager-actions"><button disabled={!selectedImageIds.size} onClick={()=>setImages((c)=>moveItems(c,selectedImageIds,-1))}><ChevronLeft size={14}/></button><button disabled={!selectedImageIds.size} onClick={()=>setImages((c)=>moveItems(c,selectedImageIds,1))}><ChevronRight size={14}/></button><button disabled={!selectedImageIds.size} onClick={removeSelectedImages}><Trash2 size={13}/></button><button className="attachment-cancel" onClick={clearImages}>첨부 취소</button></div></div><div className="pending-images">{images.map((image,index)=><figure key={image.id} className={`pending-image ${selectedImageIds.has(image.id)?'pending-image--selected':''}`} draggable onDragStart={(e)=>{e.stopPropagation();setDraggedImageId(image.id);e.dataTransfer.effectAllowed='move';}} onDragEnd={()=>setDraggedImageId(null)} onDragOver={(e)=>{if(draggedImageId){e.preventDefault();e.stopPropagation();}}} onDrop={(e)=>{e.preventDefault();e.stopPropagation();reorderByDrop(image.id);}}><button className="pending-image-select" onClick={()=>toggleImageSelection(image.id)}><span>{selectedImageIds.has(image.id)?'✓':index+1}</span></button><img src={image.previewUrl} alt={image.file.name} onClick={()=>toggleImageSelection(image.id)}/><button className="pending-image-delete" onClick={()=>removePendingImage(image.id)}><X size={12}/></button><figcaption><span>{index+1}</span>{image.file.name}</figcaption></figure>)}</div></div>}
        {dropActive&&!draggedImageId&&<div className="drop-overlay">이미지를 놓아 첨부</div>}
        <button className="review-submit" disabled={!activeBlock||!draft.trim()||submitting} onClick={()=>void submit()}>{submitting?'저장 중…':`수정 요청 추가${images.length?` · 이미지 ${images.length}장`:''}`}</button>
      </div>
      <div className="completed-filter"><span>대기 {pendingCount} · 완료 {completedCount}</span><button onClick={()=>setShowCompleted((v)=>!v)}>{showCompleted?<EyeOff size={13}/>:<Eye size={13}/>} {showCompleted?'완료 숨기기':'완료된 요청 보기'}</button></div>
      <div className="review-list">{visibleRequests.length===0?<div className="empty-review"><MessageSquareText size={24}/><strong>{showCompleted?'수정 요청이 없어요':'대기 중인 수정 요청이 없어요'}</strong><span>완료된 요청은 기록에 남아 있으며 위 버튼에서 확인할 수 있어요.</span></div>:visibleRequests.map((request)=>{const section=sectionLookup.get(request.sectionId);const attachments=[...(request.attachments??[])].sort((a,b)=>a.order-b.order);return <article key={request.requestId} className="review-card" onClick={()=>onSelectRequest(request)}><div className="review-card-top"><span className="review-section-label">{section?.sectionNumber?`${section.sectionNumber}. `:''}{section?.sectionTitle??'알 수 없는 절'}</span><span className={`request-status request-status--${request.status}`}>{request.status==='pending'?<CircleDashed size={12}/>:<CheckCircle2 size={12}/>} {request.status}</span></div><p className="review-request-preview">{request.content}</p>{attachments.length>0&&<div className="request-attachments" onClick={(e)=>e.stopPropagation()}>{attachments.slice(0,3).map((a)=><a key={a.id} href={a.url} target="_blank" rel="noreferrer"><img src={a.url} alt={a.fileName}/></a>)}{attachments.length>3&&<span>+{attachments.length-3}</span>}</div>}<div className="review-meta"><span>{new Date(request.createdAt).toLocaleString('ko-KR')}</span><span className="review-block-ref">문단 ID · {request.blockId}</span></div>{request.status==='pending'&&<div className="review-actions" onClick={(e)=>e.stopPropagation()}><button className="suggestion-create-button" disabled={generatingRequestId===request.requestId} onClick={async()=>{setGeneratingRequestId(request.requestId);const ok=await onCreateSuggestion(request.requestId);setGeneratingRequestId(null);if(ok)setTab('suggestions');}}><Sparkles size={12}/> {generatingRequestId===request.requestId?'생성 중…':'수정 제안 생성'}</button></div>}</article>;})}</div>
    </>:<div className="suggestion-list">{suggestions.length===0?<div className="empty-review ai-empty"><Sparkles size={24}/><strong>아직 수정 제안이 없어요</strong><span>수정 요청에서 제안을 생성하면 여기에 비교 화면이 표시됩니다.</span></div>:suggestions.slice().reverse().map((suggestion)=>{const request=requests.find((item)=>item.requestId===suggestion.requestId);const section=sectionLookup.get(suggestion.documentId);const diff=diffWords(suggestion.originalText,suggestion.suggestedText);return <article key={suggestion.suggestionId} data-suggestion-id={suggestion.suggestionId} className={`suggestion-card ${focusSuggestionId===suggestion.suggestionId?'suggestion-card--focused':''}`}><div className="review-card-top"><span className="review-section-label">{section?.sectionNumber?`${section.sectionNumber}. `:''}{section?.sectionTitle??suggestion.documentId}</span><span className={`suggestion-status suggestion-status--${suggestion.status}`}>{suggestion.status}</span></div>{request&&<p className="suggestion-request-link">요청 · {request.content}</p>}<div className="diff-grid"><div className="diff-pane diff-pane--old"><span>기존 원고</span><p>{diff.left.map((part,index)=><mark key={index} className={part.changed?'diff-removed':''}>{part.text}</mark>)}</p></div><div className="diff-pane diff-pane--new"><span>수정 제안</span><p>{diff.right.map((part,index)=><mark key={index} className={part.changed?'diff-added':''}>{part.text}</mark>)}</p></div></div><div className="review-meta"><span>{new Date(suggestion.createdAt).toLocaleString('ko-KR')}</span><span className="review-block-ref">{suggestion.suggestionId} · {suggestion.blockId}</span></div>{suggestion.status==='draft'?<div className="suggestion-actions"><button className="approve" disabled={processingSuggestionId===suggestion.suggestionId} onClick={async()=>{setProcessingSuggestionId(suggestion.suggestionId);await onApproveSuggestion(suggestion.suggestionId);setProcessingSuggestionId(null);}}><Check size={14}/> 승인</button><button className="reject" disabled={processingSuggestionId===suggestion.suggestionId} onClick={async()=>{setProcessingSuggestionId(suggestion.suggestionId);await onRejectSuggestion(suggestion.suggestionId);setProcessingSuggestionId(null);}}><XCircle size={14}/> 거절</button></div>:<div className="suggestion-result">{suggestion.status==='approved'?'승인되어 원고에 반영되었습니다.':'거절되었습니다. 원고는 변경되지 않았습니다.'}</div>}</article>;})}</div>}
  </aside>;
}
