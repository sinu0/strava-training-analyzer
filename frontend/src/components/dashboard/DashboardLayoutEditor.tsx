import { useState, useCallback } from 'react';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  Typography,
} from '@mui/material';

export interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'weather', label: 'Pogoda', visible: true },
  { id: 'readiness', label: 'Gotowość', visible: true },
  { id: 'recovery', label: 'Regeneracja', visible: true },
  { id: 'journal', label: 'Dziennik', visible: true },
  { id: 'challenge', label: 'Wyzwanie', visible: true },
  { id: 'event', label: 'Wydarzenia', visible: true },
];

const STORAGE_KEY = 'dashboard-widgets-v1';

function loadWidgets(): WidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...DEFAULT_WIDGETS];
}

function saveWidgets(widgets: WidgetConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadWidgets);

  const toggle = useCallback((id: string) => {
    setWidgets((prev) => {
      const next = prev.map((w) => w.id === id ? { ...w, visible: !w.visible } : w);
      saveWidgets(next);
      return next;
    });
  }, []);

  const moveUp = useCallback((index: number) => {
    setWidgets((prev) => {
      if (index <= 0) return prev;
      const next = [...prev];
      const tmp = next[index]!;
      next[index] = next[index - 1]!;
      next[index - 1] = tmp;
      saveWidgets(next);
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setWidgets((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      const tmp = next[index]!;
      next[index] = next[index + 1]!;
      next[index + 1] = tmp;
      saveWidgets(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setWidgets([...DEFAULT_WIDGETS]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { widgets, toggle, moveUp, moveDown, reset };
}

interface DashboardLayoutEditorProps {
  open: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onToggle: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onReset: () => void;
}

export default function DashboardLayoutEditor({
  open, onClose, widgets, onToggle, onMoveUp, onMoveDown, onReset,
}: DashboardLayoutEditorProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Ustawienia dashboardu</DialogTitle>
      <DialogContent>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
          Pokaż/ukryj i zmień kolejność widgetów w lewym panelu.
        </Typography>
        <Stack spacing={0.5}>
          {widgets.map((w, i) => (
            <Box
              key={w.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 2,
                bgcolor: w.visible ? 'rgba(255,255,255,0.04)' : 'transparent',
                opacity: w.visible ? 1 : 0.5,
              }}
            >
              <Switch size="small" checked={w.visible} onChange={() => onToggle(w.id)} />
              <Typography variant="body2" sx={{ flex: 1 }}>{w.label}</Typography>
              <IconButton size="small" disabled={i === 0} onClick={() => onMoveUp(i)}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" disabled={i === widgets.length - 1} onClick={() => onMoveDown(i)}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onReset} color="error">Resetuj</Button>
        <Button onClick={onClose}>Zamknij</Button>
      </DialogActions>
    </Dialog>
  );
}
