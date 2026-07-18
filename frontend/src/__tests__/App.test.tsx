import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.clearAllMocks();
});

function mockAppLayout() {
  vi.doMock('../components/layout/AppLayout', async () => {
    const { Outlet } = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

    return {
      default: function MockAppLayout() {
        return (
          <div data-testid="app-layout">
            <Outlet />
          </div>
        );
      },
    };
  });
}

function mockStaticPages(importedPages: string[] = [], options?: { skipToday?: boolean }) {
  if (!options?.skipToday) {
    vi.doMock('../features/today/TodayPage', () => {
      importedPages.push('today');
      return { default: () => <div>Today page</div> };
    });
  }
  vi.doMock('../pages/ProfilePage', () => {
    importedPages.push('profile');
    return { default: () => <div>Profile page</div> };
  });
  vi.doMock('../features/history/HistoryPage', () => {
    importedPages.push('activities');
    return { default: () => <div>Activities page</div> };
  });
  vi.doMock('../features/history/ActivityDetailV2Page', () => {
    importedPages.push('activity-detail');
    return { default: () => <div>Activity detail page</div> };
  });
  vi.doMock('../features/analysis/AnalysisPage', () => {
    importedPages.push('analytics');
    return { default: () => <div>Analytics page</div> };
  });
  vi.doMock('../features/plan/PlanPage', () => {
    importedPages.push('training');
    return { default: () => <div>Training page</div> };
  });
  vi.doMock('../pages/HealthPage', () => {
    importedPages.push('health');
    return { default: () => <div>Health page</div> };
  });
  vi.doMock('../pages/RoutePlannerPage', () => {
    importedPages.push('route-planner');
    return { default: () => <div>Route planner page</div> };
  });
  vi.doMock('../pages/WeightPage', () => {
    importedPages.push('weight');
    return { default: () => <div>Weight page</div> };
  });
  vi.doMock('../features/data/DataJobsPage', () => {
    importedPages.push('admin');
    return { default: () => <div>Admin page</div> };
  });
}

async function renderApp(initialEntry = '/') {
  const { default: App } = await import('@/App');

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('loads only the matched page module on the initial route', async () => {
    const importedPages: string[] = [];

    mockAppLayout();
    mockStaticPages(importedPages);

    await renderApp('/');
    expect((await screen.findAllByText('Today page')).length).toBeGreaterThan(0);

    expect(importedPages).toContain('today');
    expect(importedPages).not.toContain('activities');
    expect(importedPages).not.toContain('analytics');
  }, 15_000);

  it('shows a page-level suspense fallback when a route suspends', async () => {
    mockAppLayout();
    vi.doMock('../features/today/TodayPage', () => ({
      default: function SuspendedTodayPage() {
        throw new Promise(() => {});
      },
    }));
    mockStaticPages([], { skipToday: true });

    await renderApp('/');

    expect((await screen.findAllByText('Ładowanie strony…')).length).toBeGreaterThan(0);
  });

  it('redirects legacy dashboard route to Today', async () => {
    const importedPages: string[] = [];

    mockAppLayout();
    mockStaticPages(importedPages);

    await renderApp('/dashboard');
    expect((await screen.findAllByText('Today page')).length).toBeGreaterThan(0);

    expect(importedPages).toContain('today');
    expect(importedPages).not.toContain('activities');
  });

});
