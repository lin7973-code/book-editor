import type { BlockType, ManuscriptBlock, Section } from '../../types/manuscript';

export interface MarkdownMetadata {
  chapter: number;
  section: string;
  title: string;
  order: number;
}

export interface ParsedMarkdownSection {
  metadata: MarkdownMetadata;
  blocks: ManuscriptBlock[];
}

const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
const BLOCK_PATTERN = /<!--\s*block:([^\s]+)\s*-->\s*\n([\s\S]*?)(?=\n<!--\s*block:|$)/g;

function parseScalar(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(source: string): { metadata: MarkdownMetadata; body: string } {
  const match = source.match(FRONTMATTER_PATTERN);
  if (!match) throw new Error('Markdown frontmatter가 없습니다.');

  const values = new Map<string, string>();
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    values.set(line.slice(0, colon).trim(), parseScalar(line.slice(colon + 1)));
  }

  const chapter = Number(values.get('chapter'));
  const order = Number(values.get('order'));
  const section = values.get('section') ?? '';
  const title = values.get('title') ?? '';

  if (!Number.isFinite(chapter) || !Number.isFinite(order) || !section || !title) {
    throw new Error('chapter, section, title, order 메타데이터가 필요합니다.');
  }

  return {
    metadata: { chapter, section, title, order },
    body: source.slice(match[0].length),
  };
}

function detectBlockType(raw: string): { type: BlockType; text: string } {
  const text = raw.trim();
  if (/^#{1,6}\s+/.test(text)) {
    return { type: 'heading', text: text.replace(/^#{1,6}\s+/, '').trim() };
  }
  if (/^>\s?/.test(text)) {
    return { type: 'quote', text: text.replace(/^>\s?/gm, '').trim() };
  }
  return { type: 'paragraph', text };
}

export function parseMarkdownSection(source: string): ParsedMarkdownSection {
  const { metadata, body } = parseFrontmatter(source);
  const blocks: ManuscriptBlock[] = [];
  const seen = new Set<string>();

  for (const match of body.matchAll(BLOCK_PATTERN)) {
    const id = match[1].trim();
    if (!id || seen.has(id)) throw new Error(`중복되거나 비어 있는 block ID: ${id}`);
    seen.add(id);
    const parsed = detectBlockType(match[2]);
    blocks.push({ id, ...parsed });
  }

  if (blocks.length === 0) {
    throw new Error(`${metadata.section} ${metadata.title}: block 메타데이터가 없습니다.`);
  }

  return { metadata, blocks };
}

export function sectionToMarkdown(section: Section): string {
  const chapter = section.chapter ?? Number(section.id.match(/ch-(\d+)/)?.[1] ?? 0);
  const sectionNumber = section.sectionNumber ?? section.id.replace(/^sec-/, '');
  const order = section.order ?? 1;
  const frontmatter = [
    '---',
    `chapter: ${chapter}`,
    `section: "${sectionNumber}"`,
    `title: "${section.title.replaceAll('"', '\\"')}"`,
    `order: ${order}`,
    '---',
    '',
  ].join('\n');

  const body = section.blocks.map((block) => {
    const prefix = block.type === 'heading' ? '## ' : block.type === 'quote' ? '> ' : '';
    const text = block.type === 'quote' ? block.text.replaceAll('\n', '\n> ') : block.text;
    return `<!-- block:${block.id} -->\n${prefix}${text}`;
  }).join('\n\n');

  return `${frontmatter}${body}\n`;
}
