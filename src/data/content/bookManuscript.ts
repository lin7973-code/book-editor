import chapter0101 from '../../../content/chapter-01/01-vibe-coding.md?raw';
import chapter0102 from '../../../content/chapter-01/02-chatgpt-development.md?raw';
import chapter0103 from '../../../content/chapter-01/03-prompting.md?raw';
import chapter0201 from '../../../content/chapter-02/01-how-web-works.md?raw';
import chapter0202 from '../../../content/chapter-02/02-build-website.md?raw';
import chapter0203 from '../../../content/chapter-02/03-deploy-website.md?raw';
import chapter0301 from '../../../content/chapter-03/01-what-is-database.md?raw';
import chapter0302 from '../../../content/chapter-03/02-how-database-works.md?raw';
import chapter0303 from '../../../content/chapter-03/03-use-database.md?raw';
import { parseMarkdownSection } from '../services/markdownParser';
import type { ServerDocument } from '../services/documentApi';
import type { Chapter, Manuscript, Section } from '../../types/manuscript';

interface SourceFile {
  path: string;
  source: string;
}

const bundledSourceFiles: SourceFile[] = [
  { path: 'content/chapter-01/01-vibe-coding.md', source: chapter0101 },
  { path: 'content/chapter-01/02-chatgpt-development.md', source: chapter0102 },
  { path: 'content/chapter-01/03-prompting.md', source: chapter0103 },
  { path: 'content/chapter-02/01-how-web-works.md', source: chapter0201 },
  { path: 'content/chapter-02/02-build-website.md', source: chapter0202 },
  { path: 'content/chapter-02/03-deploy-website.md', source: chapter0203 },
  { path: 'content/chapter-03/01-what-is-database.md', source: chapter0301 },
  { path: 'content/chapter-03/02-how-database-works.md', source: chapter0302 },
  { path: 'content/chapter-03/03-use-database.md', source: chapter0303 },
];

const chapterTitles: Record<number, string> = {
  1: '1장. ChatGPT와 바이브코딩을 소개합니다.',
  2: '2장. 웹사이트 기초 지식',
  3: '3장. 데이터베이스 기초 지식',
};

function buildSection(file: SourceFile): Section {
  const parsed = parseMarkdownSection(file.source);
  return {
    id: `sec-${parsed.metadata.section}`,
    title: `${parsed.metadata.section}. ${parsed.metadata.title}`,
    fileName: file.path.split('/').at(-1) ?? file.path,
    sourcePath: file.path,
    chapter: parsed.metadata.chapter,
    sectionNumber: parsed.metadata.section,
    order: parsed.metadata.order,
    blocks: parsed.blocks,
  };
}

function buildManuscript(sourceFiles: SourceFile[]): Manuscript {
  const sections = sourceFiles.map(buildSection);
  const chapters: Chapter[] = Object.keys(chapterTitles).map(Number).sort((a, b) => a - b).map((chapterNumber) => ({
    id: `ch-${chapterNumber}`,
    title: chapterTitles[chapterNumber],
    sections: sections
      .filter((section) => section.chapter === chapterNumber)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  }));

  return {
    id: 'manuscript-vibe-coding',
    title: '한 입 크기로 잘라먹는 바이브코딩',
    subtitle: '프로그래밍 비전공자를 위한 바이브코딩 입문서 · 3개 장 / 9개 절',
    chapters,
    updatedAt: new Date().toISOString(),
  };
}

export function buildBookManuscriptFromServer(documents: ServerDocument[]): Manuscript {
  return buildManuscript(documents.map((document) => ({ path: document.sourcePath, source: document.markdown })));
}

export const bookManuscript: Manuscript = buildManuscript(bundledSourceFiles);
