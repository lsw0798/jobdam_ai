import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRouter } from './AppRouter';

describe('AppRouter', () => {
  it('redirects an unknown protected route to the dashboard', () => {
    render(<AppRouter authenticated initialPath="/not-a-page" />);

    expect(screen.getByRole('heading', { name: '대시보드' })).toBeInTheDocument();
  });
});
