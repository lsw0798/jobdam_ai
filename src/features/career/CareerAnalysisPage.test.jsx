import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CareerAnalysisPage } from './CareerAnalysisPage';

describe('CareerAnalysisPage', () => {
  it('uses the supplied Korean copy and the requested ChatGPT link', () => {
    render(<CareerAnalysisPage />);

    expect(screen.getByRole('heading', { name: '진로·직무결정 고민 한번에 해결' })).toBeInTheDocument();
    expect(screen.getByText(/5~7분 소요/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AI로 나의 진로 결정하기' })).toHaveAttribute(
      'href',
      'https://chatgpt.com/g/g-69726feb34888191863db9e65f238c80-jagibunseog-prediger-v6-0-jinro-cwieob',
    );
  });
});
