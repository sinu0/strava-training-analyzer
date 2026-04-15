import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  IconButton,
  TextField,
  Divider,
  Alert,
  Chip,
  Collapse,
} from '@mui/material';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { useAiNote, useGenerateAiNote, useRefreshAiNote, useAskAiNote } from '../hooks/useAi';
import { COMMON_COLORS, STATUS_COLORS, alphaColor } from '../utils/colors';

interface AiCoachSectionProps {
  activityId: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiCoachSection({ activityId }: AiCoachSectionProps) {
  const { data: note, isLoading } = useAiNote(activityId);
  const generateMutation = useGenerateAiNote();
  const refreshMutation = useRefreshAiNote();
  const askMutation = useAskAiNote();
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

  const hasNote = note?.summary;
  const isQueued = !hasNote && (note?.queueStatus === 'pending' || note?.queueStatus === 'processing');
  const isGenerating = generateMutation.isPending || refreshMutation.isPending;

  const handleGenerate = () => {
    generateMutation.mutate(activityId);
  };

  const handleRefresh = () => {
    refreshMutation.mutate(activityId);
  };

  const handleAsk = () => {
    if (!question.trim()) return;
    const q = question.trim();
    setChatHistory((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    askMutation.mutate(
      { activityId, question: q },
      {
        onSuccess: (data) => {
          setChatHistory((prev) => [...prev, { role: 'assistant', content: data.answer }]);
        },
        onError: (error) => {
          setChatHistory((prev) => [
            ...prev,
            { role: 'assistant', content: `Błąd: ${error.message}` },
          ]);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SmartToyIcon sx={{ color: STATUS_COLORS.accent }} />
          <Typography variant="h6">AI Coach</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={32} />
        </Box>
      </Paper>
    );
  }

  // No note yet and not queued — show generate button
  if (!hasNote && !isQueued) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SmartToyIcon sx={{ color: STATUS_COLORS.accent }} />
          <Typography variant="h6">AI Coach</Typography>
        </Box>
        {!!generateMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {generateMutation.error?.message || 'Nie udało się wygenerować analizy.'}
          </Alert>
        )}
        {note?.queueStatus === 'failed' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Generowanie notki nie powiodło się. Spróbuj ponownie.
          </Alert>
        )}
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Brak analizy AI dla tej aktywności.
          </Typography>
          <Button
            variant="contained"
            startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={handleGenerate}
            disabled={isGenerating}
            sx={{
              bgcolor: STATUS_COLORS.accent,
              '&:hover': { bgcolor: alphaColor(STATUS_COLORS.accent, 0.85) },
            }}
          >
            {isGenerating ? 'Generuję...' : 'Wygeneruj analizę AI'}
          </Button>
        </Box>
      </Paper>
    );
  }

  // Queued / processing — show spinner
  if (isQueued) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SmartToyIcon sx={{ color: STATUS_COLORS.accent }} />
          <Typography variant="h6">AI Coach</Typography>
          <Chip
            label={note?.queueStatus === 'processing' ? 'Generowanie...' : 'W kolejce'}
            size="small"
            color="warning"
            variant="outlined"
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, gap: 1 }}>
          <CircularProgress size={32} sx={{ color: STATUS_COLORS.accent }} />
          <Typography variant="body2" color="text.secondary">
            {note?.queueStatus === 'processing'
              ? 'AI analizuje Twój trening...'
              : 'Analiza w kolejce — zostanie wygenerowana automatycznie.'}
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Note exists — show it
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SmartToyIcon sx={{ color: STATUS_COLORS.accent }} />
        <Typography variant="h6">AI Coach</Typography>
        <Box sx={{ flexGrow: 1 }} />
        {!!note?.generatedAt && (
          <Typography variant="caption" color="text.secondary">
            {new Date(note.generatedAt).toLocaleString('pl-PL')}
          </Typography>
        )}
        <IconButton
          size="small"
          onClick={handleRefresh}
          disabled={isGenerating}
          title="Odśwież analizę"
        >
          {isGenerating ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
        </IconButton>
      </Box>

      {!!refreshMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {refreshMutation.error?.message || 'Nie udało się odświeżyć analizy.'}
        </Alert>
      )}

      {/* Note content */}
      <Box
        sx={{
          '& h2': { fontSize: '1rem', fontWeight: 600, mt: 2, mb: 0.5, color: STATUS_COLORS.accent },
          '& h3': { fontSize: '0.9rem', fontWeight: 600, mt: 1.5, mb: 0.5 },
          '& p': { mb: 1, lineHeight: 1.6 },
          '& ul': { pl: 3, mb: 1 },
          '& li': { mb: 0.25 },
        }}
      >
        <ReactMarkdown>{note?.detail || note?.summary || ''}</ReactMarkdown>
      </Box>

      {!!note?.providerName && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Model: {note.modelId} ({note.providerName})
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Chat section */}
      <Box>
        <Button
          size="small"
          startIcon={<ChatBubbleOutlineIcon />}
          onClick={() => setChatOpen(!chatOpen)}
          sx={{ mb: 1 }}
        >
          {chatOpen ? 'Zamknij czat' : 'Zapytaj o trening'}
        </Button>

        <Collapse in={chatOpen}>
          {chatHistory.length > 0 && (
            <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
              {chatHistory.map((msg, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '80%',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: msg.role === 'user'
                        ? alphaColor(STATUS_COLORS.accent, 0.15)
                        : alphaColor(COMMON_COLORS.white, 0.05),
                      border: '1px solid',
                      borderColor: msg.role === 'user'
                        ? alphaColor(STATUS_COLORS.accent, 0.3)
                        : 'divider',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </Typography>
                  </Box>
                </Box>
              ))}
              {!!askMutation.isPending && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    AI myśli...
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Zadaj pytanie o ten trening..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={askMutation.isPending}
              multiline
              maxRows={3}
            />
            <IconButton
              onClick={handleAsk}
              disabled={!question.trim() || askMutation.isPending}
              sx={{ color: STATUS_COLORS.accent }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
}
