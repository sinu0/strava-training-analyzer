import MonitorWeightIcon from '@mui/icons-material/MonitorWeightOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { Alert, Box, Button, CircularProgress, Grid, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import PolishDateField from '@/components/common/PolishDateField';
import {
  buildProfileUpdate,
  PROFILE_LIMITS,
  profileFormFrom,
  validateProfileForm,
  type NumericProfileField,
  type ProfileForm,
} from '@/features/settings/athleteProfileForm';
import { settingsMessages } from '@/features/settings/messages';
import { useProfile, useUpdateProfile } from '@/hooks/useAnalytics';
import { getLocale } from '@/i18n';
import { SkeletonCard, Widget } from '@/ui';

const NUMERIC_FIELDS: { field: NumericProfileField; label: 'ftp' | 'lthr' | 'maxHr' | 'restingHr' }[] = [
  { field: 'ftpWatts', label: 'ftp' },
  { field: 'lthrBpm', label: 'lthr' },
  { field: 'maxHrBpm', label: 'maxHr' },
  { field: 'restingHrBpm', label: 'restingHr' },
];

export default function AthleteTab() {
  const t = settingsMessages.useT();
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const profile = profileQuery.data;
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [status, setStatus] = useState<'saved' | 'noChanges' | null>(null);

  // Reset the form only when the saved profile actually changes (not on every refetch).
  const profileVersion = profile ? `${profile.id}:${profile.updatedAt}` : null;
  useEffect(() => {
    if (profile) setForm(profileFormFrom(profile));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileVersion]);

  if (profileQuery.isLoading || (profile && !form)) return <SkeletonCard height={360} />;
  if (!profile || !form) return <Alert severity="warning">{t('athlete.loadError')}</Alert>;

  const errors = validateProfileForm(form);
  const hasErrors = Object.keys(errors).length > 0;
  const change = (patch: Partial<ProfileForm>) => {
    setStatus(null);
    setForm((current) => (current ? { ...current, ...patch } : current));
  };

  const save = () => {
    const update = buildProfileUpdate(profile, form);
    if (Object.keys(update).length === 0) {
      setStatus('noChanges');
      return;
    }
    updateProfile.mutate(update, { onSuccess: () => setStatus('saved') });
  };

  return (
    <Stack spacing={2.5}>
      <Widget title={t('athlete.personalTitle')}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              label={t('athlete.fields.name')}
              fullWidth
              size="small"
              value={form.name}
              onChange={(event) => change({ name: event.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <PolishDateField
              label={t('athlete.fields.dateOfBirth')}
              fullWidth
              size="small"
              value={form.dateOfBirth}
              onChange={(dateOfBirth) => change({ dateOfBirth })}
            />
          </Grid>
        </Grid>
      </Widget>

      <Widget title={t('athlete.thresholdsTitle')} subtitle={t('athlete.description')}>
        <Grid container spacing={2}>
          {NUMERIC_FIELDS.map(({ field, label }) => {
            const { min, max } = PROFILE_LIMITS[field];
            const error = errors[field];
            return (
              <Grid key={field} size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t(`athlete.fields.${label}`)}
                  type="number"
                  fullWidth
                  size="small"
                  value={form[field]}
                  error={Boolean(error)}
                  helperText={error ? t('athlete.outOfRange', error) : t(`athlete.fields.${label}Helper`, { min, max })}
                  onChange={(event) => change({ [field]: event.target.value } as Partial<ProfileForm>)}
                  slotProps={{ htmlInput: { min, max, inputMode: 'numeric' } }}
                />
              </Grid>
            );
          })}
        </Grid>
      </Widget>

      <Widget title={t('athlete.weightTitle')} icon={<MonitorWeightIcon />}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {profile.weightKg != null
                ? t('athlete.weightValue', { weight: Number(profile.weightKg).toLocaleString(getLocale(), { maximumFractionDigits: 1 }) })
                : t('athlete.weightMissing')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('athlete.weightHint')}</Typography>
          </Box>
          <Button component={RouterLink} to="/weight" variant="outlined" size="small">
            {t('athlete.openWeight')}
          </Button>
        </Box>
      </Widget>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'flex-end' }}>
        {status === 'saved' && <Typography variant="body2" sx={{ color: 'success.main' }}>{t('athlete.saved')}</Typography>}
        {status === 'noChanges' && <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('athlete.noChanges')}</Typography>}
        {!!updateProfile.isError && <Typography variant="body2" sx={{ color: 'error.main' }}>{t('athlete.saveError')}</Typography>}
        <Button
          variant="contained"
          startIcon={updateProfile.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
          disabled={hasErrors || updateProfile.isPending}
          onClick={save}
        >
          {updateProfile.isPending ? t('athlete.saving') : t('athlete.save')}
        </Button>
      </Box>
    </Stack>
  );
}
