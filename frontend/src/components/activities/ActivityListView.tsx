import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  CardActionArea,
  Chip,
  Divider,
  LinearProgress,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { QueryBuilderMaterial } from '@react-querybuilder/material';
import { memo, useCallback } from 'react';
import QueryBuilder from 'react-querybuilder';

import 'react-querybuilder/dist/query-builder.css';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import {
  ACTIVITY_FILTER_FIELDS,
  ACTIVITY_NUMERIC_OPERATORS,
  SPORT_TYPES,
  type UseActivityFiltersResult,
} from '@/hooks/useActivityFilters';
import type { ActivitySummary, ActivitySummaryPage } from '@/types/activity';
import { COMMON_COLORS, STATUS_COLORS, alphaColor, getSportColor } from '@/utils/colors';
import { getApiErrorMessage } from '@/utils/errorHandling';
import { formatDistance, formatDuration } from '@/utils/formatters';

interface ActivityListViewProps {
  data: ActivitySummaryPage | undefined;
  error: unknown;
  filters: UseActivityFiltersResult;
  isFilterPending?: boolean;
  isLoading: boolean;
  onActivityClick: (id: string) => void;
  onRetry: () => void;
}

const ActivitySportChip = memo(function ActivitySportChip({ sportType }: { sportType: string }) {
  const sportColor = getSportColor(sportType);

  return (
    <Chip
      label={sportType}
      size="small"
      variant="outlined"
      sx={{
        color: sportColor,
        borderColor: `${sportColor}66`,
        bgcolor: `${sportColor}10`,
      }}
    />
  );
});

