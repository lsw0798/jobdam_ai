import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InterviewWorkspacePage } from './InterviewWorkspacePage';
import {
  createInterviewWorkspaceService,
  INTERVIEW_REFERENCE_FIXTURES,
  INTERVIEW_WORKSPACE_STORAGE_KEY,
} from './interviewWorkspaceService';

function createService(overrides = {}) {
  return {
    getReferenceData: () => INTERVIEW_REFERENCE_FIXTURES,
    load: () => null,
    save: (workspace) => workspace,
    ...overrides,
  };
}

async function advanceToQuestionSelection(user) {
  await user.click(screen.getByRole('radio', { name: '신입(인턴)' }));
  await user.click(screen.getByRole('button', { name: '다음: 기업·직무 선택' }));
  await user.click(screen.getByRole('radio', { name: '직무 A' }));
  await user.click(screen.getByRole('button', { name: '다음: 질문 선택' }));
}

async function advanceToAnswerWriting(user) {
  await advanceToQuestionSelection(user);
  await user.click(screen.getByRole('checkbox', { name: '질문 1' }));
  await user.click(screen.getByRole('button', { name: '다음: 답변 작성' }));
}

function expectNoDeveloperCopy() {
  expect(document.body).not.toHaveTextContent(/LEGACY CONTRACT|목업|레거시|\bDB\b|fixture-/i);
  expect(screen.queryByRole('note')).not.toBeInTheDocument();
}

