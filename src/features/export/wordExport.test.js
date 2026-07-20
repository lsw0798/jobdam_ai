import { describe, expect, it, vi } from 'vitest';
import {
  createExperienceWordHtml,
  DEFAULT_EXPERIENCE_WORD_FILENAME,
  downloadExperienceWord,
} from './wordExport';

describe('wordExport', () => {
  it('사용자 입력을 HTML 이스케이프한 Word 호환 문서를 만든다', () => {
    const html = createExperienceWordHtml({
      targetCompany: '<img src=x onerror="alert(1)">',
      targetRole: 'R&D "플랫폼"',
      knowledge: "<script>alert('x')</script>",
      experiences: [
        {
          category: 'dutyActivity',
          activity: '서비스 <개선>',
          period: '2024 & 2025',
          knowledge: 'React',
          skill: '테스트',
          attitude: '주도성',
        },
      ],
    });

    expect(DEFAULT_EXPERIENCE_WORD_FILENAME).toBe('경험리스트.doc');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(html).toContain('R&amp;D &quot;플랫폼&quot;');
    expect(html).toContain('&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;');
    expect(html).toContain('서비스 &lt;개선&gt;');
    expect(html).toContain('2024 &amp; 2025');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
  });

  it('Object URL과 다운로드 링크로 Word 파일을 내려받는다', () => {
    const link = {
      click: vi.fn(),
      download: '',
      href: '',
      remove: vi.fn(),
      style: {},
    };
    const documentRef = {
      body: { append: vi.fn() },
      createElement: vi.fn(() => link),
    };
    const urlApi = {
      createObjectURL: vi.fn(() => 'blob:experience-list'),
      revokeObjectURL: vi.fn(),
    };

    const blob = downloadExperienceWord(
      { targetCompany: '잡담 AI', experiences: [] },
      { documentRef, urlApi },
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/msword;charset=utf-8');
    expect(documentRef.createElement).toHaveBeenCalledWith('a');
    expect(link.href).toBe('blob:experience-list');
    expect(link.download).toBe(DEFAULT_EXPERIENCE_WORD_FILENAME);
    expect(documentRef.body.append).toHaveBeenCalledWith(link);
    expect(link.click).toHaveBeenCalledOnce();
    expect(link.remove).toHaveBeenCalledOnce();
    expect(urlApi.revokeObjectURL).toHaveBeenCalledWith('blob:experience-list');
  });

  it('다운로드 동작이 실패해도 임시 링크와 Object URL을 정리한다', () => {
    const downloadError = new Error('다운로드 실패');
    const link = {
      click: vi.fn(() => { throw downloadError; }),
      download: '',
      href: '',
      remove: vi.fn(),
      style: {},
    };
    const documentRef = {
      body: { append: vi.fn() },
      createElement: vi.fn(() => link),
    };
    const urlApi = {
      createObjectURL: vi.fn(() => 'blob:experience-list'),
      revokeObjectURL: vi.fn(),
    };

    expect(() => downloadExperienceWord({}, { documentRef, urlApi })).toThrow(downloadError);
    expect(link.remove).toHaveBeenCalledOnce();
    expect(urlApi.revokeObjectURL).toHaveBeenCalledWith('blob:experience-list');
  });
});
