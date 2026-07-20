import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SuccessExamplesWorkspacePage } from './SuccessExamplesWorkspacePage';
import { SUCCESS_EXAMPLES_REFERENCE_FIXTURES } from './successExamplesWorkspaceService';

function createInjectedService({ history = [], loaded = null, save = vi.fn((workspace) => workspace) } = {}) {
  return {
    getReferenceData: () => SUCCESS_EXAMPLES_REFERENCE_FIXTURES,
    listHistory: () => history,
    load: () => loaded,
    save,
  };
}

async function advanceToExampleSelection(user) {
  await user.click(screen.getByRole('checkbox', { name: /계약 목업 직무 A/ }));
  await user.click(screen.getByRole('button', { name: '다음: 항목 선택' }));
  await user.click(screen.getByRole('radio', { name: '기본항목' }));
  await user.click(screen.getByRole('radio', { name: /계약 목업 기본항목 A/ }));
  await user.click(screen.getByRole('button', { name: '다음: 항목 안내' }));
  await user.click(screen.getByRole('button', { name: '다음: 사례 선택' }));
}

describe('SuccessExamplesWorkspacePage', () => {
  it('DB 미연결 목업을 밝히고 자유 텍스트 직무 대신 직무 코드를 최대 3개 선택한다', async () => {
    const user = userEvent.setup();

    render(<SuccessExamplesWorkspacePage service={createInjectedService()} />);

    expect(screen.getByRole('heading', { name: '항목의도·직무별 합격사례 자소서' })).toBeInTheDocument();
    expect(screen.getByText(/DB 미연결 계약 목업/)).toBeInTheDocument();
    expect(screen.queryByLabelText('직무')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('자소서 항목의도')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('나의 사례')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('작성 초안')).not.toBeInTheDocument();

    const groupA = screen.getByRole('checkbox', { name: /계약 목업 직무 A/ });
    const groupB = screen.getByRole('checkbox', { name: /계약 목업 직무 B/ });
    const groupC = screen.getByRole('checkbox', { name: /계약 목업 직무 C/ });
    const groupD = screen.getByRole('checkbox', { name: /계약 목업 직무 D/ });

    await user.click(groupA);
    await user.click(groupB);
    await user.click(groupC);

    expect(groupA).toBeChecked();
    expect(groupB).toBeChecked();
    expect(groupC).toBeChecked();
    expect(groupD).toBeDisabled();
    expect(screen.getByText('3 / 3개 선택')).toBeInTheDocument();
  });

  it('기본·심화 item code를 선택하고 DB 소유 안내를 입력칸이 아닌 읽기 전용으로 표시한다', async () => {
    const user = userEvent.setup();

    render(<SuccessExamplesWorkspacePage service={createInjectedService()} />);

    await user.click(screen.getByRole('checkbox', { name: /계약 목업 직무 A/ }));
    await user.click(screen.getByRole('button', { name: '다음: 항목 선택' }));
    await user.click(screen.getByRole('radio', { name: '기본항목' }));
    await user.click(screen.getByRole('radio', { name: /계약 목업 기본항목 A/ }));
    await user.click(screen.getByRole('button', { name: '다음: 항목 안내' }));

    expect(screen.getByRole('heading', { name: 'DB 읽기 전용 항목 안내' })).toBeInTheDocument();
    expect(screen.getByText('계약 목업 항목의도 A')).toBeInTheDocument();
    expect(screen.getByText('계약 목업 작성방법 A')).toBeInTheDocument();
    expect(screen.getByText('계약 목업 지식 A')).toBeInTheDocument();
    expect(screen.getByText('계약 목업 기술 A')).toBeInTheDocument();
    expect(screen.getByText('계약 목업 태도 A')).toBeInTheDocument();
    expect(screen.getByText('계약 목업 자격증 A')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /항목의도/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /작성방법/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /필요역량/ })).not.toBeInTheDocument();
  });

  it('사례 keyword·master를 선택하고 DB 사례를 읽기 전용으로 보이며 STAR 옵션을 fixture 행에만 연다', async () => {
    const user = userEvent.setup();

    render(<SuccessExamplesWorkspacePage service={createInjectedService()} />);
    await advanceToExampleSelection(user);

    await user.click(screen.getByRole('radio', { name: /계약 목업 사례 키워드 A/ }));

    expect(screen.getByText('계약 목업 작성 단계 안내 A1')).toBeInTheDocument();
    expect(screen.getByText('계약 목업 사례 본문 A1')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /사례 본문/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: '사례 합쳐보기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'STAR 방식' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /계약 목업 STAR 사례 키워드 B/ }));

    expect(screen.getByText('계약 목업 STAR 작성 안내 B1')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '사례 합쳐보기' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'STAR 방식' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/^S$/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^T$/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^A$/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^R$/)).not.toBeInTheDocument();
  });

  it('cdSeq별 사용자 작성값과 레거시 식별자를 DTO로 저장한다', async () => {
    const user = userEvent.setup();
    const save = vi.fn((workspace) => workspace);
    const onSaved = vi.fn();

    render(
      <SuccessExamplesWorkspacePage
        onSaved={onSaved}
        service={createInjectedService({ save })}
      />,
    );
    await advanceToExampleSelection(user);
    await user.click(screen.getByRole('radio', { name: /계약 목업 사례 키워드 A/ }));
    await user.click(screen.getByRole('button', { name: '다음: 직접 작성' }));
    await user.type(
      screen.getByRole('textbox', { name: '사용자 작성 — 계약 목업 작성 단계 안내 A1' }),
      '첫 번째 단계 사용자 작성',
    );
    await user.type(
      screen.getByRole('textbox', { name: '사용자 작성 — 계약 목업 작성 단계 안내 A2' }),
      '두 번째 단계 사용자 작성',
    );
    await user.click(screen.getByRole('button', { name: '작성 내용 저장' }));

    const expectedWorkspace = {
      selectGroups: ['fixture-group-1'],
      selectMode: 'BASIC',
      itemCode: 'fixture-item-basic-1',
      masterCd: 'fixture-master-basic-1',
      details: [
        {
          cdSeq: 'fixture-detail-basic-1',
          contentText: '첫 번째 단계 사용자 작성',
          star1Text: '',
          star2Text: '',
          groupLookupCode: 'fixture-group-1',
        },
        {
          cdSeq: 'fixture-detail-basic-2',
          contentText: '두 번째 단계 사용자 작성',
          star1Text: '',
          star2Text: '',
          groupLookupCode: 'fixture-group-1',
        },
      ],
    };
    expect(save).toHaveBeenCalledWith(expectedWorkspace);
    expect(onSaved).toHaveBeenCalledWith(expectedWorkspace);
    expect(screen.getByRole('status')).toHaveTextContent('자소서 작성 내용이 저장되었습니다.');
  });
});
