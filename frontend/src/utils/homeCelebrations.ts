import type { ActivitySummary } from '@/types/activity';
import type { Achievement, FtpProgress, ProgressionLevel } from '@/types/analytics';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { getHomeWidgetIllustrationPath, getPageHeroIllustrationPath } from '@/utils/illustrationAssets';

export interface HomeCelebrationSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  accentColor: string;
  artwork: string;
  ctaLabel: string;
  ctaTo: string;
  badge?: string;
}

export interface HomeCelebrationSnapshot {
  initialized: boolean;
  lastActivityId: string | null;
  highestSeenFtp: number | null;
  unlockedAchievements: Record<string, string>;
  progressionLevels: Record<string, number>;
}

interface HomeCelebrationInput {
  latestActivity?: ActivitySummary | null;
  ftpProgress?: FtpProgress;
  progressionLevels?: ProgressionLevel[];
  achievements?: Achievement[];
}

export const HOME_CELEBRATION_STORAGE_KEY = 'home-celebrations-v1';

export function createEmptyHomeCelebrationSnapshot(): HomeCelebrationSnapshot {
  return {
    initialized: false,
    lastActivityId: null,
    highestSeenFtp: null,
    unlockedAchievements: {},
    progressionLevels: {},
  };
}

function formatUnlockedMarker(achievement: Achievement): string {
  return achievement.unlockedAt ?? 'unlocked';
}

export function readHomeCelebrationSnapshot(storage: Storage | null): HomeCelebrationSnapshot {
  if (!storage) {
    return createEmptyHomeCelebrationSnapshot();
  }

  const raw = storage.getItem(HOME_CELEBRATION_STORAGE_KEY);
  if (!raw) {
    return createEmptyHomeCelebrationSnapshot();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<HomeCelebrationSnapshot>;
    return {
      initialized: parsed.initialized ?? false,
      lastActivityId: parsed.lastActivityId ?? null,
      highestSeenFtp: parsed.highestSeenFtp ?? null,
      unlockedAchievements: parsed.unlockedAchievements ?? {},
      progressionLevels: parsed.progressionLevels ?? {},
    };
  } catch {
    return createEmptyHomeCelebrationSnapshot();
  }
}

export function writeHomeCelebrationSnapshot(
  storage: Storage | null,
  snapshot: HomeCelebrationSnapshot,
): void {
  storage?.setItem(HOME_CELEBRATION_STORAGE_KEY, JSON.stringify(snapshot));
}

export function buildHomeCelebrationPayload(
  input: HomeCelebrationInput,
  previousSnapshot: HomeCelebrationSnapshot,
): {
  slides: HomeCelebrationSlide[];
  nextSnapshot: HomeCelebrationSnapshot;
} {
  const slides: HomeCelebrationSlide[] = [];
  const nextSnapshot: HomeCelebrationSnapshot = {
    initialized: true,
    lastActivityId: previousSnapshot.lastActivityId,
    highestSeenFtp: previousSnapshot.highestSeenFtp,
    unlockedAchievements: { ...previousSnapshot.unlockedAchievements },
    progressionLevels: { ...previousSnapshot.progressionLevels },
  };

  const { latestActivity, ftpProgress, progressionLevels, achievements } = input;

  if (
    previousSnapshot.initialized &&
    latestActivity?.id &&
    previousSnapshot.lastActivityId &&
    previousSnapshot.lastActivityId !== latestActivity.id
  ) {
    slides.push({
      id: `activity-${latestActivity.id}`,
      eyebrow: 'Nowy import',
      title: latestActivity.name,
      description: `${formatDistance(latestActivity.distanceM)} · ${formatDuration(latestActivity.movingTimeSec)} · aktywność została właśnie dodana do Twojej historii.`,
      accentColor: '#4ecdc4',
      artwork: getPageHeroIllustrationPath('dashboard'),
      ctaLabel: 'Otwórz aktywność',
      ctaTo: `/activities/${latestActivity.id}`,
      badge: 'Nowa aktywność',
    });
  }
  if (latestActivity?.id) {
    nextSnapshot.lastActivityId = latestActivity.id;
  }

  const currentFtp = ftpProgress?.currentFtp ?? null;
  if (currentFtp != null) {
    const previousBest = previousSnapshot.highestSeenFtp ?? currentFtp;
    if (previousSnapshot.initialized && currentFtp > previousBest) {
      slides.push({
        id: `ftp-${currentFtp}`,
        eyebrow: 'Nowe FTP',
        title: `Gratulacje, ${currentFtp} W`,
        description: `FTP wzrosło o ${currentFtp - previousBest} W. To dobry moment, żeby odświeżyć cele i zakresy pracy.`,
        accentColor: '#ff7b39',
        artwork: getPageHeroIllustrationPath('analytics'),
        ctaLabel: 'Zobacz analitykę',
        ctaTo: '/analytics',
        badge: `+${currentFtp - previousBest} W`,
      });
    }
    nextSnapshot.highestSeenFtp = Math.max(previousBest, currentFtp);
  }

  for (const achievement of achievements ?? []) {
    if (!achievement.unlocked) {
      continue;
    }

    const marker = formatUnlockedMarker(achievement);
    const previousMarker = previousSnapshot.unlockedAchievements[achievement.id];
    if (previousSnapshot.initialized && previousMarker !== marker) {
      slides.push({
        id: `achievement-${achievement.id}-${marker}`,
        eyebrow: 'Nowe osiągnięcie',
        title: achievement.name,
        description: achievement.description,
        accentColor: '#9b7cff',
        artwork: getHomeWidgetIllustrationPath('progress'),
        ctaLabel: 'Pokaż profil',
        ctaTo: '/profile',
        badge: achievement.icon,
      });
    }
    nextSnapshot.unlockedAchievements[achievement.id] = marker;
  }

  for (const level of progressionLevels ?? []) {
    const previousLevel = previousSnapshot.progressionLevels[level.system] ?? level.level;
    if (previousSnapshot.initialized && level.level > previousLevel) {
      slides.push({
        id: `progression-${level.system}-${level.level}`,
        eyebrow: 'Nowy poziom',
        title: `${level.label} · poziom ${level.level}`,
        description: level.nextRecommendation,
        accentColor: '#4ecdc4',
        artwork: getHomeWidgetIllustrationPath('block'),
        ctaLabel: 'Otwórz analitykę',
        ctaTo: '/analytics',
        badge: `Lvl ${level.level}`,
      });
    }
    nextSnapshot.progressionLevels[level.system] = Math.max(previousLevel, level.level);
  }

  return { slides, nextSnapshot };
}
