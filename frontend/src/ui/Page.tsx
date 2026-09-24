import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Breadcrumbs, Box, Link, Typography, type Breakpoint } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import PageHeader from './PageHeader';

import type { ReactNode } from 'react';

interface PageBreadcrumb {
  label: string;
  href?: string;
}

export interface PageProps {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  maxWidth?: Breakpoint | number;
  breadcrumbs?: PageBreadcrumb[];
  children: ReactNode;
}

/**
 * Page shell: width constraint, breadcrumbs and the standard PageHeader.
 */
export default function Page({
  title,
  subtitle,
  eyebrow,
  meta,
  actions,
  maxWidth,
  breadcrumbs,
  children,
}: PageProps) {
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
                sx={{
                  color: "text.secondary",
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}>
                {item.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      {!!(title || actions) && (
        <PageHeader title={title} description={subtitle} eyebrow={eyebrow} meta={meta} actions={actions} />
      )}
      {children}
    </Box>
  );
}
