import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { Box, Typography } from '@mui/material';

import { formatDistance, formatDuration } from '../../utils/formatters';

import type { WeeklySummary, ReadinessData } from '../../types/analytics';


const GRADIENTS: string[] = [
  'linear-gradient(135deg, #1565C0 0%, #E65100 100%)',
  'linear-gradient(135deg, #4A148C 0%, #1A237E 100%)',
  'linear-gradient(135deg, #1B5E20 0%, #F57F17 100%)',
  'linear-gradient(135deg, #BF360C 0%, #880E4F 100%)',
];

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
      <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.65)', mt: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
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
  const fmt = (date: Date) => date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function Slide1({ week }: { week: WeeklySummary | undefined }) {
  return (
    <SlideWrapper gradient={GRADIENTS[0] ?? ''}>
      <DirectionsBikeIcon sx={{ fontSize: 52, color: 'rgba(255,255,255,0.8)' }} />
      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 4, fontSize: '0.78rem' }}>
        Twój tydzień
      </Typography>
      {!!week && (
        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mt: -1 }}>
          {formatWeekRange(week.weekStart)}
        </Typography>
      )}
      <Typography sx={{ fontSize: '4rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
        {week ? formatDistance(week.totalDistanceM) : '—'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
        <StatBlock label="Czas" value={week ? formatDuration(week.totalTimeSec) : '—'} />
        <StatBlock label="Wzniesienie" value={week ? `${Math.round(week.totalElevationM)} m` : '—'} />
        <StatBlock label="Aktywności" value={week?.activityCount ?? '—'} />
      </Box>
    </SlideWrapper>
  );
}

function Slide2({ week, readiness }: { week: WeeklySummary | undefined; readiness: ReadinessData | undefined }) {
  return (
    <SlideWrapper gradient={GRADIENTS[1] ?? ''}>
      <TrendingUpIcon sx={{ fontSize: 52, color: 'rgba(255,255,255,0.8)' }} />
      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 4, fontSize: '0.78rem' }}>
        Wysiłek
      </Typography>
      {!!week && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '4rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
            {Math.round(week.totalTss)}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
            TSS tygodnia
          </Typography>
        </Box>
      )}
      {!!readiness && (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
          <StatBlock label="CTL" value={Math.round(readiness.ctl)} />
          <StatBlock label="ATL" value={Math.round(readiness.atl)} />
          <StatBlock label="TSB" value={Math.round(readiness.tsb)} />
          <StatBlock label="Gotowość" value={`${readiness.score}%`} />
        </Box>
      )}
    </SlideWrapper>
  );
}

function Slide3({ weeklySummaries }: { weeklySummaries: WeeklySummary[] }) {
  const best = [...weeklySummaries].sort((a, b) => b.totalTss - a.totalTss)[0];
  return (
    <SlideWrapper gradient={GRADIENTS[2] ?? ''}>
      <EmojiEventsIcon sx={{ fontSize: 52, color: 'rgba(255,255,255,0.8)' }} />
      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 4, fontSize: '0.78rem' }}>
        Najlepsze osiągnięcie
      </Typography>
      {!!best && <>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mt: -1 }}>
            {formatWeekRange(best.weekStart)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
            <StatBlock label="Dystans" value={formatDistance(best.totalDistanceM)} />
            <StatBlock label="TSS" value={Math.round(best.totalTss)} />
            <StatBlock label="Aktywności" value={best.activityCount} />
          </Box>
        </>}
    </SlideWrapper>
  );
}

function Slide4({ streak }: { streak: number }) {
  const plural = streak === 1 ? 'tydzień' : streak < 5 ? 'tygodnie' : 'tygodni';
  const msg =
    streak >= 4
      ? 'Niesamowita seria! Jesteś w świetnej formie!'
      : streak >= 2
        ? 'Brawo! Trzymaj się tej regularności!'
        : 'Każdy trening się liczy. Do przodu!';
  return (
    <SlideWrapper gradient={GRADIENTS[3] ?? ''}>
      <WhatshotIcon sx={{ fontSize: 68, color: '#FFB74D' }} />
      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 4, fontSize: '0.78rem' }}>
        Tak trzymaj!
      </Typography>
      <Typography sx={{ fontSize: '3.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
        {streak} {plural}
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', mt: -1 }}>z rzędu 🔥</Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', textAlign: 'center', mt: 1, maxWidth: 260 }}>
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
