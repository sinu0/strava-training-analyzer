import { Star } from '@mui/icons-material';
import {
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import type { SessionOptionDto } from '@/types/adaptiveCoach';
import { STATUS_COLORS } from '@/utils/colors';

interface Props {
  sessions: SessionOptionDto[];
  bestSessionType: string;
  onSelect?: (session: SessionOptionDto) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: STATUS_COLORS.success,
  MODERATE: STATUS_COLORS.info,
  HARD: STATUS_COLORS.warning,
  VERY_HARD: STATUS_COLORS.error,
  MAXIMAL: STATUS_COLORS.error,
};

export default function SessionOptionsList({ sessions, bestSessionType, onSelect }: Props) {
  if (!sessions || sessions.length === 0) return null;

  return (
    <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Typ</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Czas</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>TSS</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trudność</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Wynik</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => {
              const isBest = session.type === bestSessionType;
              return (
                <TableRow
                  key={session.type}
                  hover
                  onClick={() => onSelect?.(session)}
                  sx={{
                    cursor: onSelect ? 'pointer' : 'default',
                    bgcolor: isBest ? 'tokens.activeOverlay' : 'transparent',
                    '&:hover': { bgcolor: 'tokens.hoverOverlay' },
                  }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {!!isBest && <Star sx={{ color: STATUS_COLORS.warning, fontSize: 16 }} />}
                      <Typography variant="body2" fontWeight={isBest ? 600 : 400}>
                        {session.type}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{session.durationMinutes} min</TableCell>
                  <TableCell>~{Math.round(session.targetTss)}</TableCell>
                  <TableCell>
                    <Chip
                      label={session.difficulty}
                      size="small"
                      sx={{
                        bgcolor: `${DIFFICULTY_COLORS[session.difficulty] || STATUS_COLORS.info}22`,
                        color: DIFFICULTY_COLORS[session.difficulty] || STATUS_COLORS.info,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={session.score >= 0.3 ? 'success.main' : session.score >= 0.1 ? 'warning.main' : 'text.secondary'}
                    >
                      {session.score.toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
