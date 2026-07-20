import { describe, expect, it, vi } from 'vitest';
import { createExperienceWordHtml, downloadExperienceWord } from './experienceExport';

class FakeBlob {
  constructor(parts, options) {
    this.parts = parts;
    this.options = options;
  }
}

const documentFixture = {
  profile: { grade: '4<script>', schoolName: '잡담 & 대학교' },
  application: { myscore: '4.0', subjectscore: '4.1', applyCompany: 'A&B' },
  jobModeling: { jobModeling1: '웹 <표준>' },
  competencyRecords: {
    foreignLanguage: { activity: '영어' },
    schoolRecord: {},
    subjectRecord: {},
  },
  sections: {
    certificates: [{ activity: '정보처리기사', date: '2026-01-01' }],
    dutyActivities: [{ activity: '캡스톤', dateFrom: '2025-03-01', dateTo: '2025-12-01' }],
    activities: [],
    others: [],
  },
};

describe('experienceExport', () => {
  it('학년·전체학점·전공학점과 구역별 날짜를 구분하고 사용자 입력을 escaping한다', () => {
    const html = createExperienceWordHtml(documentFixture);

    expect(html).toContain('학년');
    expect(html).toContain('4&lt;script&gt;');
    expect(html).toContain('전체학점');
    expect(html).toContain('전공학점');
    expect(html).toContain('취득일');
    expect(html).toContain('2026-01-01');
    expect(html).toContain('시작일');
    expect(html).toContain('2025-03-01');
    expect(html).toContain('종료일');
    expect(html).toContain('2025-12-01');
    expect(html).not.toContain('4<script>');
    expect(html).toContain('A&amp;B');
  });

  it('downloadData.doc 목업을 내려받은 뒤 링크와 object URL을 정리한다', () => {
    const objectUrlApi = {
      createObjectURL: vi.fn(() => 'blob:experience'),
      revokeObjectURL: vi.fn(),
    };
    const link = { click: vi.fn(), remove: vi.fn(), style: {} };
    const documentApi = {
      body: { append: vi.fn() },
      createElement: vi.fn(() => link),
    };

    downloadExperienceWord(documentFixture, {
      BlobConstructor: FakeBlob,
      documentApi,
      objectUrlApi,
    });

    expect(link.download).toBe('downloadData.doc');
    expect(link.click).toHaveBeenCalledOnce();
    expect(link.remove).toHaveBeenCalledOnce();
    expect(objectUrlApi.revokeObjectURL).toHaveBeenCalledWith('blob:experience');
  });
});
