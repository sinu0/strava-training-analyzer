import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';

import TabsNav from '@/components/common/TabsNav';

interface ActivityTabsProps {
  value: number;
  onChange: (newValue: number) => void;
  hasLaps: boolean;
}

export default function ActivityTabs({ value, onChange, hasLaps }: ActivityTabsProps) {
  const tabs = [
    { label: 'Przegląd', value: 0, icon: <DashboardOutlinedIcon fontSize="small" /> },
    { label: 'Analiza', value: 1, icon: <QueryStatsOutlinedIcon fontSize="small" /> },
    ...(hasLaps ? [{ label: 'Okrążenia', value: 2, icon: <TimerOutlinedIcon fontSize="small" /> }] : []),
    {
      label: 'Zaawansowane',
      value: hasLaps ? 3 : 2,
      icon: <TuneOutlinedIcon fontSize="small" />,
    },
    {
      label: 'AI Coach',
      value: hasLaps ? 4 : 3,
      icon: <SmartToyOutlinedIcon fontSize="small" />,
    },
  ];

  return <TabsNav tabs={tabs} value={value} onChange={onChange} />;
}