describe('InterviewWorkspacePage legacy contract', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('기본정보와 BIO 질문을 하나의 semantic table로 제공한다', () => {
    render(<InterviewWorkspacePage service={createService()} />);

    const table = screen.getByRole('table', { name: '기본정보 및 BIO 질문' });

    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      '항목',
      '입력 내용',
    ]);
    expect(within(table).getByRole('rowheader', { name: '지원 구분' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: '전공' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', {
      name: '지원하는 직무는 전공과 일치하는 편입니까?',
    })).toBeInTheDocument();
    expect(within(table).getByRole('radio', { name: '신입(인턴)' })).toBeInTheDocument();
  });

  it('개발자용 안내와 내부 식별자를 6단계 고객 화면에서 숨긴다', async () => {
    const user = userEvent.setup();
    render(<InterviewWorkspacePage service={createService()} />);

    expect(screen.getByRole('heading', { name: '직무별 합격사례 면접답변 작성' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '면접답변 작성 단계' })).toHaveTextContent(
      /기본정보.*기업·직무.*질문 선택.*답변 작성.*키워드.*연습·다운로드/,
    );
    expectNoDeveloperCopy();

    await user.click(screen.getByRole('radio', { name: '신입(인턴)' }));
    await user.click(screen.getByRole('button', { name: '다음: 기업·직무 선택' }));
    expectNoDeveloperCopy();

    await user.click(screen.getByRole('radio', { name: '직무 A' }));
    await user.click(screen.getByRole('button', { name: '다음: 질문 선택' }));
    expectNoDeveloperCopy();

    await user.click(screen.getByRole('checkbox', { name: '질문 1' }));
    await user.click(screen.getByRole('button', { name: '다음: 답변 작성' }));
    expectNoDeveloperCopy();

    await user.click(screen.getByRole('button', { name: '다음: 키워드 작성' }));
    expectNoDeveloperCopy();

    await user.click(screen.getByRole('button', { name: '다음: 연습·다운로드' }));
    expectNoDeveloperCopy();
    expect(screen.getByRole('button', { name: 'Word 다운로드' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excel 다운로드' })).toBeInTheDocument();
  });

  it('질문의도·답변방향·Best 사례를 읽기 전용으로 보여 주고 일반 답변을 작성한다', async () => {
    const user = userEvent.setup();
    render(<InterviewWorkspacePage service={createService()} />);

    await advanceToAnswerWriting(user);

    const answerTable = screen.getByRole('table', { name: '면접 답변 작성' });
    expect(within(answerTable).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      '면접 질문',
      '질문 의도',
      '답변 방향',
      '유사질문',
      'Best 답변 사례',
      '나의 답변',
      '후속 질문 답변',
      '추가 질문',
    ]);
    expect(screen.getByText('질문의도')).toBeInTheDocument();
    expect(screen.getByText('답변방향')).toBeInTheDocument();
    expect(screen.getAllByText('Best 답변 사례')).toHaveLength(2);
    expect(screen.queryByRole('textbox', { name: /질문 의도/ })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '나의 답변 — 질문 1' })).toBeInTheDocument();
  });

  it('질문·기능 식별자와 답변·키워드·후속질문을 DTO로 저장한다', async () => {
    const user = userEvent.setup();
    const save = vi.fn((workspace) => workspace);
    const onSaved = vi.fn();
    render(<InterviewWorkspacePage onSaved={onSaved} service={createService({ save })} />);

    await advanceToAnswerWriting(user);
    await user.type(screen.getByRole('textbox', { name: '나의 답변 — 질문 1' }), '일반 답변 내용');
    await user.type(screen.getByRole('textbox', { name: '후속 질문 답변 — 질문 1' }), '후속 답변 내용');
    await user.click(screen.getByRole('button', { name: '추가 질문 추가' }));
    await user.type(screen.getByRole('textbox', { name: '추가 질문 1' }), '추가 질문 내용');
    await user.type(screen.getByRole('textbox', { name: '추가 질문 답변 1' }), '추가 답변 내용');
    await user.click(screen.getByRole('button', { name: '다음: 키워드 작성' }));
    const keywordTable = screen.getByRole('table', { name: '면접 키워드 작성' });
    expect(within(keywordTable).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      '면접 질문',
      '키워드',
    ]);
    await user.type(screen.getByRole('textbox', { name: '키워드 — 질문 1' }), '협업, 문제해결');
    await user.click(screen.getByRole('button', { name: '다음: 연습·다운로드' }));
    await user.click(screen.getByRole('button', { name: '면접노트 저장' }));

    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      functionCode: 'fixture-function-a',
      questionIds: ['fixture-question-1'],
      answers: [{
        cdQuestion: 'fixture-question-1',
        cdFunction: 'fixture-function-a',
        contents: '일반 답변 내용',
        followContents: '후속 답변 내용',
        myUnderline: '협업, 문제해결',
        additionalQuestions: [{
          cdFlag: 'fixture-add-1',
          question: '추가 질문 내용',
          contents: '추가 답변 내용',
        }],
      }],
    }));
    expect(screen.getByRole('status')).toHaveTextContent('면접노트가 저장되었습니다.');
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('사용자별 저장과 레거시 질문·추가질문 제한을 적용한다', () => {
    const service = createInterviewWorkspaceService(window.localStorage, 'owner-a');
    const workspace = {
      bio: { applicationType: 'new' },
      functionCode: 'fixture-function-a',
      questionIds: ['fixture-question-1'],
      answers: [{
        cdQuestion: 'fixture-question-1',
        cdFunction: 'fixture-function-a',
        contents: '답변',
        followContents: '',
        myUnderline: '',
        additionalQuestions: [],
      }],
    };

    service.save(workspace);

    expect(createInterviewWorkspaceService(window.localStorage, 'owner-a').load()).toMatchObject(workspace);
    expect(createInterviewWorkspaceService(window.localStorage, 'owner-b').load()).toBeNull();
    expect(() => service.save({
      ...workspace,
      questionIds: Array.from({ length: 51 }, (_, index) => `fixture-question-${index}`),
    })).toThrow('50개');
    expect(() => service.save({
      ...workspace,
      answers: [{ ...workspace.answers[0], additionalQuestions: Array.from({ length: 4 }, (_, index) => ({
        cdFlag: `fixture-add-${index}`,
        question: '',
        contents: '',
      })) }],
    })).toThrow('3개');
    expect(INTERVIEW_WORKSPACE_STORAGE_KEY).toContain('interview-workspace');
  });
});