import { defineMessages } from '@/i18n';

export const powerCurveChartMessages = defineMessages({
  pl: {
    currentRange: 'Aktualny zakres',
    noData: 'Brak danych krzywej mocy.',
    ariaLabel: 'Krzywa mocy. {count} punkty pomiarowe.',
    ariaLabelPeak: ' Najwyższa wartość aktualnego zakresu: {peak} W.',
    yAxisLabel: 'Moc (W)',
  },
  en: {
    currentRange: 'Current range',
    noData: 'No power curve data.',
    ariaLabel: 'Power curve. {count} data points.',
    ariaLabelPeak: ' Highest value in the current range: {peak} W.',
    yAxisLabel: 'Power (W)',
  },
});
