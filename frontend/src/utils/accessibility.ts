export function getPolishPaginationAriaLabel(
  type: string,
  page: number | null,
  selected: boolean,
) {
  if (type === 'previous') return 'Przejdź do poprzedniej strony';
  if (type === 'next') return 'Przejdź do następnej strony';
  if (type === 'first') return 'Przejdź do pierwszej strony';
  if (type === 'last') return 'Przejdź do ostatniej strony';
  if (type === 'page') return selected ? `Strona ${page}, bieżąca` : `Przejdź do strony ${page}`;
  return 'Więcej stron';
}
