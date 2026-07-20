import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ResumePage } from './ResumePage';

const emptyResumeService = {
  load: () => null,
  save: () => undefined,
};

describe('ResumePage', () => {
  it('이력서에 필요한 핵심 입력 항목을 제공한다', () => {
    render(<ResumePage service={emptyResumeService} />);

    expect(screen.getByRole('heading', { name: '이력서 작성' })).toBeInTheDocument();
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByLabelText('희망 직무')).toBeInTheDocument();
    expect(screen.getByLabelText('학교 구분')).toBeInTheDocument();
    expect(screen.getByLabelText('학교명')).toBeInTheDocument();
    expect(screen.getByLabelText('졸업 상태')).toBeInTheDocument();
    expect(screen.getByLabelText('회사명')).toBeInTheDocument();
    expect(screen.getByLabelText('자격증명')).toBeInTheDocument();
    expect(screen.getByLabelText('시험명')).toBeInTheDocument();
    expect(screen.getByLabelText('대회명')).toBeInTheDocument();
    expect(screen.getByLabelText('희망 직무 분야')).toBeInTheDocument();
  });

  it('기본 정보와 모든 반복 입력을 컬럼 헤더가 있는 표로 제공한다', () => {
    render(<ResumePage service={emptyResumeService} />);

    const tableContracts = [
      ['기본 정보 입력 표', ['이름', '희망 직무']],
      ['학력 입력 표', ['학교 구분', '학교명', '재학 기간', '전공', '졸업 상태', '관리']],
      ['경력 입력 표', ['회사명', '담당 직무', '재직 기간', '업무 설명', '관리']],
      ['자격증 입력 표', ['자격증명', '발급 기관', '취득일', '관리']],
      ['어학 성적 입력 표', ['시험명', '점수', '응시일', '관리']],
      ['수상 입력 표', ['대회명', '수상명', '수상일', '관리']],
      ['희망 직무 분야 입력 표', ['희망 직무 분야', '관리']],
    ];

    tableContracts.forEach(([tableName, expectedHeaders]) => {
      const table = screen.getByRole('table', { name: tableName });
      const headers = within(table).getAllByRole('columnheader');

      expect(headers.map((header) => header.textContent)).toEqual(expectedHeaders);
      expect(within(table).getAllByRole('row')).toHaveLength(2);
    });
  });

  it('필수 학력 정보가 없으면 저장하지 않고 안내한다', async () => {
    const user = userEvent.setup();
    const service = {
      load: () => null,
      save: vi.fn(),
    };

    render(<ResumePage service={service} />);

    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(screen.getByRole('alert')).toHaveTextContent('학교 구분, 학교명, 졸업 상태');
    expect(service.save).not.toHaveBeenCalled();
  });

  it('유효한 이력서를 저장하고 부모에게 저장 결과를 알린다', async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    const onSaved = vi.fn();
    const service = {
      load: () => null,
      save,
    };

    render(<ResumePage service={service} onSaved={onSaved} />);

    await user.type(screen.getByLabelText('이름'), '홍길동');
    await user.type(screen.getByLabelText('희망 직무'), '프론트엔드 개발자');
    await user.selectOptions(screen.getByLabelText('학교 구분'), '대학교');
    await user.type(screen.getByLabelText('학교명'), '잡담대학교');
    await user.selectOptions(screen.getByLabelText('졸업 상태'), '졸업');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      profileName: '홍길동',
      desiredRole: '프론트엔드 개발자',
      educations: [expect.objectContaining({
        schoolType: '대학교',
        schoolName: '잡담대학교',
        status: '졸업',
      })],
    }));
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ profileName: '홍길동' }));
    expect(screen.getByRole('status')).toHaveTextContent('이력서가 저장되었습니다.');
  });

  it('저장소 오류가 발생하면 저장 완료 처리 없이 오류를 안내한다', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const service = {
      load: () => null,
      save: vi.fn(() => {
        throw new Error('storage quota exceeded');
      }),
    };

    render(<ResumePage onSaved={onSaved} service={service} />);
    await user.selectOptions(screen.getByLabelText('학교 구분'), '대학교');
    await user.type(screen.getByLabelText('학교명'), '잡담대학교');
    await user.selectOptions(screen.getByLabelText('졸업 상태'), '졸업');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(screen.getByRole('alert')).toHaveTextContent('이력서를 저장하지 못했습니다.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('저장된 이력서 내용을 편집기에 불러온다', () => {
    const service = {
      load: vi.fn(() => ({
        profileName: '김저장',
        desiredRole: '데이터 분석가',
        educations: [{
          id: 'stored-education',
          schoolType: '대학교',
          schoolName: '저장대학교',
          period: '2018.03 - 2022.02',
          major: '통계학',
          status: '졸업',
        }],
        careers: [],
        certificates: [],
        languageScores: [],
        awards: [],
        desiredJobFields: [],
      })),
      save: vi.fn(),
    };

    render(<ResumePage service={service} />);

    expect(service.load).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('이름')).toHaveValue('김저장');
    expect(screen.getByLabelText('희망 직무')).toHaveValue('데이터 분석가');
    expect(screen.getByLabelText('학교 구분')).toHaveValue('대학교');
    expect(screen.getByLabelText('학교명')).toHaveValue('저장대학교');
    expect(screen.getByLabelText('졸업 상태')).toHaveValue('졸업');
  });

  it('학력 항목을 추가하고 삭제할 수 있다', async () => {
    const user = userEvent.setup();
    render(<ResumePage service={emptyResumeService} />);

    await user.click(screen.getByRole('button', { name: '학력 추가' }));

    const secondEducation = screen.getByRole('row', { name: '학력 2' });
    expect(within(secondEducation).getByLabelText('학교명')).toBeInTheDocument();

    await user.click(within(secondEducation).getByRole('button', { name: '학력 항목 삭제' }));

    expect(screen.queryByRole('row', { name: '학력 2' })).not.toBeInTheDocument();
    expect(screen.getByRole('row', { name: '학력 1' })).toBeInTheDocument();
  });

  it.each([
    ['경력', '회사명'],
    ['자격증', '자격증명'],
    ['어학 성적', '시험명'],
    ['수상', '대회명'],
    ['희망 직무 분야', '희망 직무 분야'],
  ])('%s 항목을 반복해서 추가하고 삭제할 수 있다', async (sectionTitle, fieldLabel) => {
    const user = userEvent.setup();
    render(<ResumePage service={emptyResumeService} />);

    await user.click(screen.getByRole('button', { name: `${sectionTitle} 추가` }));

    const secondEntry = screen.getByRole('row', { name: `${sectionTitle} 2` });
    expect(within(secondEntry).getByLabelText(fieldLabel)).toBeInTheDocument();

    await user.click(within(secondEntry).getByRole('button', { name: `${sectionTitle} 항목 삭제` }));

    expect(screen.queryByRole('row', { name: `${sectionTitle} 2` })).not.toBeInTheDocument();
  });
});
