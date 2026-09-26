import type { UpdateProfileParams } from '@/hooks/useAnalytics';
import type { AthleteProfile } from '@/types/profile';

/** Limits enforced by the backend `UpdateProfileRequest`. */
export const PROFILE_LIMITS = {
  ftpWatts: { min: 100, max: 500 },
  lthrBpm: { min: 100, max: 220 },
  maxHrBpm: { min: 120, max: 250 },
  restingHrBpm: { min: 30, max: 100 },
} as const;

export type NumericProfileField = keyof typeof PROFILE_LIMITS;

export interface ProfileForm extends Record<NumericProfileField, string> {
  name: string;
  dateOfBirth: string;
}

export type ProfileFormErrors = Partial<Record<NumericProfileField, { min: number; max: number }>>;

const NUMERIC_FIELDS = Object.keys(PROFILE_LIMITS) as NumericProfileField[];

export function profileFormFrom(profile: AthleteProfile): ProfileForm {
  return {
    name: profile.name ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    ftpWatts: profile.ftpWatts?.toString() ?? '',
    lthrBpm: profile.lthrBpm?.toString() ?? '',
    maxHrBpm: profile.maxHrBpm?.toString() ?? '',
    restingHrBpm: profile.restingHrBpm?.toString() ?? '',
  };
}

/** Empty fields are allowed (the backend keeps the saved value); filled ones must be whole numbers in range. */
export function validateProfileForm(form: ProfileForm): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  for (const field of NUMERIC_FIELDS) {
    const raw = form[field].trim();
    if (!raw) continue;
    const value = Number(raw);
    const { min, max } = PROFILE_LIMITS[field];
    if (!Number.isInteger(value) || value < min || value > max) errors[field] = { min, max };
  }
  return errors;
}

/** Only changed, non-empty fields — the profile API treats a missing field as "keep". */
export function buildProfileUpdate(profile: AthleteProfile, form: ProfileForm): UpdateProfileParams {
  const update: UpdateProfileParams = {};
  const name = form.name.trim();
  if (name && name !== profile.name) update.name = name;
  if (form.dateOfBirth && form.dateOfBirth !== (profile.dateOfBirth ?? '')) update.dateOfBirth = form.dateOfBirth;
  for (const field of NUMERIC_FIELDS) {
    const raw = form[field].trim();
    if (raw && Number(raw) !== profile[field]) update[field] = Number(raw);
  }
  return update;
}