function formatActivityDate(startedAt: string): string {
  return new Date(startedAt).toLocaleDateString('pl-PL', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const ActivityMobileCard = memo(function ActivityMobileCard({
  activity,
  onActivityClick,
}: ActivityTableRowProps) {
  const sportColor = getSportColor(activity.sportType);
  const handleClick = useCallback(() => {
    onActivityClick(activity.id);
  }, [activity.id, onActivityClick]);

  return (
    <Paper
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${alphaColor(COMMON_COLORS.white, 0.08)}`,
      }}
    >
      <CardActionArea onClick={handleClick} sx={{ p: 1.75 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <ActivitySportChip sportType={activity.sportType} />
            <Typography variant="caption" color="text.secondary">
              {formatActivityDate(activity.startedAt)}
            </Typography>
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {activity.name}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              size="small"
              label={activity.distanceM != null ? formatDistance(activity.distanceM) : '-'}
              sx={{ bgcolor: alphaColor(sportColor, 0.12), color: sportColor }}
            />
            <Chip
              size="small"
              label={activity.movingTimeSec != null ? formatDuration(activity.movingTimeSec) : '-'}
              sx={{ bgcolor: alphaColor(COMMON_COLORS.white, 0.06) }}
            />
            {activity.avgHeartrate != null ? (
              <Chip size="small" label={`${activity.avgHeartrate} bpm`} sx={{ bgcolor: alphaColor('#F85149', 0.12), color: '#F85149' }} />
            ) : null}
            {activity.avgPowerW != null ? (
              <Chip size="small" label={`${activity.avgPowerW} W`} sx={{ bgcolor: alphaColor('#D29922', 0.12), color: '#D29922' }} />
            ) : null}
            {activity.primaryBenefit ? (
              <Chip size="small" label={activity.primaryBenefit} sx={{
                fontWeight: 700, fontSize: '0.65rem',
                bgcolor: alphaColor(STATUS_COLORS.accent, 0.12), color: STATUS_COLORS.accent,
              }} />
            ) : null}
          </Stack>
        </Stack>
      </CardActionArea>
    </Paper>
  );
});

interface ActivityTableRowProps {
  activity: ActivitySummary;
  onActivityClick: (id: string) => void;
}

const ActivityTableRow = memo(function ActivityTableRow({
  activity,
  onActivityClick,
}: ActivityTableRowProps) {
  const handleClick = useCallback(() => {
    onActivityClick(activity.id);
  }, [activity.id, onActivityClick]);

  return (
    <TableRow hover sx={{ cursor: 'pointer' }} onClick={handleClick}>
      <TableCell>{new Date(activity.startedAt).toLocaleDateString('pl-PL')}</TableCell>
      <TableCell>{activity.name}</TableCell>
      <TableCell>
        <ActivitySportChip sportType={activity.sportType} />
      </TableCell>
      <TableCell align="right">
        {activity.distanceM != null ? formatDistance(activity.distanceM) : '-'}
      </TableCell>
      <TableCell align="right">
        {activity.movingTimeSec != null ? formatDuration(activity.movingTimeSec) : '-'}
      </TableCell>
      <TableCell align="right">
        {activity.avgHeartrate != null ? `${activity.avgHeartrate} bpm` : '-'}
      </TableCell>
      <TableCell align="right">
        {activity.avgPowerW != null ? `${activity.avgPowerW} W` : '-'}
      </TableCell>
    </TableRow>
  );
});

export default function ActivityListView({
  data,
  error,
  filters,
  isFilterPending = false,
  isLoading,
  onActivityClick,
  onRetry,
}: ActivityListViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const hasRows = (data?.items.length ?? 0) > 0;
  const hasAppliedFilters = Object.keys(filters.appliedFilters).length > 0;
  const hasError = Boolean(error);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, border: `1px solid ${alphaColor(COMMON_COLORS.white, 0.08)}` }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: filters.showBuilder ? 2 : 0 }}>
          <TextField
            select
            label="Typ sportu"
            value={filters.sportType}
            onChange={(event) => filters.setSportType(event.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Wszystkie</MenuItem>
            {SPORT_TYPES.map((sportType) => (
              <MenuItem key={sportType} value={sportType}>
                {sportType}
              </MenuItem>
            ))}
          </TextField>

          <Button
            startIcon={<FilterListIcon />}
            variant={filters.showBuilder ? 'contained' : 'outlined'}
            onClick={() => filters.setShowBuilder(!filters.showBuilder)}
            size="small"
            color={filters.activeFilterCount > 0 ? 'warning' : 'primary'}
          >
            Filtry{filters.activeFilterCount > 0 ? ` (${filters.activeFilterCount})` : ''}
          </Button>

          {filters.activeFilterCount > 0 && (
            <Button
              startIcon={<ClearIcon />}
              onClick={filters.clearFilters}
              size="small"
              color="error"
              variant="text"
            >
              Wyczyść
            </Button>
          )}
        </Stack>

        {!!filters.showBuilder && <>
            <Divider sx={{ mb: 2, borderColor: alphaColor(COMMON_COLORS.white, 0.08) }} />
            <Box
              sx={{
                '& .queryBuilder': { fontFamily: 'inherit' },
                '& .ruleGroup': {
                  bgcolor: alphaColor(COMMON_COLORS.white, 0.03),
                  border: `1px solid ${alphaColor(COMMON_COLORS.white, 0.1)}`,
                  borderRadius: 1.5,
                  p: 1.5,
                },
                '& .rule': { display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 },
              }}
            >
              <QueryBuilderMaterial>
                <QueryBuilder
                  fields={ACTIVITY_FILTER_FIELDS}
                  query={filters.query}
                  onQueryChange={filters.setQuery}
                  operators={ACTIVITY_NUMERIC_OPERATORS}
                  controlClassnames={{ queryBuilder: 'queryBuilder' }}
                />
              </QueryBuilderMaterial>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
              <Button startIcon={<SearchIcon />} variant="contained" onClick={filters.applyFilters} size="small">
                Szukaj
              </Button>
            </Box>
          </>}

        {!!isFilterPending && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Aktualizowanie wyników…
            </Typography>
            <LinearProgress
                color="inherit"
                sx={{
                  height: 4,
                  borderRadius: 999,
                  bgcolor: alphaColor(COMMON_COLORS.white, 0.08),
                }}
              />
          </Box>
        )}
      </Paper>

      {!!hasAppliedFilters && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {filters.query.rules
            .filter((rule): rule is Extract<typeof rule, { field: string }> => 'field' in rule)
            .map((rule) => (
              <Chip
                key={`${rule.field}-${rule.operator}-${String(rule.value)}`}
                label={`${ACTIVITY_FILTER_FIELDS.find((field) => field.name === rule.field)?.label ?? rule.field} ${rule.operator} ${rule.value}`}
                size="small"
                color="warning"
                variant="outlined"
              />
            ))}
        </Stack>
      )}

      {!!isLoading && <LoadingState message="Ładowanie listy aktywności…" />}

      {!isLoading && !!hasError && (
        <ErrorState
          message={getApiErrorMessage(error, 'Nie udało się załadować listy aktywności.')}
          onRetry={onRetry}
        />
      )}

      {!isLoading && !hasError && !hasRows && (
        <EmptyState
          title="Brak aktywności"
          description="Żadna aktywność nie spełnia wybranych kryteriów."
          illustration="/illustrations/empty-activities.png"
          action={
            filters.activeFilterCount > 0
              ? { label: 'Wyczyść filtry', onClick: filters.clearFilters }
              : undefined
          }
        />
      )}

      {!!hasRows && (
        <>
          {isMobile ? (
            <Stack spacing={1.5}>
              {data?.items.map((activity) => (
                <ActivityMobileCard
                  key={activity.id}
                  activity={activity}
                  onActivityClick={onActivityClick}
                />
              ))}
            </Stack>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Nazwa</TableCell>
                    <TableCell>Typ</TableCell>
                    <TableCell align="right">Dystans</TableCell>
                    <TableCell align="right">Czas</TableCell>
                    <TableCell align="right">HR</TableCell>
                    <TableCell align="right">Moc</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.items.map((activity) => (
                    <ActivityTableRow
                      key={activity.id}
                      activity={activity}
                      onActivityClick={onActivityClick}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Łącznie: {data?.total ?? 0} aktywności
            </Typography>
            <Pagination
              count={data?.totalPages ?? 1}
              page={filters.page + 1}
              onChange={(_, page) => filters.setPage(page - 1)}
              color="primary"
              size="small"
            />
          </Box>
        </>
      )}
    </Box>
  );
}
