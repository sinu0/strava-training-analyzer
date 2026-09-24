import { Box, Stack, Typography } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import GlassStat, { type GlassStatProps } from './GlassStat';
import RoundAction from './RoundAction';
import StatusPill from './StatusPill';
import Surface from './Surface';

import type { ReactNode } from 'react';

export interface HeroImage {
  src: string;
  alt: string;
  position?: string;
}

export interface HeroCardProps {
  image: HeroImage;
  title: ReactNode;
  /** Glass pill in the top-left corner. */
  eyebrow?: string;
  /** Uppercase caption under the title (date, place). */
  caption?: ReactNode;
  description?: ReactNode;
  /** Large glass figure in the top-right corner. */
  stat?: GlassStatProps;
  /** Smaller glass figures under the description. */
  metrics?: Array<GlassStatProps & { id: string }>;
  footnote?: ReactNode;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  /** overlay — text on the photo (dashboard hero); split — text left, photo right (page intro). */
  layout?: 'overlay' | 'split';
  minHeight?: number | { xs?: number; md?: number };
  headingComponent?: 'h1' | 'h2';
  children?: ReactNode;
}

function HeroPhoto({ image }: { image: HeroImage }) {
  return (
    <>
      <Box component="img" src={image.src} alt={image.alt} loading="lazy" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: image.position ?? 'center' }} />
      <Box aria-hidden sx={(theme) => ({ position: 'absolute', inset: 0, background: getAppThemeTokens(theme).heroScrim })} />
    </>
  );
}

/** Photographic hero surface with glass pill, glass figures and a round call-to-action. */
export default function HeroCard({
  image, title, eyebrow, caption, description, stat, metrics, footnote, action, layout = 'overlay',
  minHeight = { xs: 380, md: 440 }, headingComponent = 'h2', children,
}: HeroCardProps) {
  if (layout === 'split') {
    return (
      <Surface padding="sm" sx={{ mb: { xs: 2, md: 2.5 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1.5, md: 2.5 }} sx={{ alignItems: 'stretch' }}>
          <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0, justifyContent: 'space-between' }}>
            <Box>
              {eyebrow ? <Typography variant="overline" sx={{ color: 'primary.main', display: 'block' }}>{eyebrow}</Typography> : null}
              <Typography variant="h4" component={headingComponent} sx={{ maxWidth: 620 }}>{title}</Typography>
              {description ? <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, maxWidth: 720 }}>{description}</Typography> : null}
            </Box>
            {children}
          </Stack>
          <Box sx={(theme) => ({ position: 'relative', flexBasis: { xs: 'auto', md: '40%' }, minWidth: { md: 280 }, minHeight: { xs: 150, md: 210 }, borderRadius: `${getAppThemeTokens(theme).radius.panel}px`, overflow: 'hidden' })}>
            <HeroPhoto image={image} />
          </Box>
        </Stack>
      </Surface>
    );
  }

  return (
    <Surface variant="accent" padding="none" radius="hero" sx={{ minHeight, height: '100%' }}>
      <Box sx={{ position: 'relative', minHeight: 'inherit', height: '100%' }}>
        <HeroPhoto image={image} />
        {eyebrow ? (
          <Box sx={{ position: 'absolute', top: { xs: 16, md: 22 }, left: { xs: 16, md: 22 }, zIndex: 1 }}>
            <StatusPill label={eyebrow} variant="glass" eyebrow />
          </Box>
        ) : null}
        {stat ? (
          <Box sx={{ position: 'absolute', top: { xs: 16, md: 22 }, right: { xs: 16, md: 22 }, zIndex: 1 }}>
            <GlassStat {...stat} size="lg" />
          </Box>
        ) : null}
        <Stack
          direction="row"
          spacing={2}
          sx={(theme) => ({ position: 'absolute', inset: 'auto 0 0 0', zIndex: 1, p: { xs: 2.5, sm: 3, md: 3.5 }, alignItems: 'flex-end', justifyContent: 'space-between', color: getAppThemeTokens(theme).media.ink })}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography component={headingComponent} variant="h3" sx={{ color: 'inherit', maxWidth: 640, fontSize: 'clamp(2rem, 1.55rem + 1.5vw, 2.6rem)' }}>
              {title}
            </Typography>
            {caption ? (
              <Typography variant="caption" sx={(theme) => ({ display: 'block', mt: 0.6, color: getAppThemeTokens(theme).media.inkMuted, fontWeight: 650, letterSpacing: '0.08em', textTransform: 'uppercase' })}>
                {caption}
              </Typography>
            ) : null}
            {description ? <Typography variant="body1" sx={(theme) => ({ mt: 1.1, maxWidth: 600, color: getAppThemeTokens(theme).media.inkMuted })}>{description}</Typography> : null}
            {metrics?.length ? (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.5 }}>
                {metrics.map(({ id, ...metric }) => <GlassStat key={id} {...metric} />)}
              </Stack>
            ) : null}
            {footnote ? <Typography variant="caption" sx={(theme) => ({ display: 'block', mt: 1.25, color: getAppThemeTokens(theme).media.inkQuiet, maxWidth: 460 })}>{footnote}</Typography> : null}
            {children}
          </Box>
          {action ? <RoundAction aria-label={action.label} icon={action.icon} onClick={action.onClick} /> : null}
        </Stack>
      </Box>
    </Surface>
  );
}
