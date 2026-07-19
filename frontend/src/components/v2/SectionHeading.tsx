import { Box, Stack, Typography } from '@mui/material';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function SectionHeading({ eyebrow, title, description, icon, action }: SectionHeadingProps) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
      <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
        {icon ? (
          <Box sx={{ mt: 0.15, display: 'grid', placeItems: 'center', color: 'primary.main' }}>{icon}</Box>
        ) : null}
        <Box sx={{ minWidth: 0 }}>
          {eyebrow ? (
            <Typography variant="overline" color="primary" sx={{ fontWeight: 800, lineHeight: 1.3, letterSpacing: '0.1em' }}>
              {eyebrow}
            </Typography>
          ) : null}
          <Typography variant="h6" sx={{ fontWeight: 780, letterSpacing: '-0.015em' }}>{title}</Typography>
          {description ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>{description}</Typography> : null}
        </Box>
      </Stack>
      {action}
    </Stack>
  );
}
