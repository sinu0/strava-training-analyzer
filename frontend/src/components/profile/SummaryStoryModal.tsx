import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, Fade, IconButton } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import StoryProgressBar from './StoryProgressBar';
import SummaryStoryContent from './SummaryStoryContent';

import type { WeeklySummary, ReadinessData } from '../../types/analytics';

const TOTAL_SLIDES = 4;
const TICK_INTERVAL_MS = 100;
const TICKS_PER_SLIDE = 50; // 50 × 100ms = 5 s

export interface SummaryStoryModalProps {
  open: boolean;
  onClose: () => void;
  weeklySummaries: WeeklySummary[];
  readiness: ReadinessData | undefined;
  streak: number;
}

export default function SummaryStoryModal({ open, onClose, weeklySummaries, readiness, streak }: SummaryStoryModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
      setProgress(0);
    }
  }, [open]);

  const goNext = useCallback(() => {
    setCurrentSlide((s) => (s + 1) % TOTAL_SLIDES);
    setProgress(0);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentSlide((s) => (s - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
    setProgress(0);
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!open || paused) return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= TICKS_PER_SLIDE) {
          setCurrentSlide((s) => (s + 1) % TOTAL_SLIDES);
          return 0;
        }
        return p + 1;
      });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [open, paused, currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, goNext, goPrev]);

  const btnSx = {
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 20,
    color: 'white',
    bgcolor: 'rgba(0,0,0,0.35)',
    '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: 'transparent',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          borderRadius: 4,
          height: { xs: '80vh', sm: '85vh' },
          maxHeight: 700,
        },
      }}
    >
      <Box
        sx={{ position: 'relative', height: '100%' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <StoryProgressBar
            total={TOTAL_SLIDES}
            current={currentSlide}
            progress={(progress / TICKS_PER_SLIDE) * 100}
          />
        </Box>

        <IconButton aria-label="Zamknij" onClick={onClose} size="small" sx={{ position: 'absolute', top: 10, right: 10, zIndex: 20, color: 'white', bgcolor: 'rgba(0,0,0,0.35)', '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>

        <Fade key={currentSlide} in timeout={300}>
          <Box sx={{ height: '100%' }}>
            <SummaryStoryContent
              slideIndex={currentSlide}
              weeklySummaries={weeklySummaries}
              readiness={readiness}
              streak={streak}
            />
          </Box>
        </Fade>

        <IconButton aria-label="Wstecz" onClick={goPrev} size="small" sx={{ ...btnSx, left: 8 }}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <IconButton aria-label="Dalej" onClick={goNext} size="small" sx={{ ...btnSx, right: 8 }}>
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>
    </Dialog>
  );
}
