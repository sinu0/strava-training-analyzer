import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LoadingState from '../components/common/LoadingState';
import SkeletonCard from '../components/common/SkeletonCard';
import theme from '../theme/theme';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('LoadingState', () => {
  it('renders default loading message with a spinner', () => {
    renderWithTheme(<LoadingState />);

    expect(screen.getByText('Ładowanie...')).toBeDefined();
    expect(screen.getByRole('progressbar')).toBeDefined();
  });

  it('renders custom message', () => {
    renderWithTheme(<LoadingState message="Pobieranie danych" />);

    expect(screen.getByText('Pobieranie danych')).toBeDefined();
  });
});

describe('SkeletonCard', () => {
  it('renders title and body skeleton placeholders', () => {
    const { container } = renderWithTheme(<SkeletonCard lines={2} />);

    // 1 title + 1 rounded block + 2 text lines
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBe(4);
  });

  it('omits the title placeholder when title is false', () => {
    const { container } = renderWithTheme(<SkeletonCard title={false} lines={2} />);

    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBe(3);
  });
});
