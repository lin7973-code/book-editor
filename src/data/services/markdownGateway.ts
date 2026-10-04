import type { Section } from '../../types/manuscript';
import { parseMarkdownSection, sectionToMarkdown } from './markdownParser';

/**
 * Markdown 파일 입출력 계층. UI는 Markdown 문법을 직접 알지 않는다.
 * 브라우저 파일 선택/다운로드 또는 향후 파일 시스템 저장 기능은 이 계약 뒤에 연결한다.
 */
export interface MarkdownGateway {
  read(file: File): Promise<Section>;
  write(section: Section): Promise<Blob>;
}

export class BrowserMarkdownGateway implements MarkdownGateway {
  async read(file: File): Promise<Section> {
    const source = await file.text();
    const parsed = parseMarkdownSection(source);
    return {
      id: `sec-${parsed.metadata.section}`,
      title: `${parsed.metadata.section}. ${parsed.metadata.title}`,
      fileName: file.name,
      chapter: parsed.metadata.chapter,
      sectionNumber: parsed.metadata.section,
      order: parsed.metadata.order,
      blocks: parsed.blocks,
    };
  }

  async write(section: Section): Promise<Blob> {
    return new Blob([sectionToMarkdown(section)], { type: 'text/markdown;charset=utf-8' });
  }
}
