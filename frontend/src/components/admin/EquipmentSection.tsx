
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { useCreateEquipment, useDeleteEquipment, useEquipment, type Equipment } from '@/hooks/useEquipment';
import { STATUS_COLORS } from '@/utils/colors';

const TYPE_LABELS: Record<string, string> = {
  BIKE: 'Rower', CHAIN: 'Łańcuch', CASSETTE: 'Kaseta',
  TIRE: 'Opona', BRAKE_PAD: 'Klocki', CHAINRING: 'Tarcza',
  PEDAL: 'Pedały', BOTTOM_BRACKET: 'Suport', OTHER: 'Inne',
};

const EQUIP_TYPES = Object.keys(TYPE_LABELS);

export default function EquipmentList() {
  const { data: equipment, isLoading } = useEquipment();
  const createMutation = useCreateEquipment();
  const deleteMutation = useDeleteEquipment();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'BIKE', brand: '', model: '', replacementIntervalKm: '' });

  const handleCreate = () => {
    createMutation.mutate({
      name: form.name,
      type: form.type,
      brand: form.brand || undefined,
      model: form.model || undefined,
      replacementIntervalKm: form.replacementIntervalKm ? Number(form.replacementIntervalKm) : undefined,
    });
    setDialogOpen(false);
    setForm({ name: '', type: 'BIKE', brand: '', model: '', replacementIntervalKm: '' });
  };

  if (isLoading) return null;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={700}>Wyposażenie</Typography>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Dodaj
        </Button>
      </Stack>

      <Grid container spacing={1.5}>
        {equipment?.map((item) => (
          <Grid size={{ xs: 12, sm: 6 }} key={item.id}>
            <EquipmentCard item={item} onDelete={() => deleteMutation.mutate(item.id)} />
          </Grid>
        ))}
      </Grid>

      {(!equipment || equipment.length === 0) && (
        <Typography variant="body2" color="text.secondary">Brak wyposażenia. Dodaj swój pierwszy sprzęt.</Typography>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nowy sprzęt</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nazwa" size="small" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField select label="Typ" size="small" fullWidth value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {EQUIP_TYPES.map((t) => <MenuItem key={t} value={t}>{TYPE_LABELS[t]}</MenuItem>)}
            </TextField>
            <TextField label="Marka" size="small" fullWidth value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <TextField label="Model" size="small" fullWidth value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            <TextField label="Limit przebiegu (km)" size="small" type="number" fullWidth value={form.replacementIntervalKm} onChange={(e) => setForm({ ...form, replacementIntervalKm: e.target.value })} placeholder="np. 3000" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Anuluj</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!form.name}>Dodaj</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function EquipmentCard({ item, onDelete }: { item: Equipment; onDelete: () => void }) {
  const pct = item.usagePercent;
  const needsReplace = pct > 80;

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" fontWeight={700}>{item.name}</Typography>
            <Chip label={TYPE_LABELS[item.type] ?? item.type} size="small" variant="outlined" sx={{ fontSize: '0.6rem' }} />
          </Stack>
          <Button size="small" color="error" onClick={onDelete} sx={{ minWidth: 30, p: 0.5 }}>
            <DeleteIcon fontSize="small" />
          </Button>
        </Stack>

        {!!item.brand && (
          <Typography variant="caption" color="text.secondary">
            {item.brand} {item.model}
          </Typography>
        )}

        <Box sx={{ mt: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {item.totalKm.toFixed(0)} km
            </Typography>
            {!!item.replacementIntervalKm && (
              <Typography variant="caption" color={needsReplace ? 'error.main' : 'text.secondary'}>
                Limit: {item.replacementIntervalKm} km
              </Typography>
            )}
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(pct, 100)}
            sx={{
              height: 6, borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': {
                bgcolor: needsReplace ? STATUS_COLORS.error : pct > 50 ? STATUS_COLORS.warning : STATUS_COLORS.success,
              },
            }}
          />
        </Box>

        {!!needsReplace && (
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 1, py: 0.5, '& .MuiAlert-message': { py: 0 } }}>
            <Typography variant="caption">Czas na wymianę ({pct.toFixed(0)}% zużycia)</Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
