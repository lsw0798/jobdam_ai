import { describe, expect, it, vi } from 'vitest';
import {
  createCoverLetterExcelHtml,
  createCoverLetterHtml,
  downloadCoverLetterExcel,
  downloadCoverLetterWord,
} from './coverLetterExport';

class FakeBlob {
  constructor(parts, options) {
    this.parts = parts;
    this.options = options;
  }
}

const letter = {
  masterCd: 'fixture-master-1',
  applicationCompany: '<img src=x onerror="alert(1)">',
  applicationRole: '개발자 & 기획자',
  dutyCode: 'fixture-duty-1',
  consent: true,
  authorName: '홍길동 <관리자>',
  updatedAt: '2026-07-20',
  items: [{
    detailCd: 1,
    title: '지원 "동기"',
    content: '안전한 <내용>과 \'인용\'\n두 번째 줄',
    keywordCode: 'fixture-keyword-1',
    exampleCd: 'fixture-example-1',
  }],
};

function createPlatform() {
  const objectUrlApi = {
    createObjectURL: vi.fn(() => 'blob:cover-letter-document'),
    revokeObjectURL: vi.fn(),
  };
  const link = { click: vi.fn(), remove: vi.fn(), style: {} };
  const documentApi = {
    body: { append: vi.fn() },
    createElement: vi.fn(() => link),
  };
  return {
    link,
    objectUrlApi,
    platform: { BlobConstructor: FakeBlob, documentApi, objectUrlApi },
  };
}

describe('coverLetterExport', () => {
  it('Word와 Excel HTML 모두 사용자 입력을 escaping하고 기업·직무·질문·내용·작성일을 포함한다', () => {
    const wordHtml = createCoverLetterHtml(letter);
    const excelHtml = createCoverLetterExcelHtml(letter);

    for (const html of [wordHtml, excelHtml]) {
      expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
      expect(html).toContain('개발자 &amp; 기획자');
      expect(html).toContain('지원 &quot;동기&quot;');
      expect(html).toContain('안전한 &lt;내용&gt;과 &#39;인용&#39;');
      expect(html).toContain('2026-07-20');
      expect(html).not.toContain('<img src=x onerror="alert(1)">');
    }
  });

  it('AI자소서.doc와 AI자소서.xls 브라우저 목업을 각각 내려받고 자원을 정리한다', () => {
    const word = createPlatform();
    const excel = createPlatform();

    downloadCoverLetterWord(letter, word.platform);
    downloadCoverLetterExcel(letter, excel.platform);

    expect(word.link.download).toBe('AI자소서.doc');
    expect(excel.link.download).toBe('AI자소서.xls');
    expect(word.link.click).toHaveBeenCalledOnce();
    expect(excel.link.click).toHaveBeenCalledOnce();
    expect(word.link.remove).toHaveBeenCalledOnce();
    expect(excel.link.remove).toHaveBeenCalledOnce();
    expect(word.objectUrlApi.revokeObjectURL).toHaveBeenCalledWith('blob:cover-letter-document');
    expect(excel.objectUrlApi.revokeObjectURL).toHaveBeenCalledWith('blob:cover-letter-document');
    const excelBlob = excel.objectUrlApi.createObjectURL.mock.calls[0][0];
    expect(excelBlob.options.type).toBe('application/vnd.ms-excel;charset=utf-8');
  });

  it('링크 click이 실패해도 임시 링크와 object URL을 정리한다', () => {
    const { link, objectUrlApi, platform } = createPlatform();
    link.click.mockImplementation(() => {
      throw new Error('click failed');
    });

    expect(() => downloadCoverLetterWord(letter, platform)).toThrow('click failed');
    expect(link.remove).toHaveBeenCalledOnce();
    expect(objectUrlApi.revokeObjectURL).toHaveBeenCalledWith('blob:cover-letter-document');
  });
});
