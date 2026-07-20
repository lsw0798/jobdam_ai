import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SpeechPage } from './SpeechPage';

describe('SpeechPage', () => {
  it('explains the speech tool and links to the supplied service', () => {
    render(<SpeechPage />);

    expect(screen.getByRole('heading', { name: 'AI로 1분 스피치 만들기' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AI로 1분 스피치 만들기 시작' })).toHaveAttribute(
      'href',
      'https://m.site.naver.com/22Zv1',
    );
  });
});
