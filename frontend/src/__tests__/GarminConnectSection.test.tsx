import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GarminConnectSection from '@/components/admin/GarminConnectSection';
import type { GarminBridgeStatus, GarminStatus } from '@/types/garmin';

const connectedStatus: GarminStatus = {
  connected: true,
  email: 'user@example.com',
  lastSyncAt: '2026-04-26T22:10:00Z',
  lastError: null,
};

function renderSection(overrides?: {
  garminBridgeStatus?: GarminBridgeStatus;
  onGarminBridgeSync?: (from: string, to: string) => void;
}) {
  const onGarminBridgeSync = overrides?.onGarminBridgeSync ?? vi.fn();

  render(
    <GarminConnectSection
      garminStatus={connectedStatus}
      garminBridgeStatus={overrides?.garminBridgeStatus}
      garminEmail=""
      garminPassword=""
      showGarminForm={false}
      garminHealthToday={[]}
      saveGarminCredentialsPending={false}
      saveGarminCredentialsError={null}
      deleteGarminCredentialsPending={false}
      garminSyncPending={false}
      garminBridgeSyncPending={false}
      garminSyncData={undefined}
      garminSyncError={null}
      onGarminEmailChange={vi.fn()}
      onGarminPasswordChange={vi.fn()}
      onShowGarminFormChange={vi.fn()}
      onSaveGarminCredentials={vi.fn()}
      onDeleteGarminCredentials={vi.fn()}
      onGarminSync={vi.fn()}
      onGarminBridgeSync={onGarminBridgeSync}
    />,
  );

  return { onGarminBridgeSync };
}

describe('GarminConnectSection', () => {
  it('shows local bridge status and lets user start bridge sync with one click', () => {
    const { onGarminBridgeSync } = renderSection({
      garminBridgeStatus: {
        online: true,
        busy: false,
        sessionReady: true,
        requiresInteraction: false,
        lastSyncAt: '2026-04-26T22:12:00Z',
        lastError: null,
      },
    });

    expect(screen.getByText('Bridge lokalny')).toBeDefined();
    expect(screen.getByText('Aktywny')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /synchronizuj przez bridge/i }));

    expect(onGarminBridgeSync).toHaveBeenCalledOnce();
  });

  it('shows one-time startup command when bridge is offline', () => {
    renderSection({
      garminBridgeStatus: {
        online: false,
        busy: false,
        sessionReady: false,
        requiresInteraction: false,
        lastSyncAt: null,
        lastError: null,
      },
    });

    expect(screen.getByText(/npm run garmin:bridge/i)).toBeDefined();
    expect(screen.getByText(/uruchom bridge raz w tle/i)).toBeDefined();
  });
});
