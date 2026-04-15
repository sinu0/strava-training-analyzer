import AcUnitIcon from '@mui/icons-material/AcUnit';
import CloudIcon from '@mui/icons-material/Cloud';
import GrainIcon from '@mui/icons-material/Grain';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

import { getWeatherIconConfig } from '@/constants/weatherIcons';

interface WeatherConditionIconProps {
  code: number;
  size?: number;
}

export default function WeatherConditionIcon({
  code,
  size = 20,
}: WeatherConditionIconProps) {
  const { kind, color } = getWeatherIconConfig(code);
  const sx = { fontSize: size, color };

  switch (kind) {
    case 'sunny':
      return <WbSunnyIcon sx={sx} />;
    case 'rain':
      return <GrainIcon sx={sx} />;
    case 'snow':
      return <AcUnitIcon sx={sx} />;
    case 'storm':
      return <ThunderstormIcon sx={sx} />;
    case 'cloud':
    default:
      return <CloudIcon sx={sx} />;
  }
}
