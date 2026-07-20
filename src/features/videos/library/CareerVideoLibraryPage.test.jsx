import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CareerVideoLibraryPage } from './CareerVideoLibraryPage';

const siteCategoryLabels = [
  '취업정보제공 사이트',
  '분야(직무)별 취업정보 사이트',
  '여성 특화 취업정보제공 사이트',
  '기업정보(분석)제공 사이트',
  '진로(직무,직업)정보 찾기 사이트',
  '외국어 & 자격증 정보제공 사이트',
  '자격증 및 교육정보 제공 사이트',
  '자기계발(진로설정) 정보 사이트',
  '공사(공기업) 수험정보 및 채용정보제공 사이트',
  '창업관련 정보제공 사이트',
  '공모전 정보제공 사이트',
  '각종 아르바이트 및 채용포털 사이트',
];

describe('CareerVideoLibraryPage', () => {
  it('세 콘텐츠 유형을 탭으로 구분하고 모든취업사이트 103개를 안전하게 제공한다', () => {
    render(<CareerVideoLibraryPage />);

    expect(screen.getByRole('heading', { name: '모든 취업 진로 정보가 여기에', level: 1 })).toBeInTheDocument();
    const tabs = within(screen.getByRole('tablist', { name: '취업·진로 콘텐츠 유형' }));
    expect(tabs.getByRole('tab', { name: '모든취업사이트' })).toHaveAttribute('aria-selected', 'true');
    expect(tabs.getByRole('tab', { name: '진로취업동영상' })).toHaveAttribute('aria-selected', 'false');
    expect(tabs.getByRole('tab', { name: '인사전문가 강의' })).toHaveAttribute('aria-selected', 'false');

    const panel = screen.getByRole('tabpanel', { name: '모든취업사이트' });
    expect(panel).not.toHaveTextContent(/레거시|static-legacy|jobData/i);
    siteCategoryLabels.forEach((label) => {
      expect(within(panel).getByRole('heading', { name: label })).toBeInTheDocument();
      expect(within(panel).getByRole('link', { name: `${label} 바로가기` })).toHaveAttribute('href', expect.stringMatching(/^#sites-\d{2}$/));
    });

    const externalLinks = within(panel).getAllByRole('link', { name: /새 창에서 열기$/ });
    expect(externalLinks).toHaveLength(103);
    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
      expect(link).not.toHaveAttribute('href', expect.stringContaining('example.com'));
    });
  });

  it('동영상 미제공 상태를 고객용 문구와 분류·검색 UI로 표시한다', async () => {
    const user = userEvent.setup();
    render(<CareerVideoLibraryPage />);

    await user.click(screen.getByRole('tab', { name: '진로취업동영상' }));

    const panel = screen.getByRole('tabpanel', { name: '진로취업동영상' });
    expect(within(panel).getByRole('heading', { name: '진로취업동영상' })).toBeInTheDocument();
    expect(await within(panel).findByText('현재 동영상 목록을 불러올 수 없습니다.')).toBeInTheDocument();
    expect(panel).not.toHaveTextContent(/DB|bbs_press|계약/i);
    expect(within(panel).getByRole('searchbox', { name: '동영상 검색' })).toBeInTheDocument();
    ['전체', '진로', '취업', '인적성/NCS', '기업분석', '간호분야'].forEach((label) => {
      expect(within(panel).getByRole('button', { name: label })).toBeInTheDocument();
    });
    expect(within(panel).queryByRole('article')).not.toBeInTheDocument();
  });

  it('7개 분류의 실제 YouTube 강의 22개를 안전한 링크로 제공한다', async () => {
    const user = userEvent.setup();
    render(<CareerVideoLibraryPage />);

    await user.click(screen.getByRole('tab', { name: '인사전문가 강의' }));

    const panel = screen.getByRole('tabpanel', { name: '인사전문가 강의' });
    expect(panel).not.toHaveTextContent(/레거시|static-legacy|ndesign_section2/i);
    expect(within(panel).getByText('7개 분류 · 실제 YouTube 강의 22개')).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: '기업분석 완전정복' })).toBeInTheDocument();
    const lectureLinks = within(panel).getAllByRole('link', { name: /새 창에서 열기$/ });
    expect(lectureLinks).toHaveLength(22);
    lectureLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', expect.stringMatching(/^https:\/\/youtu\.be\//));
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    });
  });
});
