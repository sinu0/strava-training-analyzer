import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';

import {
  DASHBOARD_WIDGET_TYPES,
  type DashboardWidget,
  type DashboardWidgetType,
  type UiPreferences,
} from '@/types/uiPreferences';
import {
  createDashboardWidget,
  DEFAULT_UI_PREFERENCES,
  moveDashboardWidget,
  resizeDashboardWidget,
} from '@/utils/uiPreferences';

export const WIDGET_LABELS: Record<DashboardWidgetType, string> = {
  decision: 'Rekomendacja dnia',
  recovery: 'Regeneracja',
  load: 'Obciążenie',
  lastActivity: 'Ostatni trening',
  nextWorkout: 'Następny trening',
  weather: 'Pogoda',
  weeklyVolume: 'Objętość tygodnia',
  goal: 'Cel treningowy',
};

interface EditableDashboardProps {
  preferences: UiPreferences;
  onSave: (preferences: UiPreferences) => void | Promise<void>;
  renderWidget: (widget: DashboardWidget) => ReactNode;
  saving?: boolean;
}

interface SortableWidgetProps {
  editing: boolean;
  widget: DashboardWidget;
  children: ReactNode;
  onRemove: () => void;
  onResize: (span: number) => void;
  onConfigure: () => void;
}

function SortableWidget({
  editing,
  widget,
  children,
  onRemove,
  onResize,
  onConfigure,
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !editing });
  const label = WIDGET_LABELS[widget.type];

  return (
    <Box
      ref={setNodeRef}
      sx={{
        gridColumn: {
          xs: '1 / -1',
          sm: `span ${Math.min(widget.span, 6)}`,
          lg: `span ${widget.span}`,
        },
        minWidth: 0,
        opacity: isDragging ? 0.55 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
      }}
    >
      {!!editing && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            zIndex: 5,
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            p: 0.25,
            borderRadius: 2,
            bgcolor: 'rgba(8,13,19,0.94)',
          }}
        >
          <IconButton
            ref={setActivatorNodeRef}
            size="small"
            aria-label={`Przenieś widget ${label}`}
            {...attributes}
            {...listeners}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label={`Zmniejsz widget ${label}`}
            onClick={() => onResize(widget.span - 1)}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label={`Zwiększ widget ${label}`}
            onClick={() => onResize(widget.span + 1)}
          >
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label={`Ustawienia widgetu ${label}`}
            onClick={onConfigure}
          >
            <SettingsOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            aria-label={`Usuń widget ${label}`}
            onClick={onRemove}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}
      <Box
        sx={{
          height: '100%',
          borderRadius: 3,
          outline: editing ? '1px dashed rgba(88,166,255,0.55)' : 'none',
          outlineOffset: editing ? 3 : 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function EditableDashboard({
  preferences,
  onSave,
  renderWidget,
  saving = false,
}: EditableDashboardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => structuredClone(preferences));
  const [addOpen, setAddOpen] = useState(false);
  const [configuredId, setConfiguredId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const widgets = draft.dashboard.widgets;

  useEffect(() => {
    if (!editing) setDraft(structuredClone(preferences));
  }, [editing, preferences]);

  const updateWidgets = (next: DashboardWidget[]) => {
    setDraft((current) => ({
      ...current,
      dashboard: {
        widgets: next.map((widget, order) => ({ ...widget, order })),
      },
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    updateWidgets(moveDashboardWidget(widgets, String(event.active.id), String(event.over.id)));
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      await onSave({ ...draft, revision: preferences.revision });
      setEditing(false);
    } catch (error) {
      const isConflict = typeof error === 'object'
        && error !== null
        && 'response' in error
        && (error as { response?: { status?: number } }).response?.status === 409;
      setSaveError(isConflict
        ? 'Układ zmienił się w innym widoku. Odśwież stronę i spróbuj ponownie.'
        : 'Nie udało się zapisać układu. Spróbuj ponownie.');
    }
  };

  const restoreDefaults = () => {
    setDraft({
      ...structuredClone(DEFAULT_UI_PREFERENCES),
      revision: preferences.revision,
      mobileNavigation: [...preferences.mobileNavigation],
    });
    setEditing(true);
  };

  const openConfiguration = (widgetToConfigure: DashboardWidget) => {
    setConfiguredId(widgetToConfigure.id);
    setTitleDraft(widgetToConfigure.settings.title ?? '');
  };

  const applyConfiguration = () => {
    updateWidgets(widgets.map((widgetToUpdate) => (
      widgetToUpdate.id === configuredId
        ? {
          ...widgetToUpdate,
          settings: { ...widgetToUpdate.settings, title: titleDraft.trim() || undefined },
        }
        : widgetToUpdate
    )));
    setConfiguredId(null);
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
        {editing ? (
          <>
            <Button startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
              Dodaj widget
            </Button>
            <Button startIcon={<RestartAltIcon />} onClick={restoreDefaults}>
              Przywróć domyślny
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveOutlinedIcon />}
              disabled={saving}
              onClick={() => void handleSave()}
            >
              Zapisz układ
            </Button>
          </>
        ) : (
          <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => setEditing(true)}>
            Edytuj układ
          </Button>
        )}
      </Stack>

      {!!saveError && <Alert severity="error">{saveError}</Alert>}
      {!!preferences.warnings?.length && (
        <Alert severity="info">{preferences.warnings.join(' · ')}</Alert>
      )}

      {widgets.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderStyle: 'dashed' }}>
          <Typography variant="h6">Pulpit jest pusty</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            Dodaj wybrane moduły lub wróć do sprawdzonego układu startowego.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
            <Button variant="contained" onClick={() => { setEditing(true); setAddOpen(true); }}>
              Dodaj widget
            </Button>
            <Button onClick={restoreDefaults}>Przywróć domyślny układ</Button>
          </Stack>
        </Paper>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgets.map((widget) => widget.id)} strategy={verticalListSortingStrategy}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'minmax(0, 1fr)',
                  sm: 'repeat(6, minmax(0, 1fr))',
                  lg: 'repeat(12, minmax(0, 1fr))',
                },
                gap: 2.5,
                alignItems: 'stretch',
              }}
            >
              {widgets.map((widget) => (
                <SortableWidget
                  key={widget.id}
                  editing={editing}
                  widget={widget}
                  onRemove={() => updateWidgets(widgets.filter((item) => item.id !== widget.id))}
                  onResize={(span) => updateWidgets(widgets.map((item) => (
                    item.id === widget.id ? resizeDashboardWidget(item, span) : item
                  )))}
                  onConfigure={() => openConfiguration(widget)}
                >
                  {renderWidget(widget)}
                </SortableWidget>
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Dodaj widget</DialogTitle>
        <DialogContent dividers>
          <List disablePadding>
            {DASHBOARD_WIDGET_TYPES.map((type) => (
              <ListItemButton
                key={type}
                onClick={() => {
                  updateWidgets([...widgets, createDashboardWidget(type, widgets.length)]);
                  setAddOpen(false);
                }}
              >
                <ListItemText primary={WIDGET_LABELS[type]} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      <Dialog open={configuredId !== null} onClose={() => setConfiguredId(null)} fullWidth maxWidth="xs">
        <DialogTitle>Ustawienia widgetu</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Własny tytuł"
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfiguredId(null)}>Anuluj</Button>
          <Button variant="contained" onClick={applyConfiguration}>Zastosuj</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
