import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExperienceEditorPage } from './ExperienceEditorPage';

describe('ExperienceEditorPage restore behavior', () => {
  it('고정 섹션과 서로 다른 날짜 필드를 복원한 뒤 새 행 ID가 충돌하지 않는다', async () => {
    const user = userEvent.setup();
    const service = {
      load: vi.fn(() => ({
        profile: { grade: '3' },
        application: { applyCompany: '저장된 회사', myscore: '3.8', subjectscore: '4.0' },
        jobModeling: { jobModeling1: '저장된 지식' },
        competencyRecords: {
          foreignLanguage: { activity: '영어' },
          schoolRecord: {},
          subjectRecord: {},
        },
        sections: {
          certificates: [{ clientId: 'certificate-1', activity: '기존 자격증', date: '2025-01-01' }],
          dutyActivities: [{ clientId: 'duty-1', activity: '기존 활동', dateFrom: '2025-03-01', dateTo: '2025-12-01' }],
          activities: [],
          others: [],
        },
      })),
      save: vi.fn((document) => document),
    };

    render(<ExperienceEditorPage service={service} />);

    expect(await screen.findByLabelText('학년')).toHaveValue('3');
    expect(screen.getByLabelText('전체학점')).toHaveValue('3.8');
    expect(screen.getByLabelText('전공학점')).toHaveValue('4.0');
    expect(screen.getByLabelText('직무·전공 활동 1 시작일')).toHaveValue('2025-03-01');
    expect(screen.getByLabelText('직무·전공 활동 1 종료일')).toHaveValue('2025-12-01');

    await user.click(screen.getByRole('button', { name: '수상·자격증 행 추가' }));
    await user.type(screen.getByLabelText('수상·자격증 2 활동내용'), '새 자격증');
    await user.click(screen.getByRole('button', { name: '수상·자격증 2 삭제' }));

    expect(screen.getByLabelText('수상·자격증 1 활동내용')).toHaveValue('기존 자격증');
  });

  it('손상된 중첩 값은 빈 문자열과 각 고정 영역의 빈 행으로 복구한다', async () => {
    const service = {
      load: vi.fn(() => ({
        profile: { grade: { unexpected: true } },
        application: null,
        competencyRecords: { foreignLanguage: null },
        sections: { certificates: null, dutyActivities: 'wrong shape' },
      })),
      save: vi.fn(),
    };

    render(<ExperienceEditorPage service={service} />);

    expect(await screen.findByLabelText('학년')).toHaveValue('');
    expect(screen.getByLabelText('지원 기업')).toHaveValue('');
    expect(screen.getByLabelText('외국어 활동내용')).toHaveValue('');
    expect(screen.getByLabelText('수상·자격증 1 활동내용')).toHaveValue('');
    expect(screen.getByLabelText('직무·전공 활동 1 활동내용')).toHaveValue('');
  });
});
