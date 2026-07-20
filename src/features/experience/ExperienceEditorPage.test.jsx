import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExperienceEditorPage } from './ExperienceEditorPage';

function createService(overrides = {}) {
  return {
    adapterInfo: {
      kind: 'owner-scoped-local-mock',
      ownerId: 'owner-1',
      serverConnected: false,
    },
    load: vi.fn(() => null),
    save: vi.fn((document) => document),
    ...overrides,
  };
}

describe('ExperienceEditorPage legacy contract', () => {
  it('입력 영역을 요청된 열 제목의 의미 있는 표로 제공한다', () => {
    render(<ExperienceEditorPage service={createService()} />);

    const expectedHeaders = new Map([
      ['기본 정보', ['구분', '내용']],
      ['지원 정보', ['구분', '내용']],
      ['직무 역량', ['구분', '내용']],
      ['성적·외국어 역량 기록', ['구분', '활동내용', '지식', '스킬', '태도']],
      ['수상·자격증', ['구분', '활동내용', '취득일', '지식', '스킬', '태도', '관리']],
      ['직무·전공 활동', ['구분', '활동내용', '시작일', '종료일', '지식', '스킬', '태도', '관리']],
      ['대내·외 활동', ['구분', '활동내용', '활동일', '지식', '스킬', '태도', '관리']],
      ['기타', ['구분', '활동내용', '활동일', '지식', '스킬', '태도', '관리']],
    ]);

    expect(screen.getAllByRole('table')).toHaveLength(expectedHeaders.size);

    for (const [sectionName, headers] of expectedHeaders) {
      const section = screen.getByRole('region', { name: sectionName });
      const table = within(section).getByRole('table');
      expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(headers);
    }
  });

  it('개발자용 문구를 숨기고 고객용 다운로드 문구와 행 제한만 보여준다', async () => {
    const user = userEvent.setup();
    render(<ExperienceEditorPage downloadDocument={vi.fn()} service={createService()} />);

    expect(screen.getByRole('main')).not.toHaveTextContent(/목업|레거시|\bDB\b|localStorage|LEGACY CONTRACT/i);
    expect(screen.getAllByText('1 / 29행')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Word 다운로드' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Word 다운로드' }));

    expect(screen.getByRole('status')).toHaveTextContent('Word 파일을 다운로드했습니다.');
  });

  it('category 선택 대신 레거시 고정 영역과 서로 다른 학년·학점 필드를 제공한다', () => {
    render(<ExperienceEditorPage service={createService()} />);

    expect(screen.getByLabelText('학년')).toBeInTheDocument();
    expect(screen.getByLabelText('전체학점')).toBeInTheDocument();
    expect(screen.getByLabelText('전공학점')).toBeInTheDocument();
    expect(screen.getByLabelText('졸업 시기')).toBeInTheDocument();
    expect(screen.getByLabelText('전공')).toBeInTheDocument();
    expect(screen.getByLabelText('지원 기업')).toBeInTheDocument();
    expect(screen.getByLabelText('지원 직무')).toBeInTheDocument();
    expect(screen.getByLabelText('휴대전화')).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('SNS 홈페이지')).toBeInTheDocument();

    expect(screen.getByLabelText('필요지식')).toBeInTheDocument();
    expect(screen.getByLabelText('필요스킬')).toBeInTheDocument();
    expect(screen.getByLabelText('직무적합성')).toBeInTheDocument();
    expect(screen.getByLabelText('인재상')).toBeInTheDocument();

    for (const section of ['외국어', '전체성적', '전공성적']) {
      expect(screen.getByLabelText(`${section} 활동내용`)).toBeInTheDocument();
      expect(screen.getByLabelText(`${section} 지식`)).toBeInTheDocument();
      expect(screen.getByLabelText(`${section} 스킬`)).toBeInTheDocument();
      expect(screen.getByLabelText(`${section} 태도`)).toBeInTheDocument();
    }

    for (const heading of ['수상·자격증', '직무·전공 활동', '대내·외 활동', '기타']) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    }

    expect(screen.queryByLabelText(/분류/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('수상·자격증 1 취득일')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('직무·전공 활동 1 시작일')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('직무·전공 활동 1 종료일')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('대내·외 활동 1 활동일')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('기타 1 활동일')).toHaveAttribute('type', 'date');
  });

  it('고정 반복영역별로 행을 추가·삭제하며 날짜 의미와 다른 영역 값을 보존한다', async () => {
    const user = userEvent.setup();
    render(<ExperienceEditorPage service={createService()} />);

    fireEvent.change(screen.getByLabelText('수상·자격증 1 활동내용'), { target: { value: '정보처리기사' } });
    fireEvent.change(screen.getByLabelText('직무·전공 활동 1 활동내용'), { target: { value: '캡스톤 프로젝트' } });
    fireEvent.change(screen.getByLabelText('직무·전공 활동 1 시작일'), { target: { value: '2025-03-01' } });
    fireEvent.change(screen.getByLabelText('직무·전공 활동 1 종료일'), { target: { value: '2025-12-01' } });

    await user.click(screen.getByRole('button', { name: '수상·자격증 행 추가' }));
    fireEvent.change(screen.getByLabelText('수상·자격증 2 활동내용'), { target: { value: 'SQLD' } });
    await user.click(screen.getByRole('button', { name: '수상·자격증 2 삭제' }));

    expect(screen.queryByLabelText('수상·자격증 2 활동내용')).not.toBeInTheDocument();
    expect(screen.getByLabelText('수상·자격증 1 활동내용')).toHaveValue('정보처리기사');
    expect(screen.getByLabelText('직무·전공 활동 1 활동내용')).toHaveValue('캡스톤 프로젝트');
    expect(screen.getByLabelText('직무·전공 활동 1 시작일')).toHaveValue('2025-03-01');
    expect(screen.getByLabelText('직무·전공 활동 1 종료일')).toHaveValue('2025-12-01');
  });

  it('레거시 의미를 보존한 고정 섹션 DTO를 저장하고 부모 콜백에 전달한다', async () => {
    const user = userEvent.setup();
    const service = createService();
    const onSaved = vi.fn();

    render(<ExperienceEditorPage onSaved={onSaved} service={service} />);

    fireEvent.change(screen.getByLabelText('학년'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('전체학점'), { target: { value: '4.0' } });
    fireEvent.change(screen.getByLabelText('전공학점'), { target: { value: '4.1' } });
    fireEvent.change(screen.getByLabelText('지원 기업'), { target: { value: '잡담 AI' } });
    fireEvent.change(screen.getByLabelText('지원 직무'), { target: { value: '프론트엔드 개발자' } });
    fireEvent.change(screen.getByLabelText('필요지식'), { target: { value: '웹 표준' } });
    fireEvent.change(screen.getByLabelText('외국어 활동내용'), { target: { value: '영어 발표' } });
    fireEvent.change(screen.getByLabelText('수상·자격증 1 활동내용'), { target: { value: '정보처리기사' } });
    fireEvent.change(screen.getByLabelText('수상·자격증 1 취득일'), { target: { value: '2026-01-02' } });
    fireEvent.change(screen.getByLabelText('직무·전공 활동 1 시작일'), { target: { value: '2025-03-01' } });
    fireEvent.change(screen.getByLabelText('직무·전공 활동 1 종료일'), { target: { value: '2025-12-01' } });
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(service.save).toHaveBeenCalledWith(expect.objectContaining({
      profile: expect.objectContaining({ grade: '4' }),
      application: expect.objectContaining({
        applyCompany: '잡담 AI',
        dutyCompany: '프론트엔드 개발자',
        myscore: '4.0',
        subjectscore: '4.1',
      }),
      jobModeling: expect.objectContaining({ jobModeling1: '웹 표준' }),
      competencyRecords: expect.objectContaining({
        foreignLanguage: expect.objectContaining({ activity: '영어 발표' }),
      }),
      sections: expect.objectContaining({
        certificates: [expect.objectContaining({ activity: '정보처리기사', date: '2026-01-02' })],
        dutyActivities: [expect.objectContaining({ dateFrom: '2025-03-01', dateTo: '2025-12-01' })],
        activities: [expect.any(Object)],
        others: [expect.any(Object)],
      }),
    }));
    expect(screen.getByRole('status')).toHaveTextContent('경험 리스트가 저장되었습니다.');
    expect(onSaved).toHaveBeenCalledWith(service.save.mock.results[0].value);
  }, 15_000);

  it('다운로드 전에 현재 DTO를 저장하고 저장된 문서만 Word 다운로드에 전달한다', async () => {
    const user = userEvent.setup();
    const callOrder = [];
    const savedDocument = { profile: {}, application: { applyCompany: '저장 결과' }, sections: {} };
    const service = createService({
      save: vi.fn(() => {
        callOrder.push('save');
        return savedDocument;
      }),
    });
    const downloadDocument = vi.fn((document) => {
      callOrder.push('download');
      expect(document).toBe(savedDocument);
    });

    render(<ExperienceEditorPage downloadDocument={downloadDocument} service={service} />);
    await user.click(screen.getByRole('button', { name: 'Word 다운로드' }));

    expect(callOrder).toEqual(['save', 'download']);
    expect(screen.getByRole('status')).toHaveTextContent('Word 파일을 다운로드했습니다.');
  });

  it('저장소 오류가 발생하면 완료 처리나 다운로드 없이 접근 가능한 오류를 표시한다', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const downloadDocument = vi.fn();
    const service = createService({
      save: vi.fn(() => {
        throw new Error('storage quota exceeded');
      }),
    });

    render(
      <ExperienceEditorPage
        downloadDocument={downloadDocument}
        onSaved={onSaved}
        service={service}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Word 다운로드' }));

    const alert = screen.getByRole('alert');
    expect(within(alert).getByText(/경험 리스트를 저장하지 못했습니다/)).toBeInTheDocument();
    expect(downloadDocument).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
