import { Box } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import Surface, { type SurfaceProps } from './Surface';
import WidgetHeader, { type WidgetHeaderProps } from './WidgetHeader';

import type { ReactNode } from 'react';

export interface WidgetProps extends Omit<SurfaceProps, 'title'> {
  title?: WidgetHeaderProps['title'];
  subtitle?: WidgetHeaderProps['subtitle'];
  icon?: ReactNode;
  iconTone?: WidgetHeaderProps['iconTone'];
  action?: ReactNode;
  headingComponent?: WidgetHeaderProps['component'];
  /** Full-bleed content under the padded body, e.g. a map or chart edge-to-edge. */
  media?: ReactNode;
}

/**
 * The standard dashboard card: Surface + WidgetHeader + body.
 * Replaces ad-hoc Card/Paper/Section/DataCard combinations.
 */
export default function Widget({
  title, subtitle, icon, iconTone, action, headingComponent, media, children, padding = 'md', sx, ...surface
}: WidgetProps) {
  const hasHeader = Boolean(title || action);
  return (
    <Surface
      padding={media ? 'none' : padding}
      sx={[{ height: '100%', display: 'flex', flexDirection: 'column' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...surface}
    >
      <Box sx={media ? { p: (theme) => getAppThemeTokens(theme).space.card, pb: children ? undefined : 2 } : undefined}>
        {hasHeader ? (
          <WidgetHeader title={title} subtitle={subtitle} icon={icon} iconTone={iconTone} action={action} component={headingComponent} />
        ) : null}
        {children ? <Box sx={{ mt: hasHeader ? 2 : 0, minWidth: 0, flex: 1 }}>{children}</Box> : null}
      </Box>
      {media ? <Box sx={{ mt: 'auto', position: 'relative' }}>{media}</Box> : null}
    </Surface>
  );
}
