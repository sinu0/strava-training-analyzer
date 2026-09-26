import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { Box, Typography } from '@mui/material';

import { profileMessages } from '@/components/profile/messages';
import { getLocale } from '@/i18n';
import { getAppThemeTokens, tokens } from '@/theme/theme';

import { formatDistance, formatDuration } from '../../utils/formatters';

import type { WeeklySummary, ReadinessData } from '../../types/analytics';


const GRADIENTS: readonly string[] = tokens.media.storyGradients;

interface Props {
  slideIndex: number;
  weeklySummaries: WeeklySummary[];
  readiness: ReadinessData | undefined;
  streak: number;
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ textAlign: 'center', px: 1.5 }}>
      <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.62rem', color: (t) => getAppThemeTokens(t).media.inkQuiet, mt: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </Typography>
    </Box>
  );
}

function SlideWrapper({ gradient, children }: { gradient: string; children: React.ReactNode }) {
  return (
    <Box sx={{ height: '100%', background: gradient, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 4, gap: 2.5, pt: 4 }}>
      {children}
    </Box>
  );
}

function formatWeekRange(weekStart: string): string {
  const parts = weekStart.split('-').map(Number);
  const y = parts[0] ?? 2000;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const fmt = (date: Date) => date.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function Slide1({ week }: { week: WeeklySummary | undefined }) {
  const t = profileMessages.useT();
  return (
    <SlideWrapper gradient={GRADIENTS[0] ?? ''}>
      <DirectionsBikeIcon sx={{ fontSize: 52, color: (t) => getAppThemeTokens(t).media.inkMuted }} />
      <Typography variant="overline" sx={{ color: (t) => getAppThemeTokens(t).media.inkMuted, letterSpacing: 4, fontSize: '0.78rem' }}>
        {t('story.yourWeek')}
      </Typography>
      {!!week && (
        <Typography sx={{ color: (t) => getAppThemeTokens(t).media.inkQuiet, fontSize: '0.85rem', mt: -1 }}>
          {formatWeekRange(week.weekStart)}
        </Typography>
      )}
      <Typography sx={{ fontSize: '4rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
        {week ? formatDistance(week.totalDistanceM) : '—'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
        <StatBlock label={t('story.time')} value={week ? formatDuration(week.totalTimeSec) : '—'} />
        <StatBlock label={t('story.elevation')} value={week ? `${Math.round(week.totalElevationM)} m` : '—'} />
        <StatBlock label={t('story.activities')} value={week?.activityCount ?? '—'} />
      </Box>
    </SlideWrapper>
  );
}

function Slide2({ week, readiness }: { week: WeeklySummary | undefined; readiness: ReadinessData | undefined }) {
  const t = profileMessages.useT();
  return (
    <SlideWrapper gradient={GRADIENTS[1] ?? ''}>
      <TrendingUpIcon sx={{ fontSize: 52, color: (t) => getAppThemeTokens(t).media.inkMuted }} />
      <Typography variant="overline" sx={{ color: (t) => getAppThemeTokens(t).media.inkMuted, letterSpacing: 4, fontSize: '0.78rem' }}>
        {t('story.effort')}
      </Typography>
      {!!week && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '4rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
            {Math.round(week.totalTss)}
          </Typography>
          <Typography sx={{ color: (t) => getAppThemeTokens(t).media.inkQuiet, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('story.weekTss')}
          </Typography>
        </Box>
      )}
      {!!readiness && (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
          <StatBlock label="CTL" value={readiness.ctl == null ? '—' : Math.round(readiness.ctl)} />
          <StatBlock label="ATL" value={readiness.atl == null ? '—' : Math.round(readiness.atl)} />
          <StatBlock label="TSB" value={readiness.tsb == null ? '—' : Math.round(readiness.tsb)} />
          <StatBlock label={t('story.readiness')} value={readiness.score == null ? '—' : `${readiness.score}%`} />
        </Box>
      )}
    </SlideWrapper>
  );
}

function Slide3({ weeklySummaries }: { weeklySummaries: WeeklySummary[] }) {
  const t = profileMessages.useT();
  const best = [...weeklySummaries].sort((a, b) => b.totalTss - a.totalTss)[0];
  return (
    <SlideWrapper gradient={GRADIENTS[2] ?? ''}>
      <EmojiEventsIcon sx={{ fontSize: 52, color: (t) => getAppThemeTokens(t).media.inkMuted }} />
      <Typography variant="overline" sx={{ color: (t) => getAppThemeTokens(t).media.inkMuted, letterSpacing: 4, fontSize: '0.78rem' }}>
        {t('story.bestAchievement')}
      </Typography>
      {!!best && <>
          <Typography sx={{ color: (t) => getAppThemeTokens(t).media.inkQuiet, fontSize: '0.85rem', mt: -1 }}>
            {formatWeekRange(best.weekStart)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
            <StatBlock label={t('story.distance')} value={formatDistance(best.totalDistanceM)} />
            <StatBlock label="TSS" value={Math.round(best.totalTss)} />
            <StatBlock label={t('story.activities')} value={best.activityCount} />
          </Box>
        </>}
    </SlideWrapper>
  );
}

function Slide4({ streak }: { streak: number }) {
  const t = profileMessages.useT();
  const msg =
    streak >= 4
      ? t('story.streakGreat')
      : streak >= 2
        ? t('story.streakGood')
        : t('story.streakStart');
  return (
    <SlideWrapper gradient={GRADIENTS[3] ?? ''}>
      <WhatshotIcon sx={{ fontSize: 68, color: (t) => getAppThemeTokens(t).status.sunny }} />
      <Typography variant="overline" sx={{ color: (t) => getAppThemeTokens(t).media.inkMuted, letterSpacing: 4, fontSize: '0.78rem' }}>
        {t('story.keepItUp')}
      </Typography>
      <Typography sx={{ fontSize: '3.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
        {t('story.weeks', { count: streak })}
      </Typography>
      <Typography sx={{ color: (t) => getAppThemeTokens(t).media.inkMuted, fontSize: '1rem', mt: -1 }}>{t('story.inARow')}</Typography>
      <Typography sx={{ color: (t) => getAppThemeTokens(t).media.inkQuiet, fontSize: '0.9rem', textAlign: 'center', mt: 1, maxWidth: 260 }}>
        {msg}
      </Typography>
    </SlideWrapper>
  );
}

export default function SummaryStoryContent({ slideIndex, weeklySummaries, readiness, streak }: Props) {
  const latestWeek = weeklySummaries[0];
  if (slideIndex === 1) return <Slide2 week={latestWeek} readiness={readiness} />;
  if (slideIndex === 2) return <Slide3 weeklySummaries={weeklySummaries} />;
  if (slideIndex === 3) return <Slide4 streak={streak} />;
  return <Slide1 week={latestWeek} />;
}
