import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CoverLetterHubPage } from './CoverLetterHubPage';

describe('CoverLetterHubPage legacy intro', () => {
  it('임의 6분류와 외부 링크 대신 새 작성·지난 작성내용 두 진입만 제공한다', () => {
    render(
      <MemoryRouter>
        <CoverLetterHubPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'AI 기업·직무 맞춤 자소서' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '새로 작성하기' })).toHaveAttribute(
      'href',
      '/cover-letters/library',
    );
    expect(screen.getByRole('link', { name: '지난 작성내용 불러오기' })).toHaveAttribute(
      'href',
      '/cover-letters/library?view=history',
    );
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByText('회사 지원동기')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '직무 지원동기' })).not.toBeInTheDocument();
    expect(document.querySelector('a[href*="naver"]')).toBeNull();
  });
});
