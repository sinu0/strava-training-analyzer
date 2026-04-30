import HistoryIcon from '@mui/icons-material/History';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
  Box,
  Alert,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useState } from 'react';

import AiStatusWidget from '../components/AiStatusWidget';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/common/PageContainer';
import Section from '../components/common/Section';
import TabsNav from '../components/common/TabsNav';
import PredictionResultCard from '../components/PredictionResultCard';
import { useAiStatus, useAiPredict, useAiHistory } from '../hooks/useAi';
import { PREDICTION_TYPE_LABELS, PREDICTION_TYPE_COLORS } from '../types/ai';

import type { PredictionType, PredictionResponse } from '../types/ai';

const PREDICTION_TYPES: PredictionType[] = [
  'FTP_PREDICTION',
  'FATIGUE_PREDICTION',
  'TRAINING_TYPE_RECOMMENDATION',
  'PERFORMANCE_TREND',
  'OVERTRAINING_RISK',
  'RACE_READINESS',
  'TRAINING_COACH_SUMMARY',
];

export default function AiPredictionPage() {
  const [tab, setTab] = useState(0);
  const [selectedType, setSelectedType] = useState<PredictionType>('FATIGUE_PREDICTION');
  const [lastResult, setLastResult] = useState<PredictionResponse | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string>('');

  const { data: aiStatus } = useAiStatus();
  const predictMutation = useAiPredict();
  const { data: history, isLoading: historyLoading } = useAiHistory(
    historyFilter || undefined,
    20,
  );

  const handlePredict = () => {
    predictMutation.mutate(
      { predictionType: selectedType },
      { onSuccess: (data) => setLastResult(data) },
    );
  };

  const isDisabled = !aiStatus?.enabled;
  const isModelUnavailable = aiStatus?.enabled && !aiStatus?.modelAvailable;

  return (
    <PageContainer title="Predykcje AI">
      <TabsNav
        tabs={[
          { label: 'Predykcja', value: 0, icon: <SmartToyIcon /> },
          { label: 'Historia', value: 1, icon: <HistoryIcon /> },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Status card */}
          <Grid item xs={12} md={4}>
            <Section title="Status modułu AI">
              <AiStatusWidget status={aiStatus} />
            </Section>
          </Grid>

          {/* Prediction panel */}
          <Grid item xs={12} md={8}>
            <Section title="Nowa predykcja">
              {!!isDisabled && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Moduł AI jest wyłączony. Ustaw AI_ENABLED=true w konfiguracji.
                </Alert>
              )}
              {!!isModelUnavailable && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Model {aiStatus?.activeModel} nie jest dostępny. Sprawdź czy serwer LLM jest uruchomiony.
                </Alert>
              )}

              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Typ predykcji</InputLabel>
                  <Select
                    value={selectedType}
                    label="Typ predykcji"
                    onChange={(e) => setSelectedType(e.target.value as PredictionType)}
                    disabled={isDisabled}
                  >
                    {PREDICTION_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: PREDICTION_TYPE_COLORS[type],
                            }}
                          />
                          {PREDICTION_TYPE_LABELS[type]}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePredict}
                  disabled={isDisabled || predictMutation.isPending}
                  startIcon={predictMutation.isPending ? <CircularProgress size={20} /> : <SmartToyIcon />}
                  sx={{ bgcolor: PREDICTION_TYPE_COLORS[selectedType] }}
                >
                  {predictMutation.isPending ? 'Analizuję...' : 'Wykonaj predykcję'}
                </Button>

                {!!predictMutation.isError && (
                  <Alert severity="error">
                    {predictMutation.error?.message || 'Wystąpił błąd podczas predykcji'}
                  </Alert>
                )}
              </Stack>
            </Section>
          </Grid>

          {/* Result */}
          {!!lastResult && (
            <Grid item xs={12}>
              <Section title="Wynik predykcji">
                <PredictionResultCard prediction={lastResult} />
              </Section>
            </Grid>
          )}

          {/* Quick prediction cards */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>Szybkie predykcje</Typography>
            <Grid container spacing={2}>
              {PREDICTION_TYPES.map((type) => (
                <Grid item xs={12} sm={6} md={4} key={type}>
                  <Box
                    onClick={() => {
                      if (!isDisabled) {
                        setSelectedType(type);
                        predictMutation.mutate(
                          { predictionType: type },
                          { onSuccess: (data) => setLastResult(data) },
                        );
                      }
                    }}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      cursor: isDisabled ? 'default' : 'pointer',
                      opacity: isDisabled ? 0.5 : 1,
                      transition: 'all 0.2s',
                      '&:hover': isDisabled ? {} : {
                        borderColor: PREDICTION_TYPE_COLORS[type],
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: PREDICTION_TYPE_COLORS[type],
                        mb: 1,
                      }}
                    />
                    <Typography variant="subtitle2">{PREDICTION_TYPE_LABELS[type]}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filtruj po typie</InputLabel>
              <Select
                value={historyFilter}
                label="Filtruj po typie"
                onChange={(e) => setHistoryFilter(e.target.value)}
              >
                <MenuItem value="">Wszystkie</MenuItem>
                {PREDICTION_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>{PREDICTION_TYPE_LABELS[type]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {!!historyLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!historyLoading && !!history && history.length === 0 && (
            <EmptyState
              title="Brak zapisanych predykcji"
              description="Uruchom predykcję AI, aby zobaczyć wyniki."
              illustration="/illustrations/empty-ai.png"
            />
          )}

          {!historyLoading && !!history && history.length > 0 && (
            <Stack spacing={2}>
              {history.map((prediction) => (
                <PredictionResultCard key={prediction.id} prediction={prediction} />
              ))}
            </Stack>
          )}
        </Box>
      )}
    </PageContainer>
  );
}
