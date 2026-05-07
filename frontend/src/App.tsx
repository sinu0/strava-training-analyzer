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
const WeatherPage = lazy(() => import('@/pages/WeatherPage'));
const RoutePlannerPage = lazy(() => import('@/pages/RoutePlannerPage'));
const WeightPage = lazy(() => import('@/pages/WeightPage'));
const AiPredictionPage = lazy(() => import('@/pages/AiPredictionPage'));
const PrioritiesPage = lazy(() => import('@/pages/PrioritiesPage'));
const AdaptiveCoachPage = lazy(() => import('@/pages/AdaptiveCoachPage'));
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
        <Route path="/route-planner" element={renderLazyPage(RoutePlannerPage)} />
        <Route path="/weight" element={renderLazyPage(WeightPage)} />
        <Route path="/ai-predictions" element={renderLazyPage(AiPredictionPage)} />
        <Route path="/priorities" element={renderLazyPage(PrioritiesPage)} />
        <Route path="/performance" element={<Navigate to="/analytics" replace />} />
        <Route path="/adaptive-coach" element={renderLazyPage(AdaptiveCoachPage)} />
        <Route path="/admin" element={renderLazyPage(AdminPage)} />
        <Route path="*" element={renderLazyPage(NotFoundPage)} />
      </Route>
    </Routes>
  );
}
