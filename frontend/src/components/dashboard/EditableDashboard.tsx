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
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItemButton, ListItemText, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useState, type ReactNode } from 'react';

import { dashboardMessages } from '@/components/dashboard/messages';
import { useI18n } from '@/i18n';
import { getAppThemeTokens } from '@/theme/theme';
import {
  DASHBOARD_WIDGET_TYPES,
  type DashboardWidget,
  type DashboardWidgetType,
  type UiPreferences,
} from '@/types/uiPreferences';
import { Surface } from '@/ui';
import {
  createDashboardWidget,
  DEFAULT_UI_PREFERENCES,
  moveDashboardWidget,
  resizeDashboardWidget,
} from '@/utils/uiPreferences';

export function getWidgetLabel(type: DashboardWidgetType): string {
  return dashboardMessages.t(`widgets.${type}`);
}

interface EditableDashboardProps {
  preferences: UiPreferences;
  onSave: (preferences: UiPreferences) => void | Promise<void>;
  renderWidget: (widget: DashboardWidget) => ReactNode;
  saving?: boolean;
  toolbarStart?: ReactNode;
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
  const t = dashboardMessages.useT();
  const label = t(`widgets.${widget.type}`);

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
        <Box
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
            bgcolor: (theme) => getAppThemeTokens(theme).inverse.bg,
            color: (theme) => getAppThemeTokens(theme).inverse.ink,
            boxShadow: (theme) => getAppThemeTokens(theme).cardShadowHover,
          }}
        >
          <IconButton
            ref={setActivatorNodeRef}
            size="small"
            color="inherit"
            aria-label={t('move', { label })}
            {...attributes}
            {...listeners}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="inherit"
            aria-label={t('shrink', { label })}
            onClick={() => onResize(widget.span - 1)}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="inherit"
            aria-label={t('grow', { label })}
            onClick={() => onResize(widget.span + 1)}
          >
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="inherit"
            aria-label={t('configure', { label })}
            onClick={onConfigure}
          >
            <SettingsOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            aria-label={t('remove', { label })}
            onClick={onRemove}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      <Box
        sx={{
          height: '100%',
          borderRadius: 3,
          outline: editing ? '1px dashed' : 'none',
          outlineColor: (theme) => alpha(theme.palette.primary.main, 0.45),
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
  toolbarStart,
}: EditableDashboardProps) {
  const t = dashboardMessages.useT();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => structuredClone(preferences));
  const { t: common } = useI18n();
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
        ? t('conflict')
        : t('saveError'));
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
    <Stack spacing={editing ? 2.5 : 1.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{
          justifyContent: "space-between",
          alignItems: { sm: 'center' }
        }}>
        <Box>{toolbarStart}</Box>
        <Stack direction="row" spacing={0.75} sx={{
          justifyContent: "flex-end"
        }}>
          {editing ? (
            <>
            <Button startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
              {t('addWidget')}
            </Button>
            <Button startIcon={<RestartAltIcon />} onClick={restoreDefaults}>
              {t('restoreDefault')}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveOutlinedIcon />}
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {t('saveLayout')}
            </Button>
            </>
          ) : (
            <Tooltip title={t('editLayout')}>
              <IconButton
                color="primary"
                aria-label={t('editLayout')}
                onClick={() => setEditing(true)}
                sx={{
                  border: '1px solid',
                  borderColor: (theme) => theme.tokens?.surfaceStrongBorder ?? theme.palette.divider,
                  bgcolor: 'background.paper',
                  boxShadow: (theme) => getAppThemeTokens(theme).cardShadow,
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {!!saveError && <Alert severity="error">{saveError}</Alert>}
      {!!preferences.warnings?.length && (
        <Alert severity="info">{preferences.warnings.join(' · ')}</Alert>
      )}

      {widgets.length === 0 ? (
        <Surface variant="outlined" sx={{ p: 5, textAlign: 'center', borderStyle: 'dashed' }}>
          <Typography variant="h6">{t('emptyTitle')}</Typography>
          <Typography
            sx={{
              color: "text.secondary",
              mt: 1,
              mb: 2
            }}>
            {t('emptyDescription')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{
            justifyContent: "center"
          }}>
            <Button variant="contained" onClick={() => { setEditing(true); setAddOpen(true); }}>
              {t('addWidget')}
            </Button>
            <Button onClick={restoreDefaults}>{t('restoreDefaultLayout')}</Button>
          </Stack>
        </Surface>
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
                gap: 3,
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
        <DialogTitle>{t('addWidget')}</DialogTitle>
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
                <ListItemText primary={t(`widgets.${type}`)} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      <Dialog open={configuredId !== null} onClose={() => setConfiguredId(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('settingsTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('customTitle')}
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfiguredId(null)}>{common('common.cancel')}</Button>
          <Button variant="contained" onClick={applyConfiguration}>{t('apply')}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
