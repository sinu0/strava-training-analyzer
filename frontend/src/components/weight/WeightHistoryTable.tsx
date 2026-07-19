import { Box, Grid, Pagination, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import Section from '@/components/common/Section';
import type { WeightRecord } from '@/types/weight';

interface WeightHistoryTableProps {
  history: WeightRecord[];
}

export default function WeightHistoryTable({
  history,
}: WeightHistoryTableProps) {
  const [page, setPage] = useState(1);

  const reversedHistory = useMemo(() => [...history].reverse(), [history]);

  if (history.length === 0) {
    return null;
  }

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(reversedHistory.length / pageSize));
  const pageItems = reversedHistory.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Grid size={12}>
      <Section title="Pomiary">
        <Stack spacing={2}>
          <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {pageItems.map((record) => (
              <Box
                key={record.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1.1,
                  px: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { border: 0 },
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {Number(record.weightKg).toFixed(1)} kg
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(record.recordedDate).toLocaleDateString('pl-PL', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {!!record.notes && ` — ${record.notes}`}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
          {pageCount > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1.5,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Strona {page} z {pageCount}
              </Typography>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, nextPage) => setPage(nextPage)}
                size="small"
                color="primary"
              />
            </Box>
          )}
        </Stack>
      </Section>
    </Grid>
  );
}
