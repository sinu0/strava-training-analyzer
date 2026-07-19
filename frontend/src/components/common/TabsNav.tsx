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
 * Renders scrollable pill tabs on a soft track, matching the light dashboard style.
 * The active tab is a solid primary pill; the MuiTabs indicator stays hidden.
 */
export default function TabsNav({ tabs, value, onChange }: TabsNavProps) {
  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        maxWidth: '100%',
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          maxWidth: '100%',
          p: 0.5,
          borderRadius: 999,
          bgcolor: (theme) => theme.tokens?.trackBg ?? alpha(theme.palette.text.primary, 0.06),
        }}
      >
        <Tabs
          value={value}
          onChange={(_, v: number) => onChange(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              minWidth: 44,
              px: { xs: 2, md: 2.5 },
              py: 0.75,
              borderRadius: 999,
              mr: 0.5,
              color: 'text.secondary',
              transition: (theme) => theme.tokens?.transition ?? 'all 160ms ease',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              },
              '&:hover:not(.Mui-selected)': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                color: 'text.primary',
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
    </Box>
  );
}
