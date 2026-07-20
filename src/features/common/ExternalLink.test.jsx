import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExternalLink } from './ExternalLink';

describe('ExternalLink', () => {
  it('opens external services safely in a new tab', () => {
    render(<ExternalLink href="https://example.com">외부 도구 열기</ExternalLink>);

    const link = screen.getByRole('link', { name: '외부 도구 열기' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });
});
