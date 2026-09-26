
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { adminMessages } from '@/components/admin/messages';
import { useCreateEquipment, useDeleteEquipment, useEquipment, type Equipment } from '@/hooks/useEquipment';
import { localized } from '@/i18n';
import { Surface } from '@/ui';
import { STATUS_COLORS } from '@/utils/colors';

const TYPE_LABELS = localized({
  pl: {
    BIKE: 'Rower', CHAIN: 'Łańcuch', CASSETTE: 'Kaseta',
    TIRE: 'Opona', BRAKE_PAD: 'Klocki', CHAINRING: 'Tarcza',
    PEDAL: 'Pedały', BOTTOM_BRACKET: 'Suport', OTHER: 'Inne',
  },
  en: {
    BIKE: 'Bike', CHAIN: 'Chain', CASSETTE: 'Cassette',
    TIRE: 'Tyre', BRAKE_PAD: 'Brake pads', CHAINRING: 'Chainring',
    PEDAL: 'Pedals', BOTTOM_BRACKET: 'Bottom bracket', OTHER: 'Other',
  },
}) as Record<string, string>;

const EQUIP_TYPES = Object.keys(TYPE_LABELS);

export default function EquipmentList() {
  const t = adminMessages.useT();
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
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2
        }}>
        <Typography variant="subtitle2" sx={{
          fontWeight: 700
        }}>{t('equipment.title')}</Typography>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          {t('equipment.add')}
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
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>{t('equipment.empty')}</Typography>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('equipment.dialogTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label={t('equipment.fields.name')} size="small" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField select label={t('equipment.fields.type')} size="small" fullWidth value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {EQUIP_TYPES.map((type) => <MenuItem key={type} value={type}>{TYPE_LABELS[type]}</MenuItem>)}
            </TextField>
            <TextField label={t('equipment.fields.brand')} size="small" fullWidth value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <TextField label={t('equipment.fields.model')} size="small" fullWidth value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            <TextField label={t('equipment.fields.limit')} size="small" type="number" fullWidth value={form.replacementIntervalKm} onChange={(e) => setForm({ ...form, replacementIntervalKm: e.target.value })} placeholder={t('equipment.fields.limitPlaceholder')} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('equipment.cancel')}</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!form.name}>{t('equipment.add')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function EquipmentCard({ item, onDelete }: { item: Equipment; onDelete: () => void }) {
  const t = adminMessages.useT();
  const pct = item.usagePercent;
  const needsReplace = pct > 80;

  return (
    <Surface variant="outlined" padding="none" radius="panel" sx={{ p: 2 }}>
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1
          }}>
          <Stack direction="row" spacing={1} sx={{
            alignItems: "center"
          }}>
            <Typography variant="body2" sx={{
              fontWeight: 700
            }}>{item.name}</Typography>
            <Chip label={TYPE_LABELS[item.type] ?? item.type} size="small" variant="outlined" sx={{ fontSize: '0.6rem' }} />
          </Stack>
          <Button size="small" color="error" onClick={onDelete} sx={{ minWidth: 30, p: 0.5 }}>
            <DeleteIcon fontSize="small" />
          </Button>
        </Stack>

        {!!item.brand && (
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            {item.brand} {item.model}
          </Typography>
        )}

        <Box sx={{ mt: 1 }}>
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              mb: 0.5
            }}>
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>
              {item.totalKm.toFixed(0)} km
            </Typography>
            {!!item.replacementIntervalKm && (
              <Typography variant="caption" color={needsReplace ? 'error.main' : 'text.secondary'}>
                {t('equipment.limitLabel', { km: item.replacementIntervalKm })}
              </Typography>
            )}
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(pct, 100)}
            sx={{
              height: 6, borderRadius: 3,
              '& .MuiLinearProgress-bar': {
                bgcolor: needsReplace ? STATUS_COLORS.error : pct > 50 ? STATUS_COLORS.warning : STATUS_COLORS.success,
              },
            }}
          />
        </Box>

        {!!needsReplace && (
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 1, py: 0.5, '& .MuiAlert-message': { py: 0 } }}>
            <Typography variant="caption">{t('equipment.needsReplace', { percent: pct.toFixed(0) })}</Typography>
          </Alert>
        )}
    </Surface>
  );
}
