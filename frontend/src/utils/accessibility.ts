import { defineMessages } from '@/i18n';

const { t } = defineMessages({
  pl: {
    previous: 'Przejdź do poprzedniej strony',
    next: 'Przejdź do następnej strony',
    first: 'Przejdź do pierwszej strony',
    last: 'Przejdź do ostatniej strony',
    current: 'Strona {page}, bieżąca',
    page: 'Przejdź do strony {page}',
    more: 'Więcej stron',
  },
  en: {
    previous: 'Go to previous page',
    next: 'Go to next page',
    first: 'Go to first page',
    last: 'Go to last page',
    current: 'Page {page}, current',
    page: 'Go to page {page}',
    more: 'More pages',
  },
});

export function getPolishPaginationAriaLabel(
  type: string,
  page: number | null,
  selected: boolean,
) {
  if (type === 'previous') return t('previous');
  if (type === 'next') return t('next');
  if (type === 'first') return t('first');
  if (type === 'last') return t('last');
  if (type === 'page') return selected ? t('current', { page: page ?? '' }) : t('page', { page: page ?? '' });
  return t('more');
}
