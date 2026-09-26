import { defineMessages } from '@/i18n';

export const matchedRideCardMessages = defineMessages({
  pl: {
    loading: 'Sprawdzanie podobnych tras…',
    loadError: 'Nie udało się sprawdzić dopasowanych przejazdów.',
    title: 'Dopasowane przejazdy',
    similarity: 'trasa podobna w {percent}%',
    reverseDirection: 'przeciwny kierunek',
    summary: {
      one: '{count} przejazd na tej trasie · ten wynik: {rank}.',
      few: '{count} przejazdy na tej trasie · ten wynik: {rank}.',
      many: '{count} przejazdów na tej trasie · ten wynik: {rank}.',
      other: '{count} przejazdów na tej trasie · ten wynik: {rank}.',
    },
    newRecord: 'Nowy rekord — {change} względem poprzedniego najlepszego wyniku',
    miniChartLabel: 'Miniwykres trendu dopasowanych przejazdów',
    metricCurrent: 'Ta jazda',
    metricVsPrevious: 'vs poprzednia',
    metricVsAverage: 'vs średnia',
    metricVsRecord: 'vs rekord',
    viewMatched: 'Zobacz dopasowane przejazdy',
  },
  en: {
    loading: 'Checking similar routes…',
    loadError: 'Could not check matched rides.',
    title: 'Matched rides',
    similarity: 'route {percent}% similar',
    reverseDirection: 'reverse direction',
    summary: {
      one: '{count} ride on this route · this result: {rank}.',
      other: '{count} rides on this route · this result: {rank}.',
    },
    newRecord: 'New record — {change} vs the previous best result',
    miniChartLabel: 'Matched rides trend mini chart',
    metricCurrent: 'This ride',
    metricVsPrevious: 'vs previous',
    metricVsAverage: 'vs average',
    metricVsRecord: 'vs record',
    viewMatched: 'View matched rides',
  },
});
