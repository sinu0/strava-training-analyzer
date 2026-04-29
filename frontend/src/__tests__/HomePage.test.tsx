import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import HomePage from '../pages/HomePage';
import theme from '../theme/theme';

import type { AiActivityNote } from '../types/ai';
import type { Achievement } from '../types/analytics';

const generateAiNoteMutate = vi.fn();
let mockAiNote: AiActivityNote = {
  activityId: 'a1',
  summary: 'Mocny, ale kontrolowany trening z dobrym domknięciem końcówki.',
  detail: 'AI note detail',
  queueStatus: null,
};
let mockAchievements: Achievement[] = [];

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  localStorage.clear();
  mockAiNote = {
    activityId: 'a1',
    summary: 'Mocny, ale kontrolowany trening z dobrym domknięciem końcówki.',
    detail: 'AI note detail',
    queueStatus: null,
  };
  mockAchievements = [];
  generateAiNoteMutate.mockReset();
});

vi.mock('../hooks/useAnalytics', () => ({
  useReadiness: () => ({
    data: {
      score: 71,
      dayLabel: 'Kontrolowany akcent',
      dayFocus: 'Broń jakości bez dokładania chaosu.',
      bestQualityWindowLabel: 'Jutro rano',
      qualityWindowSummary: 'Najlepsze okno jakości pojawia się jutro rano.',
    },
  }),
  useBlockHealth: () => ({
    data: {
      status: 'STABLE_PRODUCTIVE',
      label: 'Blok stabilny',
      description: 'Tydzień dowozi główny bodziec bez chaosu.',
      nextFocus: 'Broń jednego jakościowego bodźca.',
      adjustmentDays: 1,
      missedStimulusDays: 0,
      overloadDays: 0,
      keySignals: ['Bodziec celu: 1/1'],
    },
  }),
  useProgressionLevels: () => ({
    data: [
      {
        system: 'THRESHOLD',
        label: 'Próg',
        level: 6,
        currentLoad: 82,
        previousLoad: 75,
        targetLoad: 88,
        trend: 'UP',
        description: 'Próg rośnie stabilnie.',
        nextRecommendation: 'Broń jednego akcentu progowego.',
      },
    ],
  }),
  useFtpProgress: () => ({
    data: {
      currentFtp: 271,
      trend: 'up',
      changePercent: 4.6,
      history: [
        { date: '2026-04-10', value: 258 },
        { date: '2026-04-25', value: 271 },
      ],
    },
  }),
  useWeatherLocations: () => ({
    data: [
      {
        id: 'w1',
        name: 'Kraków',
        latitude: 50.0614,
        longitude: 19.9366,
        active: true,
      },
    ],
  }),
  useWeatherGradient: () => ({
    data: {
      locationName: 'Kraków',
      current: {
        temperature: 18,
        windSpeed: 14,
        precipitation: 0,
        weatherCode: 1,
        weatherDescription: 'Słonecznie',
        outdoorScore: 84,
        warnings: [],
      },
      days: [],
    },
  }),
  useRecentActivities: () => ({
    data: [
      {
        id: 'a1',
        externalId: 'ext-1',
        sportType: 'Ride',
        name: 'Poranny trening progowy',
        startedAt: '2026-04-24T07:15:00Z',
        movingTimeSec: 5400,
        distanceM: 62400,
        elevationGainM: 720,
        avgHeartrate: 148,
        avgPowerW: 228,
        avgSpeedMs: 8.2,
        calories: 1320,
        summaryPolyline: 'gfo}EtohhUxD@bAxJmGF',
        photoUrls: [],
      },
      {
        id: 'a2',
        externalId: 'ext-2',
        sportType: 'Ride',
        name: 'Luźne rozjazdowe 60',
        startedAt: '2026-04-23T06:45:00Z',
        movingTimeSec: 3600,
        distanceM: 30200,
        elevationGainM: 180,
        avgHeartrate: 122,
        avgPowerW: 162,
        avgSpeedMs: 7.2,
        calories: 640,
        summaryPolyline: null,
        photoUrls: [],
      },
      {
        id: 'a3',
        externalId: 'ext-3',
        sportType: 'Ride',
        name: 'Długi tlen w sobotę',
        startedAt: '2026-04-20T08:30:00Z',
        movingTimeSec: 12600,
        distanceM: 101500,
        elevationGainM: 940,
        avgHeartrate: 136,
        avgPowerW: 198,
        avgSpeedMs: 8.0,
        calories: 2240,
        summaryPolyline: null,
        photoUrls: [],
      },
      {
        id: 'a4',
        externalId: 'ext-4',
        sportType: 'Ride',
        name: 'Krótki opener',
        startedAt: '2026-04-19T09:10:00Z',
        movingTimeSec: 2400,
        distanceM: 18500,
        elevationGainM: 110,
        avgHeartrate: 118,
        avgPowerW: 155,
        avgSpeedMs: 7.7,
        calories: 360,
        summaryPolyline: null,
        photoUrls: [],
      },
    ],
  }),
}));

