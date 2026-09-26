import { Stack } from '@mui/material';

import AiStatusSection from '@/components/admin/AiStatusSection';
import AiCoachingStyleSettings from '@/components/settings/AiCoachingStyleSettings';
import AiLanguageSettings from '@/components/settings/AiLanguageSettings';
import { useAiStatus, useAiValidationReport, useRunAiBatch } from '@/hooks/useAi';
import { Surface } from '@/ui';

export default function AiTab() {
  const { data: aiStatus } = useAiStatus();
  const { data: aiValidation } = useAiValidationReport();
  const runAiBatch = useRunAiBatch();

  return (
    <Stack spacing={2.5}>
      <Surface><AiLanguageSettings /></Surface>
      <Surface><AiCoachingStyleSettings /></Surface>
      <AiStatusSection
        aiStatus={aiStatus}
        aiValidation={aiValidation}
        runAiBatchPending={runAiBatch.isPending}
        runAiBatchData={runAiBatch.data}
        runAiBatchError={runAiBatch.error}
        onRunAiBatch={(skipToday) => runAiBatch.mutate(skipToday)}
      />
    </Stack>
  );
}
