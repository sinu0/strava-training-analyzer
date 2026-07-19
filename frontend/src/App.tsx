import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import LoadingState from '@/components/common/LoadingState';
import AppLayout from '@/components/layout/AppLayout';

const TodayPage = lazy(() => import('@/features/today/TodayPage'));
const MorePage = lazy(() => import('@/features/more/MorePage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const ActivitiesPage = lazy(() => import('@/features/history/HistoryPage'));
const ActivityDetailPage = lazy(() => import('@/features/history/ActivityDetailV2Page'));
const AnalyticsPage = lazy(() => import('@/features/analysis/AnalysisPage'));
const TrainingPlanPage = lazy(() => import('@/features/plan/PlanPage'));
const HealthPage = lazy(() => import('@/pages/HealthPage'));
const WeightPage = lazy(() => import('@/pages/WeightPage'));
const WeatherPage = lazy(() => import('@/pages/WeatherPage'));
const DataJobsPage = lazy(() => import('@/features/data/DataJobsPage'));
const RoutePlannerPage = lazy(() => import('@/pages/RoutePlannerPage'));
const SettingsPage = lazy(() => import('@/pages/AdminPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

type LazyPageComponent = LazyExoticComponent<ComponentType>;

function renderLazyPage(Page: LazyPageComponent) {
  return (
    <Suspense fallback={<LoadingState message="Ładowanie strony…" />}>
      <Page />
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={renderLazyPage(TodayPage)} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/profile" element={renderLazyPage(ProfilePage)} />
        <Route path="/activities" element={renderLazyPage(ActivitiesPage)} />
        <Route path="/activities/:id" element={renderLazyPage(ActivityDetailPage)} />
        <Route path="/analytics" element={renderLazyPage(AnalyticsPage)} />
        <Route path="/training" element={renderLazyPage(TrainingPlanPage)} />
        <Route path="/health" element={renderLazyPage(HealthPage)} />
        <Route path="/weather" element={renderLazyPage(WeatherPage)} />
        <Route path="/more" element={renderLazyPage(MorePage)} />
        <Route path="/routes" element={renderLazyPage(RoutePlannerPage)} />
        <Route path="/route-planner" element={<Navigate to="/routes" replace />} />
        <Route path="/weight" element={renderLazyPage(WeightPage)} />
        <Route path="/priorities" element={<Navigate to="/analytics" replace />} />
        <Route path="/coach" element={<Navigate to="/" replace />} />
        <Route path="/timeline" element={<Navigate to="/activities" replace />} />
        <Route path="/performance" element={<Navigate to="/analytics" replace />} />
        <Route path="/adaptive-coach" element={<Navigate to="/" replace />} />
        <Route path="/ai-v2" element={<Navigate to="/" replace />} />
        <Route path="/ai-predictions" element={<Navigate to="/" replace />} />
        <Route path="/data" element={renderLazyPage(DataJobsPage)} />
        <Route path="/settings" element={renderLazyPage(SettingsPage)} />
        <Route path="/admin" element={<Navigate to="/data" replace />} />
        <Route path="*" element={renderLazyPage(NotFoundPage)} />
      </Route>
    </Routes>
  );
}
