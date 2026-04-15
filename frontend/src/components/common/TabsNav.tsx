import { Tabs, Tab, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface TabItem {
  label: string;
  value: number;
  icon?: React.ReactElement;
}

interface TabsNavProps {
  tabs: TabItem[];
  value: number;
  onChange: (value: number) => void;
}

/**
 * Renders scrollable tabs with the shared dashboard tab styling.
 */
export default function TabsNav({ tabs, value, onChange }: TabsNavProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Tabs
        value={value}
        onChange={(_, v: number) => onChange(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 44,
          '& .MuiTab-root': {
            minHeight: 44,
            minWidth: 44,
            px: { xs: 1.5, md: 2 },
            py: 0.9,
            borderRadius: 2.5,
            mr: 0.75,
            border: '1px solid transparent',
            '&.Mui-selected': {
              bgcolor: (theme) => theme.tokens?.activeOverlay ?? alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
              borderColor: (theme) => alpha(theme.tokens?.chart.primary ?? theme.palette.primary.main, 0.24),
            },
            '&:hover': {
              bgcolor: (theme) => alpha(theme.tokens?.chart.primary ?? theme.palette.primary.main, 0.1),
            },
          },
          '& .MuiTabs-indicator': {
            display: 'none',
          },
        }}
      >
        {tabs.map((t) => (
          <Tab
            key={t.value}
            label={t.label}
            value={t.value}
            icon={t.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>
    </Box>
  );
}
