import {
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Chip,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Stack,
  IconButton,
} from '@mui/material';
import { useState } from 'react';

import ConfidenceBreakdownChart from '@/components/ai-v2/ConfidenceBreakdownChart';
import {
  PREDICTION_TYPE_V2_LABELS,
  PREDICTION_TYPE_V2_COLORS,
} from '@/types/aiV2';
import { COMMON_COLORS, STATUS_COLORS } from '@/utils/colors';

import type {
  PredictionResponseV2,
  WorkoutInterval,
} from '@/types/aiV2';

interface PredictionResultCardV2Props {
  prediction: PredictionResponseV2;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.75) return STATUS_COLORS.success;
  if (confidence >= 0.5) return STATUS_COLORS.warning;
  return STATUS_COLORS.error;
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'Bardzo wysoka';
  if (confidence >= 0.7) return 'Wysoka';
  if (confidence >= 0.5) return 'Średnia';
  if (confidence >= 0.3) return 'Niska';
  return 'Bardzo niska';
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}min`;
}

export default function PredictionResultCardV2({ prediction }: PredictionResultCardV2Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showToolLog, setShowToolLog] = useState(false);
  const [showWorkout, setShowWorkout] = useState(false);

  const typeKey = prediction.type;
  const label = PREDICTION_TYPE_V2_LABELS[typeKey] ?? prediction.type;
  const color = PREDICTION_TYPE_V2_COLORS[typeKey] ?? STATUS_COLORS.info;
  const confidenceColor = getConfidenceColor(prediction.confidence);
  const confidencePct = Math.round(prediction.confidence * 100);

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Chip
          label={label}
          size="small"
          sx={{ bgcolor: color, color: COMMON_COLORS.white, fontWeight: 600 }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={prediction.providerName} size="small" variant="outlined" />
          <Chip label={prediction.modelId} size="small" variant="outlined" />
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            {new Date(prediction.createdAt).toLocaleString('pl-PL')}
          </Typography>
        </Box>
      </Box>

      {/* Summary */}
      <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
        {prediction.summary}
      </Typography>

      {/* Confidence */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Pewność predykcji
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: confidenceColor, fontWeight: 600 }}>
              {confidencePct}% — {getConfidenceLabel(prediction.confidence)}
            </Typography>
            {prediction.confidenceBreakdown && (
              <IconButton
                size="small"
                onClick={() => setShowBreakdown(!showBreakdown)}
                sx={{ p: 0.25 }}
              >
                {showBreakdown ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            )}
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={confidencePct}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { bgcolor: confidenceColor, borderRadius: 4 },
          }}
        />
      </Box>

      {/* Confidence Breakdown */}
      {prediction.confidenceBreakdown && (
        <Collapse in={showBreakdown}>
          <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Składniki pewności
            </Typography>
            <ConfidenceBreakdownChart breakdown={prediction.confidenceBreakdown} variant="bars" />
          </Box>
        </Collapse>
      )}

      {/* Insight */}
      {prediction.insight && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {prediction.insight}
          </Typography>
        </>
      )}

      {/* Action */}
      {prediction.action && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: STATUS_COLORS.accent,
              bgcolor: `${STATUS_COLORS.accent}14`,
            }}
          >
            <Typography variant="caption" sx={{ color: STATUS_COLORS.accent, fontWeight: 600, textTransform: 'uppercase' }}>
              Rekomendowana akcja
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
              {prediction.action}
            </Typography>
          </Box>
        </>
      )}

      {/* Metrics */}
      {prediction.metrics && Object.keys(prediction.metrics).length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(prediction.metrics).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key}: ${value}`}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        </>
      )}

      {/* Warnings */}
      {prediction.warnings && prediction.warnings.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {prediction.warnings.map((warning, i) => (
            <Alert key={i} severity="warning" variant="outlined" sx={{ py: 0 }}>
              {warning}
            </Alert>
          ))}
        </Box>
      )}

      {/* Alternatives */}
      {prediction.alternatives && prediction.alternatives.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Accordion
            expanded={showAlternatives}
            onChange={() => setShowAlternatives(!showAlternatives)}
            sx={{
              bgcolor: 'transparent',
              boxShadow: 'none',
              '&:before': { display: 'none' },
            }}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ p: 0, minHeight: 36 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Alternatywne scenariusze ({prediction.alternatives.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, pt: 1 }}>
              <Stack spacing={1}>
                {prediction.alternatives.map((alt, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {alt.scenario}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alt.action}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </>
      )}

      {/* Structured Workout */}
      {prediction.structuredWorkout && (
        <>
          <Divider sx={{ my: 2 }} />
          <Accordion
            expanded={showWorkout}
            onChange={() => setShowWorkout(!showWorkout)}
            sx={{
              bgcolor: 'transparent',
              boxShadow: 'none',
              '&:before': { display: 'none' },
            }}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ p: 0, minHeight: 36 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Trening strukturalny — {prediction.structuredWorkout.type} ({prediction.structuredWorkout.totalDurationMin} min)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, pt: 1 }}>
              <Stack spacing={1.5}>
                {prediction.structuredWorkout.warmupDescription && (
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${STATUS_COLORS.info}14`, border: `1px solid ${STATUS_COLORS.info}33` }}>
                    <Typography variant="caption" sx={{ color: STATUS_COLORS.info, fontWeight: 600 }}>
                      Rozgrzewka
                    </Typography>
                    <Typography variant="body2">{prediction.structuredWorkout.warmupDescription}</Typography>
                  </Box>
                )}

                {prediction.structuredWorkout.intervals.map((interval: WorkoutInterval, i: number) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Box sx={{ minWidth: 56, textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: STATUS_COLORS.accent, fontWeight: 700 }}>
                        {interval.durationSec}s
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {interval.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25 }}>
                        <Typography variant="caption" color="text.secondary">
                          Moc: {interval.powerTarget}
                        </Typography>
                        {interval.cadence && (
                          <Typography variant="caption" color="text.secondary">
                            Kadencja: {interval.cadence}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}

                {prediction.structuredWorkout.cooldownDescription && (
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${STATUS_COLORS.secondary}14`, border: `1px solid ${STATUS_COLORS.secondary}33` }}>
                    <Typography variant="caption" sx={{ color: STATUS_COLORS.secondary, fontWeight: 600 }}>
                      Schłodzenie
                    </Typography>
                    <Typography variant="body2">{prediction.structuredWorkout.cooldownDescription}</Typography>
                  </Box>
                )}

                {prediction.structuredWorkout.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {prediction.structuredWorkout.notes}
                  </Typography>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </>
      )}

      {/* References */}
      {prediction.references && prediction.references.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Źródła
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {prediction.references.map((ref, i) => (
              <Chip
                key={i}
                label={ref}
                size="small"
                sx={{ fontSize: '0.65rem', fontFamily: 'monospace' }}
              />
            ))}
          </Box>
        </>
      )}

      {/* Tool Call Log */}
      {prediction.toolCallLog && prediction.toolCallLog.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Accordion
            expanded={showToolLog}
            onChange={() => setShowToolLog(!showToolLog)}
            sx={{
              bgcolor: 'transparent',
              boxShadow: 'none',
              '&:before': { display: 'none' },
            }}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ p: 0, minHeight: 36 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Wywołania narzędzi ({prediction.toolCallLog.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, pt: 1 }}>
              <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Narzędzie</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Wynik</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">Czas</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prediction.toolCallLog.map((entry, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                          {entry.toolName}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', maxWidth: 240 }}>
                          <Tooltip title={entry.resultSummary} arrow>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 220,
                                fontSize: '0.7rem',
                              }}
                            >
                              {entry.resultSummary}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                          {formatDuration(entry.durationMs)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={entry.error ? 'Błąd' : 'OK'}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.6rem',
                              bgcolor: entry.error ? STATUS_COLORS.error : STATUS_COLORS.success,
                              color: COMMON_COLORS.white,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Tokens + Duration summary */}
              {(prediction.tokensUsed > 0 || prediction.durationMs > 0) && (
                <Box sx={{ display: 'flex', gap: 2, mt: 1.5, justifyContent: 'flex-end' }}>
                  {prediction.tokensUsed > 0 && (
                    <Chip
                      label={`${prediction.tokensUsed.toLocaleString()} tokenów`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {prediction.durationMs > 0 && (
                    <Chip
                      label={formatDuration(prediction.durationMs)}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </>
      )}

      {/* Reasoning */}
      {prediction.reasoning && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Rozumowanie
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem' }}>
            {prediction.reasoning}
          </Typography>
        </>
      )}
    </Box>
  );
}
