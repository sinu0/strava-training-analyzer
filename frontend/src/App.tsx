import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import LoadingState from '@/components/common/LoadingState';
import AppLayout from '@/components/layout/AppLayout';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const ActivitiesPage = lazy(() => import('@/pages/ActivitiesPage'));
const ActivityDetailPage = lazy(() => import('@/pages/ActivityDetailPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const TrainingPlanPage = lazy(() => import('@/pages/TrainingPlanPage'));
const HealthPage = lazy(() => import('@/pages/HealthPage'));
const WeightPage = lazy(() => import('@/pages/WeightPage'));
const WeatherPage = lazy(() => import('@/pages/WeatherPage'));
const PrioritiesPage = lazy(() => import('@/pages/PrioritiesPage'));
const CoachPage = lazy(() => import('@/pages/CoachPage'));
const TrainingTimelinePage = lazy(() => import('@/pages/TrainingTimelinePage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
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
        <Route path="/" element={renderLazyPage(DashboardPage)} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/profile" element={renderLazyPage(ProfilePage)} />
        <Route path="/activities" element={renderLazyPage(ActivitiesPage)} />
        <Route path="/activities/:id" element={renderLazyPage(ActivityDetailPage)} />
        <Route path="/analytics" element={renderLazyPage(AnalyticsPage)} />
        <Route path="/training" element={renderLazyPage(TrainingPlanPage)} />
        <Route path="/health" element={renderLazyPage(HealthPage)} />
        <Route path="/weather" element={renderLazyPage(WeatherPage)} />
        <Route path="/route-planner" element={<Navigate to="/" replace />} />
        <Route path="/weight" element={renderLazyPage(WeightPage)} />
        <Route path="/priorities" element={renderLazyPage(PrioritiesPage)} />
        <Route path="/coach" element={renderLazyPage(CoachPage)} />
        <Route path="/timeline" element={renderLazyPage(TrainingTimelinePage)} />
        <Route path="/performance" element={<Navigate to="/coach" replace />} />
        <Route path="/adaptive-coach" element={<Navigate to="/coach" replace />} />
        <Route path="/ai-v2" element={<Navigate to="/coach" replace />} />
        <Route path="/ai-predictions" element={<Navigate to="/coach" replace />} />
        <Route path="/admin" element={renderLazyPage(AdminPage)} />
        <Route path="*" element={renderLazyPage(NotFoundPage)} />
      </Route>
    </Routes>
  );
}
