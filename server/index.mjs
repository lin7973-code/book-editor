import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const storageRoot = process.env.STORAGE_ROOT ? path.resolve(process.env.STORAGE_ROOT) : projectRoot;
const dataFile = path.join(storageRoot, 'data', 'revision-requests.json');
const suggestionDataFile = path.join(storageRoot, 'data', 'revision-suggestions.json');
const contentDir = path.join(storageRoot, 'content');
const uploadDir = path.join(storageRoot, 'uploads', 'revision-requests');
const bundledContentDir = path.join(projectRoot, 'content');
const distDir = path.join(projectRoot, 'dist');
const port = Number(process.env.PORT ?? 8787);

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' };
let writeQueue = Promise.resolve();

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, '[]\n', 'utf8');
  }
}

async function readRequests() {
  await ensureDataFile();
  const raw = await fs.readFile(dataFile, 'utf8');
  const parsed = JSON.parse(raw || '[]');
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => ({
    ...item,
    attachments: Array.isArray(item.attachments)
      ? item.attachments.map((attachment, index) => ({
          id: String(attachment.id || attachment.attachmentId || `image_${crypto.randomUUID()}`),
          fileName: String(attachment.fileName || 'image'),
          mimeType: String(attachment.mimeType || 'image/png'),
          size: Number.isFinite(attachment.size) ? attachment.size : 0,
          url: String(attachment.url || ''),
          order: Number.isInteger(attachment.order) && attachment.order >= 0 ? attachment.order : index,
        })).sort((a, b) => a.order - b.order)
      : [],
  }));
}


async function ensureSuggestionDataFile() {
  await fs.mkdir(path.dirname(suggestionDataFile), { recursive: true });
  try {
    await fs.access(suggestionDataFile);
  } catch {
    await fs.writeFile(suggestionDataFile, '[]\n', 'utf8');
  }
}

async function readSuggestions() {
  await ensureSuggestionDataFile();
  const raw = await fs.readFile(suggestionDataFile, 'utf8');
  const parsed = JSON.parse(raw || '[]');
  return Array.isArray(parsed) ? parsed : [];
}

function writeSuggestions(suggestions) {
  return enqueueWrite(async () => {
    await ensureSuggestionDataFile();
    const tempFile = `${suggestionDataFile}.tmp`;
    await fs.writeFile(tempFile, `${JSON.stringify(suggestions, null, 2)}\n`, 'utf8');
    await fs.rename(tempFile, suggestionDataFile);
  });
}


async function ensurePersistentContent() {
  if (storageRoot === projectRoot) return;
  await fs.mkdir(contentDir, { recursive: true });
  const existing = await listMarkdownFiles(contentDir).catch(() => []);
  if (existing.length > 0) return;
  await fs.cp(bundledContentDir, contentDir, { recursive: true });
}

async function ensureStorageInitialized() {
  await fs.mkdir(storageRoot, { recursive: true });
  await ensureDataFile();
  await ensureSuggestionDataFile();
  await fs.mkdir(uploadDir, { recursive: true });
  await ensurePersistentContent();
}

function isValidSuggestionStatus(value) {
  return value === 'draft' || value === 'approved' || value === 'rejected';
}

function makeConservativeSuggestion(originalText, requestContent) {
  // This first-pass generator is intentionally conservative: it creates a reviewable
  // suggestion without touching the Markdown file. A future AI provider can replace
  // this function while keeping the same API and persistence model.
  let text = String(originalText || '').replace(/\s+/g, ' ').trim();
  const request = String(requestContent || '');

  if (/짧|간결|줄여|압축/.test(request) && text.length > 120) {
    const parts = text.split(/(?<=[.!?。])\s+/).filter(Boolean);
    if (parts.length > 1) text = parts.slice(0, Math.max(1, Math.ceil(parts.length * 0.8))).join(' ');
  }

  if (/문장.*나눠|길.*문장|호흡|읽기 쉽게|가독/.test(request) && text.length > 100 && !/[.!?。]\s/.test(text)) {
    const splitAt = text.search(/,\s*(하지만|그러나|그리고|따라서|그래서)\s*/);
    if (splitAt > 30) {
      const head = text.slice(0, splitAt).replace(/,$/, '');
      const tail = text.slice(splitAt + 1).trim();
      text = `${head}. ${tail}`;
    }
  }

  return text || String(originalText || '');
}

function enqueueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

function writeRequests(requests) {
  return enqueueWrite(async () => {
    await ensureDataFile();
    const tempFile = `${dataFile}.tmp`;
    await fs.writeFile(tempFile, `${JSON.stringify(requests, null, 2)}\n`, 'utf8');
    await fs.rename(tempFile, dataFile);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(body));
}

function sendEmpty(res, status = 204) {
  res.writeHead(status);
  res.end();
}

async function readBinaryBody(req, limit = 10 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      const error = new Error('Image is too large. Maximum size is 10MB.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJsonBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 2_000_000) throw new Error('Payload too large');
  }
  return body ? JSON.parse(body) : {};
}

function isValidStatus(value) {
  return value === 'pending' || value === 'completed';
}

function isValidAttachment(item) {
  return item &&
    typeof item.id === 'string' && item.id.trim() &&
    typeof item.fileName === 'string' && item.fileName.trim() &&
    typeof item.mimeType === 'string' && item.mimeType.startsWith('image/') &&
    Number.isFinite(item.size) && item.size >= 0 &&
    typeof item.url === 'string' && item.url.startsWith('/uploads/revision-requests/') &&
    Number.isInteger(item.order) && item.order >= 0;
}

function validateCreate(payload) {
  return (
    typeof payload.blockId === 'string' && payload.blockId.trim() &&
    typeof payload.sectionId === 'string' && payload.sectionId.trim() &&
    typeof payload.content === 'string' && payload.content.trim() &&
    (payload.attachments === undefined || (Array.isArray(payload.attachments) && payload.attachments.every(isValidAttachment)))
  );
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath);
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  }[ext] ?? 'application/octet-stream';
}



const ALLOWED_IMAGE_TYPES = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

function safeOriginalFileName(value) {
  try { return decodeURIComponent(value || 'image'); } catch { return 'image'; }
}

async function saveUploadedImage(req) {
  const mimeType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const ext = ALLOWED_IMAGE_TYPES.get(mimeType);
  if (!ext) {
    const error = new Error('Only PNG, JPEG, WebP, and GIF images are supported.');
    error.statusCode = 415;
    throw error;
  }
  const data = await readBinaryBody(req);
  if (!data.length) {
    const error = new Error('Image file is empty.');
    error.statusCode = 400;
    throw error;
  }
  await fs.mkdir(uploadDir, { recursive: true });
  const id = `image_${crypto.randomUUID()}`;
  const storedName = `${id}${ext}`;
  await fs.writeFile(path.join(uploadDir, storedName), data);
  return {
    id,
    fileName: safeOriginalFileName(req.headers['x-file-name']),
    mimeType,
    size: data.length,
    url: `/uploads/revision-requests/${storedName}`,
  };
}

async function deleteUploadedImage(id) {
  if (!/^(image|attachment)_[a-f0-9-]+$/i.test(id)) return false;
  await fs.mkdir(uploadDir, { recursive: true });
  const entries = await fs.readdir(uploadDir);
  const matching = entries.filter((name) => name.startsWith(`${id}.`));
  await Promise.all(matching.map((name) => fs.unlink(path.join(uploadDir, name)).catch(() => {})));
  return matching.length > 0;
}

