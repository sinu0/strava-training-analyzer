import { AutoAwesome, CheckCircle, DirectionsBike, TrendingUp } from '@mui/icons-material';
import {
  Box, Button, Dialog, DialogContent, DialogTitle, Paper, Stack, Step, StepLabel, Stepper, Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { STATUS_COLORS, alphaColor } from '@/utils/colors';

const ONBOARDING_KEY = 'strava-analizator-onboarding-done';

function isOnboardingNeeded(profile: { ftpWatts?: number | null } | undefined, ftpProgress: { currentFtp?: number | null } | undefined): boolean {
  if (typeof localStorage === 'undefined') return false;
  if (localStorage.getItem(ONBOARDING_KEY)) return false;
  if (!ftpProgress || ftpProgress.currentFtp == null || ftpProgress.currentFtp < 50) return true;
  if (!profile || profile.ftpWatts == null) return true;
  return false;
}

function completeOnboarding() {
  try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* ignore */ }
}

const STEPS = [
  { label: 'Połączono ze Stravą', icon: <DirectionsBike />, desc: 'Twoje aktywności są synchronizowane automatycznie.' },
  { label: 'Sprawdź FTP', icon: <TrendingUp />, desc: 'Ustaw swoją wartość FTP w profilu, aby Coach Engine mógł precyzyjnie dobierać treningi.' },
  { label: 'Ustaw cel', icon: <AutoAwesome />, desc: 'Określ cel treningowy — FTP, event, wytrzymałość. Coach dostosuje plan.' },
  { label: 'Gotowe!', icon: <CheckCircle />, desc: 'Codziennie rano sprawdzaj dashboard — Coach powie Ci co robić dziś.' },
];

interface Props {
  profile: { ftpWatts?: number | null } | undefined;
  ftpProgress: { currentFtp?: number | null } | undefined;
}

export default function OnboardingOverlay({ profile, ftpProgress }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);

  if (!isOnboardingNeeded(profile, ftpProgress)) return null;
  if (!open) return null;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding();
      setOpen(false);
    }
  };

  const handleStart = () => {
    completeOnboarding();
    setOpen(false);
    if (step < 2) navigate('/profile');
    else navigate('/coach');
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth onClose={() => { completeOnboarding(); setOpen(false); }}>
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <AutoAwesome sx={{ color: 'primary.main', fontSize: 32, mb: 0.5 }} />
        <Typography variant="h5" fontWeight={800}>Witaj w Strava Analizator!</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Trzy kroki do inteligentnego treningu.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
          {STEPS.map((s, i) => (
            <Step key={s.label} completed={i < step}>
              <StepLabel>{s.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 2, borderRadius: 2, bgcolor: alphaColor(STATUS_COLORS.success, 0.06), border: '1px solid', borderColor: alphaColor(STATUS_COLORS.success, 0.15) }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{ color: 'primary.main', mt: 0.25 }}>{STEPS[step]!.icon}</Box>
              <Box>
                <Typography fontWeight={700} fontSize="0.95rem">{STEPS[step]!.label}</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.25}>{STEPS[step]!.desc}</Typography>
            </Box>
          </Stack>
        </Paper>

        <Stack direction="row" spacing={1.5} justifyContent="center" mt={3}>
          <Button variant="outlined" onClick={handleStart}>
            {step < 2 ? 'Ustaw w profilu' : 'Otwórz Coacha'}
          </Button>
          <Button variant="contained" onClick={handleNext}>
            {step < STEPS.length - 1 ? 'Dalej' : 'Zaczynamy!'}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
