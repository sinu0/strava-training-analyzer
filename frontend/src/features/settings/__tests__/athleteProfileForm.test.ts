import { describe, expect, it } from 'vitest';

import { buildProfileUpdate, profileFormFrom, validateProfileForm } from '@/features/settings/athleteProfileForm';
import type { AthleteProfile } from '@/types/profile';

const profile: AthleteProfile = {
  id: 'p1',
  name: 'Jan Testowy',
  email: null,
  ftpWatts: 280,
  lthrBpm: 168,
  maxHrBpm: null,
  restingHrBpm: null,
  weightKg: 74.2,
  dateOfBirth: '1990-05-01',
  stravaConnected: true,
  stravaAthleteId: 1,
  currentZones: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('athlete profile form', () => {
  it('starts from the saved profile with empty strings for missing values', () => {
    expect(profileFormFrom(profile)).toEqual({
      name: 'Jan Testowy', dateOfBirth: '1990-05-01', ftpWatts: '280', lthrBpm: '168', maxHrBpm: '', restingHrBpm: '',
    });
  });

  it('sends only changed fields', () => {
    const form = { ...profileFormFrom(profile), ftpWatts: '295', restingHrBpm: '48' };

    expect(buildProfileUpdate(profile, form)).toEqual({ ftpWatts: 295, restingHrBpm: 48 });
    expect(buildProfileUpdate(profile, profileFormFrom(profile))).toEqual({});
  });

  it('flags values outside the backend limits', () => {
    const errors = validateProfileForm({ ...profileFormFrom(profile), ftpWatts: '90', maxHrBpm: '260', restingHrBpm: 'abc' });

    expect(errors).toEqual({ ftpWatts: { min: 100, max: 500 }, maxHrBpm: { min: 120, max: 250 }, restingHrBpm: { min: 30, max: 100 } });
    expect(validateProfileForm(profileFormFrom(profile))).toEqual({});
  });
});