async function serveUpload(pathname, res) {
  const prefix = '/uploads/revision-requests/';
  if (!pathname.startsWith(prefix)) return false;
  const fileName = path.basename(decodeURIComponent(pathname.slice(prefix.length)));
  if (!/^(image|attachment)_[a-f0-9-]+\.(png|jpg|webp|gif)$/i.test(fileName)) return false;
  const filePath = path.join(uploadDir, fileName);
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentTypeFor(filePath),
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

async function serveStatic(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const candidate = path.normalize(path.join(distDir, pathname));
    if (!candidate.startsWith(distDir)) return false;

    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        res.writeHead(200, { 'Content-Type': contentTypeFor(candidate) });
        res.end(await fs.readFile(candidate));
        return true;
      }
    } catch {}

    const indexPath = path.join(distDir, 'index.html');
    await fs.access(indexPath);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await fs.readFile(indexPath));
    return true;
  } catch {
    return false;
  }
}

const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

function parseFrontmatterValue(frontmatter, key) {
  const line = frontmatter.split(/\r?\n/).find((item) => item.trim().startsWith(`${key}:`));
  if (!line) return '';
  const value = line.slice(line.indexOf(':') + 1).trim();
  return value.replace(/^['"]|['"]$/g, '');
}

async function listMarkdownFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await listMarkdownFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.md')) result.push(fullPath);
  }
  return result;
}

async function getDocumentIndex() {
  const files = await listMarkdownFiles(contentDir);
  const documents = [];
  for (const filePath of files) {
    const markdown = await fs.readFile(filePath, 'utf8');
    const frontmatterMatch = markdown.match(FRONTMATTER_PATTERN);
    if (!frontmatterMatch) continue;
    const section = parseFrontmatterValue(frontmatterMatch[1], 'section');
    const order = Number(parseFrontmatterValue(frontmatterMatch[1], 'order')) || 0;
    const chapter = Number(parseFrontmatterValue(frontmatterMatch[1], 'chapter')) || 0;
    if (!section) continue;
    documents.push({
      documentId: `sec-${section}`,
      sourcePath: path.relative(projectRoot, filePath).split(path.sep).join('/'),
      filePath,
      markdown,
      chapter,
      order,
    });
  }
  return documents.sort((a, b) => a.chapter - b.chapter || a.order - b.order);
}

function isValidBlock(block) {
  return block &&
    typeof block.id === 'string' && block.id.trim() &&
    (block.type === 'paragraph' || block.type === 'heading' || block.type === 'quote') &&
    typeof block.text === 'string';
}

function serializeBlocks(blocks) {
  return blocks.map((block) => {
    const id = block.id.trim();
    const text = block.text.replace(/\r\n/g, '\n').trimEnd();
    if (block.type === 'heading') return `<!-- block:${id} -->\n## ${text}`;
    if (block.type === 'quote') return `<!-- block:${id} -->\n> ${text.replaceAll('\n', '\n> ')}`;
    return `<!-- block:${id} -->\n${text}`;
  }).join('\n\n');
}


async function getDocumentBlock(documentId, blockId) {
  const documents = await getDocumentIndex();
  const document = documents.find((item) => item.documentId === documentId);
  if (!document) return null;
  const body = document.markdown.replace(FRONTMATTER_PATTERN, '');
  const marker = `<!-- block:${blockId} -->`;
  const start = body.indexOf(marker);
  if (start < 0) return null;
  const contentStart = start + marker.length;
  const nextMarker = body.indexOf('<!-- block:', contentStart);
  let blockText = body.slice(contentStart, nextMarker >= 0 ? nextMarker : body.length).trim();
  if (blockText.startsWith('## ')) blockText = blockText.slice(3);
  else if (blockText.startsWith('> ')) blockText = blockText.replace(/^> ?/gm, '');
  return { document, text: blockText.trim() };
}

