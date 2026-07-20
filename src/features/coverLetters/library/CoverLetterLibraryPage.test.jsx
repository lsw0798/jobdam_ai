/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CoverLetterLibraryPage } from './CoverLetterLibraryPage';

const fixtureReferences = Object.freeze({
  source: 'fixture',
  banner: 'DB 미연결 계약 목업',
  duties: [
    {
      masterCd: 'fixture-duty-master-1',
      detailCd: 'fixture-duty-detail-1',
      dutyCode: 'fixture-duty-frontend',
      name: '프론트엔드 개발자',
    },
  ],
  keywords: [
    { keywordCode: 'fixture-keyword-problem', name: '문제 해결' },
  ],
  examples: [
    {
      exampleCd: 'fixture-example-1',
      keywordCode: 'fixture-keyword-problem',
      questionOri: 'DB 계약 사례 질문',
      headline: 'DB 사례 헤드라인',
      conclusion: 'DB 사례 결론',
      content: 'DB 사례 본문',
      endline: 'DB 사례 마무리',
    },
  ],
});

function createService(overrides = {}) {
  return {
    adapterInfo: {
      kind: 'owner-scoped-local-mock',
      ownerId: 'fixture-owner',
      serverConnected: false,
    },
    getReferences: vi.fn(() => fixtureReferences),
    load: vi.fn(() => []),
    save: vi.fn((record) => ({
      ...record,
      createdAt: record.createdAt ?? '2026-07-20T09:00:00.000Z',
      updatedAt: '2026-07-20T09:00:00.000Z',
    })),
    remove: vi.fn(() => true),
    ...overrides,
  };
}

async function enterSupportInfo(user) {
  await user.click(screen.getByLabelText('합격사례 제공 동의'));
  await user.type(screen.getByLabelText('지원기업'), '잡담 주식회사');
  await user.selectOptions(screen.getByLabelText('지원직무'), 'fixture-duty-frontend');
  await user.click(screen.getByRole('button', { name: '질문 입력 단계로' }));
}

async function reachReviewStage(user) {
  await enterSupportInfo(user);
  await user.type(screen.getByLabelText('기업 질문 1'), '지원 동기를 알려 주세요.');
  await user.click(screen.getByRole('button', { name: '사례 참고·직접 작성 단계로' }));
  await user.selectOptions(screen.getByLabelText('질문 1 키워드'), 'fixture-keyword-problem');
  await user.selectOptions(screen.getByLabelText('질문 1 합격사례'), 'fixture-example-1');
  await user.type(screen.getByLabelText('질문 1 직접 작성 내용'), '사용자 문제를 해결한 경험입니다.');
  await user.click(screen.getByRole('button', { name: '최종 확인 단계로' }));
}

const savedRecord = Object.freeze({
  masterCd: 73,
  applicationCompany: '테스트 기업',
  applicationRole: '프론트엔드 개발자',
  dutyCode: 'fixture-duty-frontend',
  consent: true,
  items: [
    {
      detailCd: 'fixture-detail-7',
      title: '지원 동기',
      content: '고객 문제를 해결합니다.',
      keywordCode: 'fixture-keyword-problem',
      exampleCd: 'fixture-example-1',
      sentenceType: 'content',
    },
  ],
  createdAt: '2026-07-19T09:00:00.000Z',
  updatedAt: '2026-07-20T09:00:00.000Z',
});

