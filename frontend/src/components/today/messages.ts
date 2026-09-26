import { defineMessages } from '@/i18n';

export const trainingVisualizationsMessages = defineMessages({
  pl: {
    loadComparisonAriaLabel: 'Porównanie obciążenia: CTL {ctl}, ATL {atl}, forma {form}',
    currentLoad: 'Bieżące natężenie',
    formShort: 'FORMA',
    formGaugeAriaLabel: 'Skala formy: {form}, od -30 do 30',
    fatigue: 'Zmęczenie −30',
    formLabel: 'Forma {form}',
    freshness: 'Świeżość +30',
  },
  en: {
    loadComparisonAriaLabel: 'Load comparison: CTL {ctl}, ATL {atl}, form {form}',
    currentLoad: 'Current load',
    formShort: 'FORM',
    formGaugeAriaLabel: 'Form scale: {form}, from -30 to 30',
    fatigue: 'Fatigue −30',
    formLabel: 'Form {form}',
    freshness: 'Freshness +30',
  },
});
