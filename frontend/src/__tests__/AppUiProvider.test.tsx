import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';

import {
  AppUiProvider,
  useAppUi,
} from '@/context/AppUiContext';

function AppUiProbe() {
  const {
    isGlobalLoading,
    notifySuccess,
    startGlobalLoading,
    stopGlobalLoading,
  } = useAppUi();

  return (
    <>
      <button
        onClick={() => {
          startGlobalLoading();
          notifySuccess('Zapisano');
        }}
        type="button"
      >
        Start
      </button>
      <button onClick={stopGlobalLoading} type="button">
        Stop
      </button>
      <span>{isGlobalLoading ? 'loading' : 'idle'}</span>
    </>
  );
}

describe('AppUiProvider', () => {
  it('tracks global loading state and keeps notifications working', () => {
    render(
      <AppUiProvider>
        <AppUiProbe />
      </AppUiProvider>,
    );

    expect(screen.getByText('idle')).toBeDefined();

    act(() => {
      screen.getByText('Start').click();
    });

    expect(screen.getByText('loading')).toBeDefined();
    expect(screen.getByText('Zapisano')).toBeDefined();

    act(() => {
      screen.getByText('Stop').click();
    });

    expect(screen.getByText('idle')).toBeDefined();
  });
});