describe('CoverLetterLibraryPage staged workspace', () => {
  it('개발자용 안내 없이 지원직무 선택을 제공하고 직무를 자유입력으로 바꾸지 않는다', () => {
    render(<CoverLetterLibraryPage service={createService()} />);

    expect(screen.getByRole('heading', { name: 'AI 기업·직무 맞춤 자소서 작성' })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/목업|레거시|\bDB\b|localStorage|fixture-/i);
    expect(screen.getByLabelText('합격사례 제공 동의')).toBeInTheDocument();
    expect(screen.getByLabelText('지원기업')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('지원직무').tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: '프론트엔드 개발자' })).toHaveValue('fixture-duty-frontend');
    expect(screen.queryByRole('textbox', { name: '지원직무' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('질문 1 키워드')).not.toBeInTheDocument();
  });

  it('동의·기업·지원직무·직접 질문·참조 ID·직접 작성 내용을 단계별로 저장한다', async () => {
    const user = userEvent.setup();
    const service = createService();
    const onSaved = vi.fn();

    render(<CoverLetterLibraryPage onSaved={onSaved} service={service} />);
    await reachReviewStage(user);

    expect(screen.getByRole('heading', { name: '최종 확인' })).toBeInTheDocument();
    expect(screen.getByText('잡담 주식회사')).toBeInTheDocument();
    expect(screen.getByText('지원 동기를 알려 주세요.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '자기소개서 저장' }));

    expect(service.save).toHaveBeenCalledWith(expect.objectContaining({
      masterCd: expect.stringMatching(/^fixture-/),
      applicationCompany: '잡담 주식회사',
      applicationRole: '프론트엔드 개발자',
      dutyCode: 'fixture-duty-frontend',
      consent: true,
      items: [expect.objectContaining({
        detailCd: 1,
        title: '지원 동기를 알려 주세요.',
        content: '사용자 문제를 해결한 경험입니다.',
        keywordCode: 'fixture-keyword-problem',
        exampleCd: 'fixture-example-1',
        sentenceType: 'content',
      })],
    }));
    const saved = service.save.mock.results[0].value;
    expect(onSaved).toHaveBeenCalledWith(saved);
    expect(screen.getByRole('status')).toHaveTextContent('자기소개서가 저장되었습니다.');
    expect(screen.getByRole('article', { name: /잡담 주식회사/ })).toBeInTheDocument();
  });

  it('reference DTO가 numeric ID를 제공하면 select 문자열로 바꾸지 않고 저장한다', async () => {
    const user = userEvent.setup();
    const numericReferences = {
      source: 'server',
      banner: 'staging reference DTO',
      duties: [{ masterCd: 10, detailCd: 11, dutyCode: 101, name: '숫자 ID 직무' }],
      keywords: [{ keywordCode: 202, name: '숫자 ID 키워드' }],
      examples: [{
        exampleCd: 303,
        keywordCode: 202,
        questionOri: '숫자 ID 사례',
        headline: '헤드라인',
        conclusion: '결론',
        content: '본문',
        endline: '마무리',
      }],
    };
    const service = createService({ getReferences: vi.fn(() => numericReferences) });

    render(<CoverLetterLibraryPage service={service} />);
    await user.click(screen.getByLabelText('합격사례 제공 동의'));
    await user.type(screen.getByLabelText('지원기업'), '숫자 기업');
    await user.selectOptions(screen.getByLabelText('지원직무'), '101');
    await user.click(screen.getByRole('button', { name: '질문 입력 단계로' }));
    await user.type(screen.getByLabelText('기업 질문 1'), '숫자 ID 질문');
    await user.click(screen.getByRole('button', { name: '사례 참고·직접 작성 단계로' }));
    await user.selectOptions(screen.getByLabelText('질문 1 키워드'), '202');
    await user.selectOptions(screen.getByLabelText('질문 1 합격사례'), '303');
    await user.type(screen.getByLabelText('질문 1 직접 작성 내용'), '직접 답변');
    await user.click(screen.getByRole('button', { name: '최종 확인 단계로' }));
    await user.click(screen.getByRole('button', { name: '자기소개서 저장' }));

    expect(service.save).toHaveBeenCalledWith(expect.objectContaining({
      dutyCode: 101,
      items: [expect.objectContaining({ keywordCode: 202, exampleCd: 303 })],
    }));
  });

  it('기업 질문은 사용자가 직접 입력하되 지속 호환 한계인 6개까지만 추가한다', async () => {
    const user = userEvent.setup();
    render(<CoverLetterLibraryPage service={createService()} />);

    await enterSupportInfo(user);
    for (let index = 1; index < 6; index += 1) {
      await user.click(screen.getByRole('button', { name: '기업 질문 추가' }));
    }

    expect(screen.getAllByLabelText(/기업 질문 \d/)).toHaveLength(6);
    expect(screen.getByRole('button', { name: '기업 질문 추가' })).toBeDisabled();
    expect(screen.getByText('6 / 6개')).toBeInTheDocument();
    expect(screen.queryByLabelText('기업 질문 7')).not.toBeInTheDocument();
  });

  it('합격사례는 읽기 전용으로 보여 주고 키워드·사례 식별자를 유지한다', async () => {
    const user = userEvent.setup();
    render(<CoverLetterLibraryPage service={createService()} />);

    await enterSupportInfo(user);
    await user.type(screen.getByLabelText('기업 질문 1'), '직무 역량을 설명해 주세요.');
    await user.click(screen.getByRole('button', { name: '사례 참고·직접 작성 단계로' }));
    await user.selectOptions(screen.getByLabelText('질문 1 키워드'), 'fixture-keyword-problem');
    await user.selectOptions(screen.getByLabelText('질문 1 합격사례'), 'fixture-example-1');

    const reference = screen.getByRole('region', { name: '질문 1 합격사례 참조' });
    expect(within(reference).getByText(/사례 본문/)).toBeInTheDocument();
    expect(reference).not.toHaveTextContent(/\bDB\b|fixture-/i);
    expect(within(reference).queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByLabelText('질문 1 합격사례')).toHaveValue('fixture-example-1');
  });

  it('이력에서 numeric/string ID를 유지한 채 수정·삭제와 Word/Excel 다운로드를 제공한다', async () => {
    const user = userEvent.setup();
    const service = createService({ load: vi.fn(() => [savedRecord]) });
    const exportDocument = vi.fn();
    const exportSpreadsheet = vi.fn();

    render(
      <CoverLetterLibraryPage
        exportDocument={exportDocument}
        exportSpreadsheet={exportSpreadsheet}
        service={service}
      />,
    );

    const article = screen.getByRole('article', { name: /테스트 기업/ });
    await user.click(within(article).getByRole('button', { name: 'Word 다운로드' }));
    await user.click(within(article).getByRole('button', { name: 'Excel 다운로드' }));
    expect(exportDocument).toHaveBeenCalledWith(savedRecord);
    expect(exportSpreadsheet).toHaveBeenCalledWith(savedRecord);
    expect(screen.getByRole('status')).toHaveTextContent('Excel 파일 다운로드를 시작했습니다.');

    await user.click(within(article).getByRole('button', { name: '수정' }));
    expect(screen.getByLabelText('지원기업')).toHaveValue('테스트 기업');
    expect(screen.getByLabelText('지원직무')).toHaveValue('fixture-duty-frontend');

    await user.click(within(article).getByRole('button', { name: '삭제' }));
    expect(service.remove).toHaveBeenCalledWith(73);
    expect(screen.queryByRole('article', { name: /테스트 기업/ })).not.toBeInTheDocument();
  });

  it('필수 동의·기업·지원직무가 없으면 다음 단계로 가지 않고 접근 가능한 오류를 안내한다', async () => {
    const user = userEvent.setup();
    const service = createService();

    render(<CoverLetterLibraryPage service={service} />);
    await user.click(screen.getByRole('button', { name: '질문 입력 단계로' }));

    expect(screen.getByRole('alert')).toHaveTextContent('사례 제공 동의와 지원기업, 지원직무를 확인해 주세요.');
    expect(screen.getByLabelText('합격사례 제공 동의')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('지원기업')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('지원직무')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('heading', { name: '기업 질문 직접 입력' })).not.toBeInTheDocument();
    expect(service.save).not.toHaveBeenCalled();
  });

  it('저장 실패 시 완료 콜백 없이 오류를 표시한다', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const service = createService({
      load: vi.fn(() => [savedRecord]),
      save: vi.fn(() => {
        throw new Error('quota exceeded');
      }),
    });

    render(<CoverLetterLibraryPage onSaved={onSaved} service={service} />);
    const article = screen.getByRole('article', { name: /테스트 기업/ });
    await user.click(within(article).getByRole('button', { name: '수정' }));
    await user.click(screen.getByRole('button', { name: '질문 입력 단계로' }));
    await user.click(screen.getByRole('button', { name: '사례 참고·직접 작성 단계로' }));
    await user.click(screen.getByRole('button', { name: '최종 확인 단계로' }));
    await user.click(screen.getByRole('button', { name: '자기소개서 저장' }));

    expect(screen.getByRole('alert')).toHaveTextContent('자기소개서를 저장하지 못했습니다.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