async function patchDocument(documentId, blocks) {
  if (!Array.isArray(blocks) || !blocks.every(isValidBlock)) {
    const error = new Error('blocks must be a valid manuscript block array.');
    error.statusCode = 400;
    throw error;
  }
  const ids = blocks.map((block) => block.id.trim());
  if (new Set(ids).size !== ids.length) {
    const error = new Error('Duplicate block IDs are not allowed.');
    error.statusCode = 400;
    throw error;
  }

  const documents = await getDocumentIndex();
  const document = documents.find((item) => item.documentId === documentId);
  if (!document) {
    const error = new Error('Document not found.');
    error.statusCode = 404;
    throw error;
  }

  const current = await fs.readFile(document.filePath, 'utf8');
  const frontmatterMatch = current.match(FRONTMATTER_PATTERN);
  if (!frontmatterMatch) {
    const error = new Error('Document frontmatter is missing.');
    error.statusCode = 500;
    throw error;
  }

  const nextMarkdown = `${frontmatterMatch[0]}${serializeBlocks(blocks)}\n`;
  await enqueueWrite(async () => {
    const tempFile = `${document.filePath}.tmp`;
    await fs.writeFile(tempFile, nextMarkdown, 'utf8');
    await fs.rename(tempFile, document.filePath);
  });

  return {
    documentId,
    sourcePath: document.sourcePath,
    savedAt: new Date().toISOString(),
  };
}



