import BoltIcon from '@mui/icons-material/Bolt';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createAppTheme, getThemeTokens, type AppColorMode } from '@/theme/theme';
import {
  ChartFrame, DotMatrixChart, DotMatrixRow, HeroCard, LegendStat, Metric, PageHeader, ProgressTrack,
  RoundAction, Sparkline, StatRow, StatusPill, Surface, Widget, WidgetGrid, WidgetCell,
} from '@/ui';

function renderIn(mode: AppColorMode, ui: React.ReactElement) {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>);
}

describe.each<AppColorMode>(['light', 'dark'])('@/ui in %s mode', (mode) => {
  it('Widget renders header, icon bubble and body as a named section', () => {
    renderIn(mode, (
      <Widget title="Obciążenie" subtitle="7/42 dni" icon={<BoltIcon />} action={<StatusPill label="87%" tone="primary" variant="solid" dot />}>
        <Metric label="CTL" value="31.6" />
      </Widget>
    ));
    expect(screen.getByRole('heading', { level: 2, name: 'Obciążenie' })).toBeInTheDocument();
    expect(screen.getByText('7/42 dni')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('31.6')).toBeInTheDocument();
  });

  it('Metric shows value, unit and label in every variant', () => {
    renderIn(mode, (
      <>
        <Metric variant="hero" label="Spalone" value="2.780" unit="kcal" />
        <Metric variant="stat" label="Dystans" value="57.5" unit="km" />
        <Metric variant="readout" label="Tętno" value="142" unit="bpm" tone="error" />
      </>
    ));
    expect(screen.getByText('2.780')).toBeInTheDocument();
    expect(screen.getByText('kcal')).toBeInTheDocument();
    expect(screen.getByText('Dystans')).toBeInTheDocument();
    expect(screen.getByText('142')).toHaveStyle({ color: getThemeTokens(mode).action.error });
  });

  it('ProgressTrack exposes an accessible progress value and clamps it', () => {
    renderIn(mode, <ProgressTrack value={140} ariaLabel="Postęp kroku" label="Krok" valueLabel="14:49" />);
    const bar = screen.getByRole('progressbar', { name: 'Postęp kroku' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('14:49')).toBeInTheDocument();
  });

  it('ProgressTrack marker mode is an image with a scale', () => {
    renderIn(mode, <ProgressTrack mode="marker" value={40} ariaLabel="Forma -6" scale={['Zmęczenie', 'Świeżość']} />);
    expect(screen.getByRole('img', { name: 'Forma -6' })).toBeInTheDocument();
    expect(screen.getByText('Świeżość')).toBeInTheDocument();
  });

  it('DotMatrix row fills dots proportionally and chart is described for assistive tech', () => {
    const { container } = renderIn(mode, <DotMatrixRow label="CTL" valueLabel="31.6" filled={9} total={12} color="#16A6C8" />);
    expect(container.querySelectorAll('[class*="MuiBox-root"]').length).toBeGreaterThan(12);
    renderIn(mode, (
      <DotMatrixChart
        ariaLabel="Obciążenie godzinowe"
        color="#16A6C8"
        columns={[{ id: 'a', value: 1 }, { id: 'b', value: 4 }, { id: 'c', value: 2 }]}
        axis={['00:00', '12:00', '21:00']}
      />
    ));
    expect(screen.getByRole('img', { name: 'Obciążenie godzinowe' })).toBeInTheDocument();
    expect(screen.getByText('21:00')).toBeInTheDocument();
  });

  it('Sparkline renders an svg path for two or more points', () => {
    const { container } = renderIn(mode, <Sparkline values={[1, 3, 2, 5]} ariaLabel="Trend mocy" />);
    expect(screen.getByRole('img', { name: 'Trend mocy' })).toBeInTheDocument();
    expect(container.querySelector('path')?.getAttribute('d')).toMatch(/^M/);
  });

  it('HeroCard overlays title, glass figures and a round action', () => {
    const onClick = vi.fn();
    renderIn(mode, (
      <HeroCard
        image={{ src: '/hero.webp', alt: 'Kolarz' }}
        eyebrow="Rekomendacja dnia"
        title="Threshold"
        caption="Dzisiaj"
        stat={{ label: 'Czas sesji', value: '90', unit: 'min' }}
        metrics={[{ id: 'tss', label: 'Cel', value: '84 TSS' }]}
        action={{ label: 'Otwórz plan', onClick }}
      />
    ));
    expect(screen.getByRole('heading', { name: 'Threshold' })).toBeInTheDocument();
    expect(screen.getByText('Rekomendacja dnia')).toBeInTheDocument();
    expect(screen.getByText('84 TSS')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Otwórz plan' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('ChartFrame switches between loading, error, empty and content', () => {
    const { rerender } = renderIn(mode, <ChartFrame title="Moc" loading>chart</ChartFrame>);
    expect(screen.getByText('Ładowanie wykresu…')).toBeInTheDocument();
    rerender(<ThemeProvider theme={createAppTheme(mode)}><ChartFrame title="Moc" error="Błąd API">chart</ChartFrame></ThemeProvider>);
    expect(screen.getByText('Błąd API')).toBeInTheDocument();
    rerender(<ThemeProvider theme={createAppTheme(mode)}><ChartFrame title="Moc" empty emptyTitle="Brak mocy">chart</ChartFrame></ThemeProvider>);
    expect(screen.getByText('Brak mocy')).toBeInTheDocument();
    rerender(<ThemeProvider theme={createAppTheme(mode)}><ChartFrame title="Moc">chart</ChartFrame></ThemeProvider>);
    expect(screen.getByText('chart')).toBeInTheDocument();
  });

  it('page, grid, stat row, legend, pill and round action compose without errors', () => {
    renderIn(mode, (
      <Surface variant="muted">
        <PageHeader title="Dzisiaj" description="Rekomendacja dnia" meta={<StatusPill label="Dane aktualne" tone="success" variant="outline" />} />
        <WidgetGrid>
          <WidgetCell span={8}><LegendStat label="Jazda" value="386" unit="kcal" color="#FC4C02" /></WidgetCell>
          <WidgetCell span={4}><StatRow items={[{ id: 'km', icon: <BoltIcon />, value: '63.71', unit: 'km' }]} /></WidgetCell>
        </WidgetGrid>
        <RoundAction aria-label="Start" variant="accent" />
      </Surface>
    ));
    expect(screen.getByRole('heading', { level: 1, name: 'Dzisiaj' })).toBeInTheDocument();
    expect(screen.getByText('63.71')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
  });
});

it('ui components tolerate MUI base theme without app tokens', () => {
  render(<Widget title="Bez tokenów"><ProgressTrack value={50} ariaLabel="p" /></Widget>);
  expect(screen.getByText('Bez tokenów')).toBeInTheDocument();
});
