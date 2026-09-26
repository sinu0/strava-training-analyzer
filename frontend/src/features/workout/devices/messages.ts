import { defineMessages } from '@/i18n';

/** Device/BLE error strings shown to the rider (status.error, connectError, controlError) and simulator names. */
export const devicesMessages = defineMessages({
  pl: {
    notConnected: 'Urządzenie nie jest połączone',
    noPowerData: 'Urządzenie nie udostępnia danych mocy (FTMS ani Cycling Power)',
    ergNotSupported: 'Ten trenażer nie obsługuje trybu ERG przez Bluetooth',
    resistanceNotSupported: 'Ten trenażer nie obsługuje sterowania oporem',
    controlRefused: 'Inna aplikacja lub licznik steruje trenażerem. Wyłącz sterowanie trenażerem w Garminie/Zwifcie i spróbuj ponownie.',
    controlNotTaken: 'Trenażer odmówił przejęcia sterowania',
    commandRejected: 'Trenażer odrzucił polecenie sterowania',
    commandTimeout: 'Trenażer nie potwierdził polecenia w ciągu 3 s',
    deviceUnavailable: 'Urządzenie nie jest już dostępne. Połącz je ponownie z listy.',
    missingService: 'Brak usługi Bluetooth 0x{uuid}',
    noWebBluetooth: 'Ta przeglądarka nie obsługuje Web Bluetooth. Użyj Chrome lub Edge na komputerze albo Chrome na Androidzie (HTTPS).',
    controlCommandFailed: 'Nie udało się wysłać polecenia do trenażera',
    connectFailed: 'Nie udało się połączyć z urządzeniem',
    simulatedTrainerName: 'SUITO (symulator)',
    simulatedHrName: 'HRM-Pro (symulator)',
  },
  en: {
    notConnected: 'The device is not connected',
    noPowerData: 'This device does not provide power data (neither FTMS nor Cycling Power)',
    ergNotSupported: 'This trainer does not support ERG mode over Bluetooth',
    resistanceNotSupported: 'This trainer does not support resistance control',
    controlRefused: 'Another app or head unit is controlling the trainer. Turn off trainer control in Garmin/Zwift and try again.',
    controlNotTaken: 'The trainer refused to hand over control',
    commandRejected: 'The trainer rejected the control command',
    commandTimeout: 'The trainer did not acknowledge the command within 3 s',
    deviceUnavailable: 'The device is no longer available. Reconnect it from the list.',
    missingService: 'Bluetooth service 0x{uuid} not found',
    noWebBluetooth: 'This browser does not support Web Bluetooth. Use Chrome or Edge on desktop, or Chrome on Android (HTTPS).',
    controlCommandFailed: 'Could not send the command to the trainer',
    connectFailed: 'Could not connect to the device',
    simulatedTrainerName: 'SUITO (simulator)',
    simulatedHrName: 'HRM-Pro (simulator)',
  },
});
