import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import StarOutlineOutlinedIcon from '@mui/icons-material/StarOutlineOutlined';
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
    { label: 'Ocena', value: 1, icon: <StarOutlineOutlinedIcon fontSize="small" /> },
    { label: 'Analiza', value: 2, icon: <QueryStatsOutlinedIcon fontSize="small" /> },
    ...(hasLaps ? [{ label: 'Okrążenia', value: 3, icon: <TimerOutlinedIcon fontSize="small" /> }] : []),
    {
      label: 'Zaawansowane',
      value: hasLaps ? 4 : 3,
      icon: <TuneOutlinedIcon fontSize="small" />,
    },
    {
      label: 'AI Coach',
      value: hasLaps ? 5 : 4,
      icon: <SmartToyOutlinedIcon fontSize="small" />,
    },
  ];

  return <TabsNav tabs={tabs} value={value} onChange={onChange} />;
}
