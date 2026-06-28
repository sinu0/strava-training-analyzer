import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputLabel, MenuItem, Paper, Select,
  Stack, TextField, Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TrainingEvent, EventProjection } from '@/types/event';
import { EVENT_PRIORITY_LABELS, EVENT_TYPE_LABELS } from '@/types/event';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';

interface EventCountdownProps {
  events: TrainingEvent[] | undefined;
  onCreate: (e: { name: string; eventDate: string; type: string; priority: string }) => void;
  onDelete: (id: string) => void;
  ctlValue: number | null;
  projection: EventProjection | null | undefined;
}

function CountdownBadge({ event, ctl }: { event: TrainingEvent; ctl: number | null }) {
  const eventDate = new Date(event.eventDate);
  const now = new Date();
  const daysLeft = Math.ceil((eventDate.getTime() - now.getTime()) / 86400000);
  const isPast = daysLeft < 0;

  const priorityColor = event.priority === 'A' ? STATUS_COLORS.error :
    event.priority === 'B' ? STATUS_COLORS.warning : STATUS_COLORS.info;

  return (
    <Box>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <EmojiEventsIcon sx={{ color: priorityColor, fontSize: 16 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: priorityColor }}>
          {event.name}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
        <Chip
          label={isPast ? 'Zakonczony' : `${daysLeft} dni`}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.65rem',
            height: 20,
            bgcolor: isPast ? 'rgba(255,255,255,0.04)' : `${priorityColor}20`,
            color: isPast ? 'text.secondary' : priorityColor,
          }}
        />
        {!isPast && ctl != null && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            CTL: {ctl.toFixed(0)}
          </Typography>
        )}
        {!isPast && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            priorytet {event.priority}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

export default function EventCountdownWidget({
  events, onCreate, onDelete, ctlValue, projection,
}: EventCountdownProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('ROAD_RACE');
  const [priority, setPriority] = useState('B');

  const activeEvents = events?.filter(e => e.active).slice(0, 3) ?? [];
  const nearestEvent = activeEvents[0] ?? null;
  const daysToNearest = nearestEvent
    ? Math.ceil((new Date(nearestEvent.eventDate).getTime() - Date.now()) / 86400000)
    : null;

  const needsTaper = daysToNearest != null && daysToNearest > 0 && daysToNearest <= 21 &&
    (projection?.taperStartDays ?? 0) <= daysToNearest;

  const handleCreate = () => {
    if (name && date) {
      onCreate({ name, eventDate: date, type, priority });
      setDialogOpen(false);
      setName('');
      setDate('');
    }
  };

  return (
    <>
      <Paper
        sx={{
          p: 1.75,
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(255,255,255,0.02)',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: activeEvents.length > 0 ? 1 : 0 }}>
          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.06em', fontSize: '0.6rem' }}>
            Wydarzenia
          </Typography>
          <IconButton size="small" onClick={() => setDialogOpen(true)} sx={{ color: 'text.secondary' }}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Stack>

        {activeEvents.length > 0 ? (
          <Stack spacing={1}>
            {activeEvents.map((e) => (
              <Box key={e.id} sx={{ position: 'relative' }}>
                <CountdownBadge event={e} ctl={ctlValue} />
                <IconButton
                  size="small"
                  onClick={() => onDelete(e.id)}
                  sx={{ position: 'absolute', top: -4, right: -4, color: 'text.disabled', '&:hover': { color: STATUS_COLORS.error } }}
                >
                  <Typography sx={{ fontSize: '0.55rem' }}>✕</Typography>
                </IconButton>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            Brak zaplanowanych wydarzen. Kliknij + aby dodac.
          </Typography>
        )}

        {needsTaper && (
          <Box sx={{
            mt: 1.5, p: 1, borderRadius: 1.5,
            bgcolor: alphaColor(STATUS_COLORS.warning, 0.08),
            border: `1px solid ${alphaColor(STATUS_COLORS.warning, 0.2)}`,
          }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: STATUS_COLORS.warning, fontSize: '0.58rem', display: 'block', mb: 0.5 }}>
              CZAS NA TAPER
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', display: 'block', mb: 0.75 }}>
              {daysToNearest} dni do {nearestEvent?.name}. Rozwaz otwarcie Plan Buildera.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CalendarMonthIcon sx={{ fontSize: 14 }} />}
              onClick={() => navigate('/training')}
              sx={{ fontSize: '0.6rem', minHeight: 24, py: 0 }}
            >
              Plan Builder
            </Button>
          </Box>
        )}

        {projection && projection.daysToEvent > 0 && (
          <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.55rem', display: 'block', mb: 0.5 }}>
              PROJEKCJA
            </Typography>
            <Stack spacing={0.3}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>CTL dzis → event</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 700 }}>
                  {projection.currentCtl.toFixed(0)} → {projection.projectedCtl.toFixed(0)}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ fontSize: '0.55rem', color: STATUS_COLORS.info }}>
                {projection.suggestedTaper}
              </Typography>
            </Stack>
          </Box>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Dodaj wydarzenie</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nazwa" value={name} onChange={(e) => setName(e.target.value)} fullWidth size="small" placeholder="np. Maraton Karkonoski" />
            <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <FormControl fullWidth size="small">
              <InputLabel>Typ</InputLabel>
              <Select value={type} label="Typ" onChange={(e) => setType(e.target.value)}>
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Priorytet</InputLabel>
              <Select value={priority} label="Priorytet" onChange={(e) => setPriority(e.target.value)}>
                {Object.entries(EVENT_PRIORITY_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Anuluj</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name || !date}>Dodaj</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
