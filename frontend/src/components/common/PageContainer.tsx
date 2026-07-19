import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Breadcrumbs, Box, Link, Typography, type Breakpoint } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import type { ReactNode } from 'react';

interface PageBreadcrumb {
  label: string;
  href?: string;
}

interface PageContainerProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  maxWidth?: Breakpoint | number;
  breadcrumbs?: PageBreadcrumb[];
  children: ReactNode;
}

/**
 * Constrains page content width and renders an optional page header row.
 */
export default function PageContainer({
  title,
  subtitle,
  actions,
  maxWidth,
  breadcrumbs,
  children,
}: PageContainerProps) {
  const mw =
    typeof maxWidth === 'number'
      ? maxWidth
      : maxWidth === 'sm'
        ? 600
        : maxWidth === 'md'
          ? 960
          : maxWidth === 'lg'
            ? 1200
            : maxWidth === 'xl'
              ? 1536
              : undefined;

  return (
    <Box
      sx={{
        maxWidth: mw,
        mx: mw ? 'auto' : undefined,
        width: '100%',
        animation: 'sectionFadeInUp 260ms ease both',
      }}
    >
      {!!breadcrumbs?.length && (
        <Breadcrumbs
          separator={<ChevronRightIcon fontSize="small" />}
          aria-label="breadcrumbs"
          sx={{ mb: 1.5, color: 'text.secondary' }}
        >
          {breadcrumbs.map((item) =>
            item.href ? (
              <Link
                key={`${item.label}-${item.href}`}
                component={RouterLink}
                underline="hover"
                color="inherit"
                to={item.href}
                sx={{ fontSize: '0.82rem' }}
              >
                {item.label}
              </Link>
            ) : (
              <Typography
                key={item.label}
                color="text.secondary"
                sx={{ fontSize: '0.82rem', fontWeight: 600 }}
              >
                {item.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      {!!(title || actions) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: { xs: 2.5, md: 3.5 },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {!!title && (
              <Typography variant="h4" sx={{ fontWeight: 820, letterSpacing: '-0.03em' }}>
                {title}
              </Typography>
            )}
            {!!subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760, lineHeight: 1.55 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions}
        </Box>
      )}
      {children}
    </Box>
  );
}