async function applySuggestionToDocument(suggestion) {
  const documents = await getDocumentIndex();
  const document = documents.find((item) => item.documentId === suggestion.documentId);
  if (!document) {
    const error = new Error('Document not found.');
    error.statusCode = 404;
    throw error;
  }

  const current = await fs.readFile(document.filePath, 'utf8');
  const marker = `<!-- block:${suggestion.blockId} -->`;
  const start = current.indexOf(marker);
  if (start < 0) {
    const error = new Error('Connected manuscript block not found.');
    error.statusCode = 404;
    throw error;
  }
  const contentStart = start + marker.length;
  const nextMarker = current.indexOf('<!-- block:', contentStart);
  const blockEnd = nextMarker >= 0 ? nextMarker : current.length;
  const rawBlock = current.slice(contentStart, blockEnd);
  let currentText = rawBlock.trim();
  let type = 'paragraph';
  if (currentText.startsWith('## ')) { type = 'heading'; currentText = currentText.slice(3); }
  else if (currentText.startsWith('> ')) { type = 'quote'; currentText = currentText.replace(/^> ?/gm, ''); }

  if (currentText.trim() !== String(suggestion.originalText || '').trim()) {
    const error = new Error('The manuscript block changed after this suggestion was created. Create a new suggestion before approving.');
    error.statusCode = 409;
    throw error;
  }

  const text = String(suggestion.suggestedText || '').replace(/\r\n/g, '\n').trimEnd();
  const serialized = type === 'heading'
    ? `\n## ${text}\n\n`
    : type === 'quote'
      ? `\n> ${text.replaceAll('\n', '\n> ')}\n\n`
      : `\n${text}\n\n`;
  const nextMarkdown = current.slice(0, contentStart) + serialized + current.slice(blockEnd).replace(/^\s*/, '');

  await enqueueWrite(async () => {
    const tempFile = `${document.filePath}.tmp`;
    await fs.writeFile(tempFile, nextMarkdown, 'utf8');
    await fs.rename(tempFile, document.filePath);
  });

  return { documentId: suggestion.documentId, blockId: suggestion.blockId, text, savedAt: new Date().toISOString() };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if ((pathname === '/api/uploads/revision-requests' || pathname === '/api/uploads') && req.method === 'POST') {
      return sendJson(res, 201, await saveUploadedImage(req));
    }

    const uploadMatch = pathname.match(/^\/api\/uploads\/revision-requests\/([^/]+)$/) || pathname.match(/^\/api\/uploads\/([^/]+)$/);
    if (uploadMatch && req.method === 'DELETE') {
      const removed = await deleteUploadedImage(decodeURIComponent(uploadMatch[1]));
      return removed ? sendEmpty(res) : sendJson(res, 404, { message: 'Upload not found.' });
    }

    if (pathname === '/api/documents' && req.method === 'GET') {
      const documents = await getDocumentIndex();
      return sendJson(res, 200, documents.map(({ documentId, sourcePath, markdown }) => ({ documentId, sourcePath, markdown })));
    }

    const documentMatch = pathname.match(/^\/api\/documents\/([^/]+)$/);
    if (documentMatch && req.method === 'PATCH') {
      const documentId = decodeURIComponent(documentMatch[1]);
      const payload = await readJsonBody(req);
      const result = await patchDocument(documentId, payload.blocks);
      return sendJson(res, 200, result);
    }


    if (pathname === '/api/revision-suggestions' && req.method === 'GET') {
      return sendJson(res, 200, await readSuggestions());
    }

    if (pathname === '/api/revision-suggestions' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      if (typeof payload.requestId !== 'string' || !payload.requestId.trim()) {
        return sendJson(res, 400, { message: 'requestId is required.' });
      }

      const requests = await readRequests();
      const request = requests.find((item) => item.requestId === payload.requestId.trim());
      if (!request) return sendJson(res, 404, { message: 'Revision request not found.' });

      const block = await getDocumentBlock(request.sectionId, request.blockId);
      if (!block) return sendJson(res, 404, { message: 'Connected manuscript block not found.' });

      const suggestions = await readSuggestions();
      const item = {
        suggestionId: `suggestion_${crypto.randomUUID()}`,
        requestId: request.requestId,
        documentId: request.sectionId,
        blockId: request.blockId,
        originalText: block.text,
        suggestedText: makeConservativeSuggestion(block.text, request.content),
        createdAt: new Date().toISOString(),
        status: 'draft',
      };
      suggestions.push(item);
      await writeSuggestions(suggestions);

      // IMPORTANT: no document PATCH/save occurs here. Markdown is unchanged until
      // a future explicit approval action applies a suggestion.
      return sendJson(res, 201, item);
    }



    const suggestionActionMatch = pathname.match(/^\/api\/revision-suggestions\/([^/]+)\/(approve|reject)$/);
    if (suggestionActionMatch && req.method === 'POST') {
      const suggestionId = decodeURIComponent(suggestionActionMatch[1]);
      const action = suggestionActionMatch[2];
      const suggestions = await readSuggestions();
      const suggestionIndex = suggestions.findIndex((item) => item.suggestionId === suggestionId);
      if (suggestionIndex < 0) return sendJson(res, 404, { message: 'Revision suggestion not found.' });
      const suggestion = suggestions[suggestionIndex];
      if (suggestion.status !== 'draft') {
        return sendJson(res, 409, { message: `Suggestion is already ${suggestion.status}.` });
      }

      if (action === 'reject') {
        const rejected = { ...suggestion, status: 'rejected' };
        suggestions[suggestionIndex] = rejected;
        await writeSuggestions(suggestions);
        return sendJson(res, 200, { suggestion: rejected });
      }

      const document = await applySuggestionToDocument(suggestion);
      const approved = { ...suggestion, status: 'approved' };
      suggestions[suggestionIndex] = approved;

      const requests = await readRequests();
      const requestIndex = requests.findIndex((item) => item.requestId === suggestion.requestId);
      let completedRequest = null;
      if (requestIndex >= 0) {
        completedRequest = { ...requests[requestIndex], status: 'completed' };
        requests[requestIndex] = completedRequest;
      }

      await writeSuggestions(suggestions);
      if (completedRequest) await writeRequests(requests);
      return sendJson(res, 200, { suggestion: approved, request: completedRequest, document });
    }

    const suggestionMatch = pathname.match(/^\/api\/revision-suggestions\/([^/]+)$/);
    if (suggestionMatch && req.method === 'PATCH') {
      const suggestionId = decodeURIComponent(suggestionMatch[1]);
      const payload = await readJsonBody(req);
      const suggestions = await readSuggestions();
      const index = suggestions.findIndex((item) => item.suggestionId === suggestionId);
      if (index < 0) return sendJson(res, 404, { message: 'Revision suggestion not found.' });

      const current = suggestions[index];
      const next = {
        ...current,
        ...(typeof payload.suggestedText === 'string' && payload.suggestedText.trim()
          ? { suggestedText: payload.suggestedText.trim() }
          : {}),
        ...(isValidSuggestionStatus(payload.status) ? { status: payload.status } : {}),
      };
      suggestions[index] = next;
      await writeSuggestions(suggestions);
      // Status changes are metadata-only at this stage; they do not write Markdown.
      return sendJson(res, 200, next);
    }

    if (suggestionMatch && req.method === 'DELETE') {
      const suggestionId = decodeURIComponent(suggestionMatch[1]);
      const suggestions = await readSuggestions();
      const next = suggestions.filter((item) => item.suggestionId !== suggestionId);
      if (next.length === suggestions.length) return sendJson(res, 404, { message: 'Revision suggestion not found.' });
      await writeSuggestions(next);
      return sendEmpty(res);
    }

    if (pathname === '/api/revision-requests' && req.method === 'GET') {
      return sendJson(res, 200, await readRequests());
    }

    if (pathname === '/api/revision-requests' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      if (!validateCreate(payload)) {
        return sendJson(res, 400, { message: 'blockId, sectionId, content are required.' });
      }

      const requests = await readRequests();
      const item = {
        requestId: `request_${crypto.randomUUID()}`,
        blockId: payload.blockId.trim(),
        sectionId: payload.sectionId.trim(),
        content: payload.content.trim(),
        createdAt: new Date().toISOString(),
        status: isValidStatus(payload.status) ? payload.status : 'pending',
        attachments: Array.isArray(payload.attachments) ? payload.attachments.map((attachment, index) => ({ ...attachment, order: index })).sort((a, b) => a.order - b.order) : [],
      };
      requests.push(item);
      await writeRequests(requests);
      return sendJson(res, 201, item);
    }

    const match = pathname.match(/^\/api\/revision-requests\/([^/]+)$/);
    if (match && req.method === 'PATCH') {
      const requestId = decodeURIComponent(match[1]);
      const payload = await readJsonBody(req);
      const requests = await readRequests();
      const index = requests.findIndex((item) => item.requestId === requestId);
      if (index < 0) return sendJson(res, 404, { message: 'Revision request not found.' });

      const current = requests[index];
      const attachmentPatch = Array.isArray(payload.attachments) && payload.attachments.every(isValidAttachment)
        ? payload.attachments.map((attachment, index) => ({ ...attachment, order: index }))
        : null;
      const next = {
        ...current,
        ...(typeof payload.content === 'string' && payload.content.trim() ? { content: payload.content.trim() } : {}),
        ...(isValidStatus(payload.status) ? { status: payload.status } : {}),
        ...(attachmentPatch ? { attachments: attachmentPatch } : {}),
      };
      requests[index] = next;
      await writeRequests(requests);
      return sendJson(res, 200, next);
    }

    if (match && req.method === 'DELETE') {
      const requestId = decodeURIComponent(match[1]);
      const requests = await readRequests();
      const deleted = requests.find((item) => item.requestId === requestId);
      const next = requests.filter((item) => item.requestId !== requestId);
      if (next.length === requests.length) return sendJson(res, 404, { message: 'Revision request not found.' });
      await writeRequests(next);
      if (deleted?.attachments?.length) {
        await Promise.all(deleted.attachments.map((attachment) => deleteUploadedImage(attachment.id)));
      }
      const suggestions = await readSuggestions();
      const remainingSuggestions = suggestions.filter((item) => item.requestId !== requestId);
      if (remainingSuggestions.length !== suggestions.length) await writeSuggestions(remainingSuggestions);
      return sendEmpty(res);
    }

    if (pathname.startsWith('/api/')) return sendJson(res, 404, { message: 'Not found.' });

    if (await serveUpload(pathname, res)) return;
    if (await serveStatic(req, res)) return;
    return sendJson(res, 404, { message: 'Frontend build not found. Run the Vite dev server or npm run build.' });
  } catch (error) {
    console.error(error);
    const status = Number(error?.statusCode) || 500;
    return sendJson(res, status, { message: error instanceof Error ? error.message : 'Internal server error.' });
  }
});

await ensureStorageInitialized();

server.listen(port, '0.0.0.0', () => {
  console.log(`Book editor API server listening on http://localhost:${port}`);
});
