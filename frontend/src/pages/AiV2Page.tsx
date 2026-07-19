import HistoryIcon from '@mui/icons-material/History';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
  Box,
  Alert,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import { useState } from 'react';

import ModelSelector from '@/components/ai-v2/ModelSelector';
import PersonaSelector from '@/components/ai-v2/PersonaSelector';
import PredictionResultCardV2 from '@/components/ai-v2/PredictionResultCardV2';
import PredictionTypeGrid from '@/components/ai-v2/PredictionTypeGrid';
import AiStatusWidget from '@/components/AiStatusWidget';
import EmptyState from '@/components/common/EmptyState';
import PageContainer from '@/components/common/PageContainer';
import Section from '@/components/common/Section';
import TabsNav from '@/components/common/TabsNav';
import { useAiStatus } from '@/hooks/useAi';
import {
  useAiPredictV2,
  useAiHistoryV2,
  useKnowledgeStatus,
  useRefreshKnowledge,
} from '@/hooks/useAiV2';
import type { PredictionResponseV2 } from '@/types/aiV2';
import {
  PREDICTION_TYPE_V2_LABELS,
  type PredictionTypeV2,
  type Persona,
} from '@/types/aiV2';
import { STATUS_COLORS } from '@/utils/colors';

const ALL_TYPES: PredictionTypeV2[] = [
  'FTP_PREDICTION',
  'FATIGUE_PREDICTION',
  'TRAINING_TYPE_RECOMMENDATION',
  'PERFORMANCE_TREND',
  'OVERTRAINING_RISK',
  'RACE_READINESS',
  'TRAINING_COACH_SUMMARY',
  'RACE_PACING_STRATEGY',
  'NUTRITION_PLAN',
  'RECOVERY_PLAN',
  'INJURY_RISK',
  'PEAK_TIMING',
];

export default function AiV2Page() {
  const [tab, setTab] = useState(0);
  const [selectedType, setSelectedType] = useState<PredictionTypeV2 | null>(null);
  const [persona, setPersona] = useState<Persona | undefined>(undefined);
  const [modelId, setModelId] = useState<string | undefined>(undefined);
  const [, setLastResult] = useState<PredictionResponseV2 | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string>('');
  const [results, setResults] = useState<PredictionResponseV2[]>([]);

  const { data: aiStatus } = useAiStatus();
  const predictMutation = useAiPredictV2();
  const { data: history, isLoading: historyLoading } = useAiHistoryV2(
    historyFilter || undefined,
    20,
  );
  const { data: knowledgeStatus } = useKnowledgeStatus();
  const refreshKnowledgeMutation = useRefreshKnowledge();

  const isDisabled = !aiStatus?.enabled;
  const isModelUnavailable = aiStatus?.enabled && !aiStatus?.modelAvailable;

  const handlePredict = () => {
    if (!selectedType) return;
    predictMutation.mutate(
      {
        predictionType: selectedType,
        persona,
        modelId,
      },
      {
        onSuccess: (data) => {
          setLastResult(data);
          setResults((prev) => [data, ...prev]);
        },
      },
    );
  };

  return (
    <PageContainer title="AI Predykcje V2">
      <TabsNav
        tabs={[
          { label: 'Predykcja V2', value: 0, icon: <SmartToyIcon /> },
          { label: 'Historia', value: 1, icon: <HistoryIcon /> },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Status + Knowledge */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Section title="Status modułu AI">
                <AiStatusWidget status={aiStatus} />
              </Section>

              {!!knowledgeStatus && (
                <Section title="Baza wiedzy RAG">
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={knowledgeStatus.ragAvailable ? 'Dostępna' : 'Niedostępna'}
                        size="small"
                        sx={{
                          bgcolor: knowledgeStatus.ragAvailable
                            ? STATUS_COLORS.success
                            : STATUS_COLORS.warning,
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Odświeżanie
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {knowledgeStatus.refreshScheduled}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => refreshKnowledgeMutation.mutate()}
                      disabled={refreshKnowledgeMutation.isPending}
                    >
                      {refreshKnowledgeMutation.isPending ? 'Odświeżanie...' : 'Odśwież bazę wiedzy'}
                    </Button>
                    {!!refreshKnowledgeMutation.isSuccess && (
                      <Alert severity="success" sx={{ py: 0 }}>
                        {refreshKnowledgeMutation.data.documentsIndexed
                          ? `Zaindeksowano ${refreshKnowledgeMutation.data.documentsIndexed} dokumentów`
                          : 'Baza wiedzy odświeżona'}
                      </Alert>
                    )}
                    {!!refreshKnowledgeMutation.isError && (
                      <Alert severity="error" sx={{ py: 0 }}>
                        {refreshKnowledgeMutation.error?.message || 'Błąd odświeżania'}
                      </Alert>
                    )}
                  </Stack>
                </Section>
              )}
            </Stack>
          </Grid>

          {/* Prediction panel */}
          <Grid item xs={12} md={8}>
            <Section title="Nowa predykcja V2">
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

              <Stack spacing={2.5}>
                <PersonaSelector
                  value={persona}
                  onChange={setPersona}
                  disabled={isDisabled}
                />

                <ModelSelector
                  value={modelId}
                  onChange={setModelId}
                  disabled={isDisabled}
                />

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  Wybierz typ predykcji:
                </Typography>
                <PredictionTypeGrid
                  selected={selectedType}
                  onSelect={setSelectedType}
                  disabled={isDisabled}
                />

                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePredict}
                  disabled={isDisabled || !selectedType || predictMutation.isPending}
                  startIcon={predictMutation.isPending ? <CircularProgress size={20} /> : <SmartToyIcon />}
                  fullWidth
                >
                  {predictMutation.isPending
                    ? 'Analizuję...'
                    : selectedType
                      ? `Wykonaj: ${PREDICTION_TYPE_V2_LABELS[selectedType]}`
                      : 'Wybierz typ predykcji'}
                </Button>

                {!!predictMutation.isError && (
                  <Alert severity="error">
                    {predictMutation.error?.message || 'Wystąpił błąd podczas predykcji'}
                  </Alert>
                )}
              </Stack>
            </Section>
          </Grid>

          {/* Results */}
          {results.length > 0 && (
            <Grid item xs={12}>
              <Section title={`Wyniki (${results.length})`}>
                <Stack spacing={2}>
                  {results.map((prediction) => (
                    <PredictionResultCardV2 key={prediction.id} prediction={prediction} />
                  ))}
                </Stack>
              </Section>
            </Grid>
          )}
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
                {ALL_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {PREDICTION_TYPE_V2_LABELS[type]}
                  </MenuItem>
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
              title="Brak zapisanych predykcji V2"
              description="Uruchom predykcję AI V2, aby zobaczyć wyniki."
              illustration="/illustrations/empty-ai.png"
            />
          )}

          {!historyLoading && !!history && history.length > 0 && (
            <Stack spacing={2}>
              {history.map((prediction) => (
                <PredictionResultCardV2 key={prediction.id} prediction={prediction} />
              ))}
            </Stack>
          )}
        </Box>
      )}
    </PageContainer>
  );
}
