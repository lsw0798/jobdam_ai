import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ExperiencePage } from './ExperiencePage';

describe('ExperiencePage', () => {
  it('경험 리스트 안내와 작성 페이지 링크를 보여준다', () => {
    render(
      <MemoryRouter>
        <ExperiencePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '취업 성공자의 필수 코스 경험리스트' })).toBeInTheDocument();
    expect(
      screen.getByText(/경험 리스트는 저학년부터 고학년까지 모든 경험과 경험에서 얻은 지식/),
    ).toBeInTheDocument();
    expect(screen.getByText('취업 상담 시 경험리스트 분석을 통한 취업 전략 수립')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('link', { name: '경험 리스트 작성하기' })).toHaveAttribute(
      'href',
      '/experience/write',
    );
  });
});