vi.mock('../hooks/useGamification', () => ({
  useAchievements: () => ({
    data: mockAchievements,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useAi', () => ({
  useAiNote: () => ({
    data: mockAiNote,
    isLoading: false,
  }),
  useGenerateAiNote: () => ({
    mutate: generateAiNoteMutate,
    isPending: false,
  }),
  useRefreshAiNote: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../components/ActivityMediaCarousel', () => ({
  default: ({ activityName }: { activityName: string }) => <div>Media: {activityName}</div>,
}));

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('HomePage', () => {
  it('renders activity-first hero with separated previous-activity story cards and compact side widgets', () => {
    renderPage();

    expect(screen.getByText('Ostatni trening')).toBeDefined();
    expect(screen.getByText('Poranny trening progowy')).toBeDefined();
    expect(screen.getByText('Media: Poranny trening progowy')).toBeDefined();
    expect(screen.getByText('Mocny, ale kontrolowany trening z dobrym domknięciem końcówki.')).toBeDefined();
    expect(screen.getByText('Ostatnie aktywności')).toBeDefined();
    expect(screen.getByTestId('recent-activity-stories')).toBeDefined();
    expect(screen.getByText('Luźne rozjazdowe 60')).toBeDefined();
    expect(screen.getByText('Długi tlen w sobotę')).toBeDefined();
    expect(screen.getByText('Media: Luźne rozjazdowe 60')).toBeDefined();
    expect(screen.getByText('Media: Długi tlen w sobotę')).toBeDefined();
    expect(screen.getAllByText('Poprzedni trening').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Szybki opis AI').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pokaż pełną aktywność').length).toBeGreaterThan(1);
    expect(screen.getByText('Pogoda')).toBeDefined();
    expect(screen.getByText('Gotowość')).toBeDefined();
    expect(screen.getByText('Blok')).toBeDefined();
    expect(screen.getByText('Postęp')).toBeDefined();
    expect(screen.getByText('Kraków')).toBeDefined();
    expect(screen.getByTestId('home-widget-art-pogoda')).toBeDefined();
    expect(screen.getByTestId('home-widget-art-readiness')).toBeDefined();
    expect(screen.getByTestId('home-widget-art-blok')).toBeDefined();
    expect(screen.getByTestId('home-widget-art-progres')).toBeDefined();
  });

  it('shows AI generating state when note is queued in background', () => {
    mockAiNote = {
      activityId: 'a1',
      queueStatus: 'processing',
    };

    renderPage();

    expect(screen.getByText('Notka AI generuje się w tle.')).toBeDefined();
    expect(screen.getAllByText('Pokaż pełną aktywność').length).toBeGreaterThan(0);
  });

  it('shows generic fallback summary and allows generating a better AI description', () => {
    mockAiNote = {
      activityId: 'a1',
      queueStatus: null,
    };

    renderPage();

    expect(
      screen.getByText('62.4 km w 1h 30m · Śr. moc 228 W · tętno 148 bpm · przewyższenie 720 m'),
    ).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Wygeneruj lepszy opis AI' }));

    expect(generateAiNoteMutate).toHaveBeenCalledWith('a1');
  });

  it('shows a fullscreen carousel when new milestones appear after previous sync state', () => {
    localStorage.setItem(
      'home-celebrations-v1',
      JSON.stringify({
        initialized: true,
        lastActivityId: 'older-activity',
        highestSeenFtp: 255,
        unlockedAchievements: {},
        progressionLevels: { THRESHOLD: 5 },
      }),
    );
    mockAchievements = [
      {
        id: 'ftp-250',
        name: 'FTP 250 W',
        description: 'Osiągnij FTP na poziomie 250 W.',
        icon: '⚡',
        type: 'FTP',
        unlocked: true,
        unlockedAt: '2026-04-27',
      },
    ];

    renderPage();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(within(dialog).getByText('Nowy import')).toBeDefined();
    expect(within(dialog).getByText('Poranny trening progowy')).toBeDefined();
    expect(within(dialog).getAllByRole('button', { name: 'Dalej' }).length).toBeGreaterThan(0);
  });
});
