import { Box, Typography } from '@mui/material';
import { useReducer, type MouseEvent } from 'react';


import WeatherForecastViews from '@/components/weather/WeatherForecastViews';
import WeatherLocationMenu from '@/components/weather/WeatherLocationMenu';
import WeatherWidgetHeader from '@/components/weather/WeatherWidgetHeader';
import { getCyclistType } from '@/components/weather/weatherWidgetUtils';
import type { WeatherGradient, WeatherLocation } from '@/types/analytics';

interface WeatherWidgetProps {
  gradient: WeatherGradient | undefined;
  locations: WeatherLocation[] | undefined;
  onActivateLocation: (name: string) => void;
  onAddLocation: (name: string, lat: number, lon: number) => void;
  onDeleteLocation: (name: string) => void;
  onRefresh: (location: string) => void;
}

interface WeatherWidgetState {
  view: 'today' | 'week';
  anchorEl: HTMLElement | null;
}

type WeatherWidgetAction =
  | { type: 'set-view'; view: WeatherWidgetState['view'] }
  | { type: 'open-settings'; anchorEl: HTMLElement }
  | { type: 'close-settings' };

const initialWeatherWidgetState: WeatherWidgetState = {
  view: 'today',
  anchorEl: null,
};

function weatherWidgetReducer(
  state: WeatherWidgetState,
  action: WeatherWidgetAction,
): WeatherWidgetState {
  switch (action.type) {
    case 'set-view':
      return { ...state, view: action.view };
    case 'open-settings':
      return { ...state, anchorEl: action.anchorEl };
    case 'close-settings':
      return { ...state, anchorEl: null };
    default:
      return state;
  }
}

export default function WeatherWidget({
  gradient,
  locations,
  onActivateLocation,
  onAddLocation,
  onDeleteLocation,
  onRefresh,
}: WeatherWidgetProps) {
  const [state, dispatch] = useReducer(
    weatherWidgetReducer,
    initialWeatherWidgetState,
  );

  if (!gradient) {
    return (
      <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        Ładowanie pogody...
      </Typography>
    );
  }

  const current = gradient.current;
  const activeLocationName = locations?.find((location) => location.active)?.name ?? gradient.locationName;
  const cyclistType = getCyclistType(current.weatherCode, current.windSpeed, current.temperature);

  return (
    <Box>
      <WeatherWidgetHeader
        locationName={gradient.locationName}
        weatherDescription={current.weatherDescription}
        temperature={current.temperature}
        weatherCode={current.weatherCode}
        windSpeed={current.windSpeed}
        precipitation={current.precipitation}
        outdoorScore={current.outdoorScore}
        cyclistType={cyclistType}
        onOpenSettings={(event: MouseEvent<HTMLButtonElement>) => {
          dispatch({ type: 'open-settings', anchorEl: event.currentTarget });
        }}
      />

      <WeatherForecastViews
        gradient={gradient}
        view={state.view}
        onViewChange={(view) => dispatch({ type: 'set-view', view })}
      />

      <WeatherLocationMenu
        anchorEl={state.anchorEl}
        open={Boolean(state.anchorEl)}
        locations={locations}
        activeLocationName={activeLocationName}
        onClose={() => dispatch({ type: 'close-settings' })}
        onActivateLocation={onActivateLocation}
        onAddLocation={onAddLocation}
        onDeleteLocation={onDeleteLocation}
        onRefresh={onRefresh}
      />
    </Box>
  );
}
