
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import { searchGeocodingLocations, type GeocodingResult } from '@/api/externalApis';
import { useDebounce } from '@/hooks/useDebounce';
import type { WeatherLocation } from '@/types/analytics';
import {
  CHART_COLORS,
  STATUS_COLORS,
  alphaColor,
} from '@/utils/colors';

interface WeatherLocationMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  locations: WeatherLocation[] | undefined;
  activeLocationName?: string;
  onClose: () => void;
  onActivateLocation: (name: string) => void;
  onAddLocation: (name: string, lat: number, lon: number) => void;
  onDeleteLocation: (name: string) => void;
  onRefresh: (location: string) => void;
}

export default function WeatherLocationMenu({
  anchorEl,
  open,
  locations,
  activeLocationName,
  onClose,
  onActivateLocation,
  onAddLocation,
  onDeleteLocation,
  onRefresh,
}: WeatherLocationMenuProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 400);

  const resetSearchState = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearching(false);
  }, []);

  const handleClose = useCallback(() => {
    setShowAddForm(false);
    resetSearchState();
    onClose();
  }, [onClose, resetSearchState]);

  const handleSelectResult = useCallback(
    (result: GeocodingResult) => {
      onAddLocation(result.name, result.latitude, result.longitude);
      handleClose();
    },
    [handleClose, onAddLocation],
  );

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      return;
    }

    setSearchResults([]);
    setSearching(false);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearchQuery.length < 2) {
      return;
    }

    const abortController = new AbortController();

    const loadResults = async () => {
      setSearching(true);
      try {
        const results = await searchGeocodingLocations(
          debouncedSearchQuery,
          abortController.signal,
        );
        if (!abortController.signal.aborted) {
          setSearchResults(results);
        }
      } catch {
        if (!abortController.signal.aborted) {
          setSearchResults([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setSearching(false);
        }
      }
    };

    void loadResults();

    return () => {
      abortController.abort();
    };
  }, [debouncedSearchQuery]);

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      transitionDuration={0}
      slotProps={{
        paper: {
          sx: { bgcolor: CHART_COLORS.tooltip, border: `1px solid ${CHART_COLORS.grid}`, minWidth: 300 },
        },
      }}
    >
      <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', fontWeight: 700 }}>
        LOKALIZACJE
      </Typography>

      {locations?.map((location) => (
        <MenuItem
          key={location.id}
          onClick={() => {
            onActivateLocation(location.name);
            handleClose();
          }}
          sx={{ py: 0.5 }}
        >
          <ListItemIcon>
            {location.active ? (
              <CheckIcon sx={{ color: STATUS_COLORS.success, fontSize: 18 }} />
            ) : (
              <LocationOnIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
            )}
          </ListItemIcon>
          <ListItemText
            primary={location.name}
            primaryTypographyProps={{ variant: 'body2', fontWeight: location.active ? 700 : 400 }}
          />
          <IconButton
            aria-label={`Usuń lokalizację ${location.name}`}
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteLocation(location.name);
            }}
            sx={{ color: 'text.secondary', '&:hover': { color: STATUS_COLORS.error } }}
          >
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </MenuItem>
      ))}

      <Divider sx={{ borderColor: CHART_COLORS.grid, my: 0.5 }} />

      {!showAddForm ? (
        <MenuItem onClick={() => setShowAddForm(true)}>
          <ListItemIcon>
            <LocationOnIcon sx={{ color: CHART_COLORS.primary, fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Dodaj lokalizację"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </MenuItem>
      ) : (
        <Box sx={{ px: 2, py: 1 }}>
          <TextField
            size="small"
            placeholder="Wyszukaj miejscowość..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            fullWidth
            autoFocus
            InputProps={{
              endAdornment: searching ? <CircularProgress size={16} /> : null,
            }}
            sx={{ mb: 0.5 }}
          />
          {searchResults.length > 0 && (
            <List dense sx={{ py: 0, maxHeight: 200, overflow: 'auto' }}>
              {searchResults.map((result) => (
                <ListItemButton
                  key={`${result.name}-${result.latitude}-${result.longitude}`}
                  onClick={() => handleSelectResult(result)}
                  sx={{
                    borderRadius: 1,
                    py: 0.5,
                    '&:hover': { bgcolor: alphaColor(CHART_COLORS.primary, 0.1) },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: CHART_COLORS.secondary }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={result.name}
                    secondary={[result.admin1, result.country].filter(Boolean).join(', ')}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.65rem' } }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
          {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center', py: 1 }}
            >
              Brak wyników
            </Typography>
          )}
          <Button
            size="small"
            onClick={() => {
              setShowAddForm(false);
              resetSearchState();
            }}
            fullWidth
            sx={{ textTransform: 'none', color: 'text.secondary', mt: 0.5 }}
          >
            Anuluj
          </Button>
        </Box>
      )}

      <Divider sx={{ borderColor: CHART_COLORS.grid, my: 0.5 }} />
      <MenuItem
        onClick={() => {
          if (activeLocationName) {
            onRefresh(activeLocationName);
          }
          handleClose();
        }}
      >
        <ListItemIcon>
          <RefreshIcon sx={{ color: STATUS_COLORS.info, fontSize: 18 }} />
        </ListItemIcon>
        <ListItemText primary="Odśwież dane" primaryTypographyProps={{ variant: 'body2' }} />
      </MenuItem>
    </Menu>
  );
}
