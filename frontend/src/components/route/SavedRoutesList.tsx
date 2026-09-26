import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { List, ListItemButton, ListItemText, IconButton, Chip, Stack } from '@mui/material';


import { routePlannerControlsMessages } from '@/components/route-planner/messages';
import { EmptyState } from '@/ui';

import { STATUS_COLORS, alphaColor } from '../../utils/colors';

import type { PlannedRoute } from '../../types/route';

interface SavedRoutesListProps {
  routes: PlannedRoute[];
  selectedId?: string | null;
  onSelect: (route: PlannedRoute) => void;
  onDelete: (id: string) => void;
  onExportGpx: (id: string) => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}min`;
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function SavedRoutesList({
  routes,
  selectedId,
  onSelect,
  onDelete,
  onExportGpx,
}: SavedRoutesListProps) {
  const t = routePlannerControlsMessages.useT();
  if (routes.length === 0) {
    return (
      <EmptyState
        title={t('savedRoutes.emptyTitle')}
        description={t('savedRoutes.emptyDescription')}
      />
    );
  }

  return (
    <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
      {routes.map((route) => (
        <ListItemButton
          key={route.id}
          selected={route.id === selectedId}
          onClick={() => onSelect(route)}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            '&.Mui-selected': { backgroundColor: alphaColor(STATUS_COLORS.info, 0.12) },
          }}
        >
          <ListItemText
            primary={route.name}
            secondary={
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip label={formatDistance(route.totalDistanceM)} size="small" variant="outlined" />
                <Chip label={`↑ ${Math.round(route.totalElevationGainM)} m`} size="small" variant="outlined" />
                <Chip label={formatDuration(route.estimatedTimeSec)} size="small" variant="outlined" />
                <Chip label={`TSS ${route.estimatedTss}`} size="small" variant="outlined" />
              </Stack>
            }
            slotProps={{
              secondary: { component: 'div' }
            }}
          />
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onExportGpx(route.id); }} title={t('savedRoutes.downloadGpx')}>
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(route.id); }} title={t('savedRoutes.delete')}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </ListItemButton>
      ))}
    </List>
  );
}
