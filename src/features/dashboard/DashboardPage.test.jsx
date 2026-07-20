import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DashboardPage } from './DashboardPage';

const progress = {
  experience: { completed: true },
  resume: { completed: false },
};

describe('DashboardPage', () => {
  it('separates used features from untouched input features', () => {
    render(
      <MemoryRouter>
        <DashboardPage progress={progress} />
      </MemoryRouter>,
    );

    const used = screen.getByRole('region', { name: '사용한 기능' });
    const unused = screen.getByRole('region', { name: '아직 활용하지 못한 기능' });

    expect(used).toHaveTextContent('경험 리스트 작성');
    expect(unused).toHaveTextContent('이력서 작성하기');
  });
});
