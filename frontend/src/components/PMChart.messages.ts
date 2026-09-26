import { defineMessages } from '@/i18n';

export const pmChartMessages = defineMessages({
  pl: {
    noData: 'Brak danych PMC dla wybranego zakresu.',
    description: 'CTL pokazuje trend około 42 dni, ATL krótkie zmęczenie około 7 dni, a TSB różnicę między nimi.',
    legendCtl: 'Kondycja długoterminowa (CTL)',
    legendAtl: 'Zmęczenie krótkoterminowe (ATL)',
    legendTsb: 'Forma treningowa (TSB)',
    ariaLabel: 'Wykres obciążenia PMC. {count} punktów od {from} do {to}. Ostatnie wartości: CTL {ctl}, ATL {atl}, forma {tsb}.',
    seriesCtl: 'CTL (Fitness)',
    seriesAtl: 'ATL (Fatigue)',
    seriesTsb: 'TSB (Form)',
  },
  en: {
    noData: 'No PMC data for the selected range.',
    description: 'CTL shows the ~42-day trend, ATL short-term fatigue over ~7 days, and TSB the difference between them.',
    legendCtl: 'Long-term fitness (CTL)',
    legendAtl: 'Short-term fatigue (ATL)',
    legendTsb: 'Training form (TSB)',
    ariaLabel: 'PMC load chart. {count} points from {from} to {to}. Latest values: CTL {ctl}, ATL {atl}, form {tsb}.',
    seriesCtl: 'CTL (Fitness)',
    seriesAtl: 'ATL (Fatigue)',
    seriesTsb: 'TSB (Form)',
  },
});
