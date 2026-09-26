import AddIcon from '@mui/icons-material/Add';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RemoveIcon from '@mui/icons-material/Remove';
import ReplayIcon from '@mui/icons-material/Replay';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import StopIcon from '@mui/icons-material/Stop';
import { Box, Button, Stack, Tooltip } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';
import { RoundAction, StatusPill } from '@/ui';

import { cockpitMessages } from './messages';

interface ControlDockProps {
  paused: boolean;
  lapStep: boolean;
  intensityPct: number;
  onTogglePause(): void;
  onPrevious(): void;
  onSkip(): void;
  onIntensity(delta: number): void;
  onAbort(): void;
}

/** Thumb-reachable controls, sticky at the bottom of the screen. */
export default function ControlDock({ paused, lapStep, intensityPct, onTogglePause, onPrevious, onSkip, onIntensity, onAbort }: ControlDockProps) {
  const t = cockpitMessages.useT();
  return (
    <Box
      component="nav"
      aria-label={t('controlDock.nav')}
      sx={(theme) => {
        const tokens = getAppThemeTokens(theme);
        return {
          position: 'sticky',
          bottom: 0,
          zIndex: theme.zIndex.appBar,
          mt: 2,
          mx: { xs: -2, sm: 0 },
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          pb: 'calc(12px + env(safe-area-inset-bottom))',
          bgcolor: tokens.topBar,
          backdropFilter: 'blur(14px)',
          borderTop: `1px solid ${tokens.surfaceBorder}`,
          borderRadius: { sm: `${tokens.radius.card}px ${tokens.radius.card}px 0 0` },
        };
      }}
    >
      <Stack direction="row" spacing={{ xs: 1, sm: 2 }} sx={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <RoundAction aria-label={t('controlDock.intensityDown')} variant="bubble" size="md" icon={<RemoveIcon />} onClick={() => onIntensity(-5)} />
          <StatusPill label={`${intensityPct >= 0 ? '+' : ''}${intensityPct}%`} tone={intensityPct === 0 ? 'neutral' : 'primary'} />
          <RoundAction aria-label={t('controlDock.intensityUp')} variant="bubble" size="md" icon={<AddIcon />} onClick={() => onIntensity(5)} />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Tooltip title={t('controlDock.repeatTooltip')}><span><RoundAction aria-label={t('controlDock.repeat')} variant="bubble" size="lg" icon={<ReplayIcon />} onClick={onPrevious} /></span></Tooltip>
          <Tooltip title={t('controlDock.spaceTooltip')}><span><RoundAction aria-label={paused ? t('controlDock.resume') : t('controlDock.pause')} variant="accent" size="xl" icon={paused ? <PlayArrowIcon /> : <PauseIcon />} onClick={onTogglePause} /></span></Tooltip>
          <Tooltip title={lapStep ? t('controlDock.lapTooltip') : t('controlDock.skipTooltip')}><span><RoundAction aria-label={lapStep ? t('controlDock.lapNext') : t('controlDock.skip')} variant="bubble" size="lg" icon={<SkipNextIcon />} onClick={onSkip} /></span></Tooltip>
        </Stack>
        <Button color="error" size="small" startIcon={<StopIcon />} onClick={onAbort}>{t('controlDock.finish')}</Button>
      </Stack>
    </Box>
  );
}
