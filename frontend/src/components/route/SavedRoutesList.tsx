import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { List, ListItemButton, ListItemText, IconButton, Chip, Stack } from '@mui/material';

import EmptyState from '@/components/common/EmptyState';

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
  if (routes.length === 0) {
    return (
      <EmptyState
        title="Brak zapisanych tras"
        description="Zaplanuj trasę, aby ją tu zobaczyć."
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
            secondaryTypographyProps={{ component: 'div' }}
            secondary={
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip label={formatDistance(route.totalDistanceM)} size="small" variant="outlined" />
                <Chip label={`↑ ${Math.round(route.totalElevationGainM)} m`} size="small" variant="outlined" />
                <Chip label={formatDuration(route.estimatedTimeSec)} size="small" variant="outlined" />
                <Chip label={`TSS ${route.estimatedTss}`} size="small" variant="outlined" />
              </Stack>
            }
          />
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onExportGpx(route.id); }} title="Pobierz GPX">
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(route.id); }} title="Usuń">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </ListItemButton>
      ))}
    </List>
  );
}
