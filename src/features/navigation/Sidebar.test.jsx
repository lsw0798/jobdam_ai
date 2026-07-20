import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PAGE_DESCRIPTIONS } from '../../routing/pageDescriptions';
import { Sidebar } from './Sidebar';

const progress = {
  experience: { completed: true },
  resume: { completed: false },
};

describe('Sidebar', () => {
  it('shows an accessible explanation and explicit completion status for an input feature', () => {
    render(
      <MemoryRouter>
        <Sidebar progress={progress} />
      </MemoryRouter>,
    );

    const experience = screen.getByRole('link', { name: /경험 리스트 작성/ });
    fireEvent.focus(experience);

    expect(screen.getByRole('tooltip')).toHaveTextContent(PAGE_DESCRIPTIONS.experience);
    expect(screen.getByText('입력 완료')).toBeInTheDocument();
    expect(screen.getAllByText('미작성')).not.toHaveLength(0);
  });

  it('uses the corresponding page description for a menu tooltip', () => {
    render(
      <MemoryRouter>
        <Sidebar progress={progress} />
      </MemoryRouter>,
    );

    const careerInformation = screen.getByRole('link', { name: '모든 취업 진로 정보가 여기에' });
    fireEvent.focus(careerInformation);

    expect(screen.getByRole('tooltip')).toHaveTextContent(PAGE_DESCRIPTIONS.careerInformation);
  });

  it('adds career decision between experience and analysis and hides an empty description tooltip', () => {
    render(
      <MemoryRouter>
        <Sidebar progress={progress} />
      </MemoryRouter>,
    );

    const links = screen.getAllByRole('link');
    const experienceIndex = links.findIndex((link) => link.textContent.includes('경험 리스트 작성'));
    const decisionIndex = links.findIndex((link) => link.textContent.includes('AI로 나의 진로 결정하기'));
    const analysisIndex = links.findIndex((link) => link.textContent.includes('AI로 직무·산업·기업 분석하기'));

    expect(decisionIndex).toBe(experienceIndex + 1);
    expect(analysisIndex).toBe(decisionIndex + 1);

    fireEvent.focus(links[analysisIndex]);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
