import WeatherJobSection from '@/components/admin/WeatherJobSection';
import {
  useRefreshAllWeatherCache,
  useRefreshWeatherCache,
  useWeatherJobStatus,
  useWeatherLocations,
} from '@/hooks/useAnalytics';

export default function WeatherTab() {
  const { data: weatherJobStatus } = useWeatherJobStatus();
  const { data: weatherLocations } = useWeatherLocations();
  const refreshWeather = useRefreshWeatherCache();
  const refreshAllWeather = useRefreshAllWeatherCache();

  return (
    <WeatherJobSection
      weatherJobStatus={weatherJobStatus}
      weatherLocations={weatherLocations}
      refreshWeatherPending={refreshWeather.isPending}
      refreshAllWeatherPending={refreshAllWeather.isPending}
      onRefreshWeather={(name) => refreshWeather.mutate(name)}
      onRefreshAllWeather={() => refreshAllWeather.mutate()}
    />
  );
}
