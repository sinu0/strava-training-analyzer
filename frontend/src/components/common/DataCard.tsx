import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import type { ReactNode } from 'react';

interface DataCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}

/**
 * Displays a titled card section with an optional subtitle, header icon and header action.
 * The icon renders inside a soft iconBubble circle (38px) matching the dashboard style.
 */
export default function DataCard({ title, subtitle, icon, children, action }: DataCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={
          icon ? (
            <Box
              sx={{
                width: (theme) => getAppThemeTokens(theme).control.md,
                height: (theme) => getAppThemeTokens(theme).control.md,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: (theme) => theme.tokens?.iconBubble ?? 'action.hover',
                color: 'text.primary',
                '& svg': { fontSize: (theme) => getAppThemeTokens(theme).icon.md },
              }}
            >
              {icon}
            </Box>
          ) : undefined
        }
        title={
          <Typography variant="subtitle1">
            {title}
          </Typography>
        }
        subheader={
          subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : undefined
        }
        action={action}
        sx={{
          px: (theme) => getAppThemeTokens(theme).space.card,
          pt: (theme) => getAppThemeTokens(theme).space.card,
          pb: 1.5,
          alignItems: 'center',
          '& .MuiCardHeader-avatar': { mr: 1.5 },
          '& .MuiCardHeader-content': { minWidth: 0 },
          '& .MuiCardHeader-action': { alignSelf: 'center', mt: 0, mr: 0 },
        }}
      />
      <CardContent
        sx={{
          px: (theme) => getAppThemeTokens(theme).space.card,
          pt: 0,
          pb: (theme) => getAppThemeTokens(theme).space.card,
          '&:last-child': { pb: (theme) => getAppThemeTokens(theme).space.card },
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
}
