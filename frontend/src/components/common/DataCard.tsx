import { Card, CardContent, CardHeader, Typography } from '@mui/material';

import type { ReactNode } from 'react';

interface DataCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

/**
 * Displays a titled card section with an optional subtitle and header action.
 */
export default function DataCard({ title, subtitle, children, action }: DataCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={<Typography variant="h6">{title}</Typography>}
        subheader={subtitle}
        action={action}
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
}
