# 한 입 크기로 잘라먹는 바이브코딩 — 집필·퇴고 에디터

React + TypeScript 기반의 도서 집필 에디터입니다. 왼쪽 목차, 가운데 블록 에디터, 오른쪽 수정 요청 패널의 3열 구조로 구성되어 있습니다.

## 실행

```bash
npm install
npm run dev
```

`npm run dev`는 Vite 프론트엔드와 Node API 서버를 함께 실행합니다. Vite의 `/api` 요청은 기본적으로 `http://localhost:8787`의 API 서버로 프록시됩니다.

프로덕션 실행은 다음과 같습니다.

```bash
npm run build
npm start
```

## 실제 원고 저장

원고의 각 절은 `content/` 아래의 독립적인 Markdown 파일입니다.

```text
content/
├─ chapter-01/
├─ chapter-02/
└─ chapter-03/
```

브라우저가 파일 시스템을 직접 수정하지 않습니다. 프론트엔드는 문서를 서버 API로 전달하고 서버가 실제 Markdown 파일을 읽어 수정한 뒤 저장합니다.

```text
GET   /api/documents
PATCH /api/documents/:documentId
```

`GET /api/documents`는 새로고침 시 실제 Markdown 파일을 다시 읽기 위해 사용합니다. `PATCH /api/documents/:documentId`는 현재 절의 블록 배열을 저장합니다. 서버는 기존 frontmatter를 유지하고 `<!-- block:... -->` ID를 포함한 본문 블록을 다시 기록합니다.

문단 텍스트 수정, 새 블록 추가, 블록 삭제, 드래그 순서 변경은 모두 해당 Markdown 파일에 반영됩니다.

### 자동 저장

텍스트를 입력할 때마다 네트워크 요청을 보내지 않도록 절별로 800ms debounce를 적용했습니다. 마지막 변경 후 800ms 동안 추가 입력이 없을 때 한 번 저장합니다. 서로 다른 절에서 발생한 저장은 각각 독립적으로 처리됩니다.

상단에는 현재 절의 저장 상태가 표시됩니다.

- `저장 중`: 아직 debounce 대기 중이거나 서버에 저장 요청 중
- `저장 완료`: 최신 변경이 Markdown 파일에 기록됨
- `저장 실패`: 서버 저장에 실패함

상단의 `저장` 버튼을 누르면 debounce를 기다리지 않고 현재 절을 즉시 저장할 수 있습니다.

## Markdown과 블록 ID

각 문단은 Markdown 안에서 고유 ID를 유지합니다.

```md
<!-- block:ch01-sec01-p001 -->
본문 문단...
```

텍스트를 수정하거나 문단 순서를 변경해도 기존 블록 ID를 그대로 저장하므로 수정 요청과 AI 제안을 같은 문단에 계속 연결할 수 있습니다.

## 수정 요청 영구 저장

수정 요청은 브라우저 저장소가 아니라 다음 실제 데이터 파일에 저장됩니다.

```text
data/revision-requests.json
```

API:

```text
GET    /api/revision-requests
POST   /api/revision-requests
PATCH  /api/revision-requests/:id
DELETE /api/revision-requests/:id
```

수정 요청 데이터에는 `requestId`, `blockId`, `sectionId`, `content`, `createdAt`, `status`가 저장됩니다.

## 주요 구조

```text
src/
├─ components/
│  ├─ Sidebar.tsx
│  ├─ ReviewPanel.tsx
│  ├─ Topbar.tsx
│  ├─ sidebar/
│  └─ editor/
├─ data/
│  ├─ content/
│  ├─ repositories/
│  └─ services/
│     ├─ documentApi.ts
│     ├─ markdownParser.ts
│     └─ revisionRequestApi.ts
├─ features/
└─ types/

server/
└─ index.mjs

content/
data/
```

## 참고

현재 본문 원고의 영구 저장은 Markdown 파일을 기준으로 합니다. 이전 단계에서 만든 `LocalStorageManuscriptRepository` 코드는 확장 예제로 남아 있지만 현재 `App`의 원고 로딩·저장 경로에서는 사용하지 않습니다.

## 수정 요청 이미지 첨부

수정 요청에는 여러 이미지를 첨부할 수 있습니다. 파일 선택, 드래그 앤 드롭, 클립보드 붙여넣기(Ctrl/⌘+V)를 지원합니다.

- 업로드 API: `POST /api/uploads`
- 업로드 정리 API: `DELETE /api/uploads/:attachmentId`
- 실제 이미지 파일: `data/uploads/`
- 수정 요청 JSON에는 이미지 바이너리가 아니라 attachment ID, 원본 파일명, MIME type, 크기, URL만 저장됩니다.
- 지원 형식: PNG, JPEG, WebP, GIF
- 파일당 최대 크기: 10MB

수정 요청 생성이 실패하면 방금 업로드한 이미지 파일도 정리합니다. 수정 요청을 삭제하면 연결된 첨부 이미지 파일도 서버에서 삭제합니다.

## 수정 요청 이미지 관리

수정 요청 작성창은 이미지 파일 선택, 드래그 앤 드롭, 클립보드 붙여넣기를 지원합니다.

첨부한 이미지는 전송 전에 미리보기로 표시되며 다음 작업을 할 수 있습니다.

- 개별 이미지 선택/삭제
- 여러 이미지 다중 선택
- 선택한 이미지들을 좌우로 함께 이동
- 이미지를 직접 드래그하여 순서 변경
- `첨부 취소`로 현재 첨부 전체 제거

이미지는 수정 요청을 저장할 때 서버의 `uploads/revision-requests/` 폴더에 실제 파일로 저장됩니다. `data/revision-requests.json`에는 이미지 바이너리를 넣지 않고 다음 메타데이터만 저장합니다.

```json
{
  "id": "image_...",
  "url": "/uploads/revision-requests/image_....png",
  "order": 0,
  "fileName": "reference.png",
  "mimeType": "image/png",
  "size": 12345
}
```

작성창에서 정한 배열 순서가 `order` 값으로 저장됩니다. 서버는 요청 생성 및 첨부 목록 PATCH 시 배열 순서를 다시 0부터 정규화합니다.

이미지 API:

```text
POST   /api/uploads/revision-requests
DELETE /api/uploads/revision-requests/:id
```

수정 요청 삭제 시 연결된 이미지 파일도 함께 삭제됩니다.

## 수정 제안 저장

수정 요청과 수정 제안은 별도 데이터로 관리합니다.

- 수정 요청: `data/revision-requests.json`
- 수정 제안: `data/revision-suggestions.json`

수정 제안 API:

- `GET /api/revision-suggestions`
- `POST /api/revision-suggestions` — `{ "requestId": "..." }`로 제안 생성
- `PATCH /api/revision-suggestions/:id` — 제안 문장 또는 상태 변경
- `DELETE /api/revision-suggestions/:id`

제안 데이터는 `suggestionId`, `requestId`, `documentId`, `blockId`, `originalText`, `suggestedText`, `createdAt`, `status`를 저장합니다. 현재 상태는 `draft`, `approved`, `rejected`를 사용할 수 있습니다.

중요: 제안 생성 및 제안 상태 변경 API는 Markdown 파일을 수정하지 않습니다. 실제 원고 반영은 이후 별도의 명시적 승인 동작에서만 문서 저장 API를 호출하도록 분리되어 있습니다.
