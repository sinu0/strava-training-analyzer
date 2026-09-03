export type SpeedChartDomain = [number | 'auto', number | 'auto'];

export function speedChartDomain(values: Array<number | null | undefined>): SpeedChartDomain {
  const observed = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (observed.length === 0) return ['auto', 'auto'];

  const minimum = Math.min(...observed);
  const maximum = Math.max(...observed);
  const spread = maximum - minimum;
  const margin = spread === 0 ? 0.5 : Math.max(0.1, spread * 0.08);

  return [
    Math.floor((minimum - margin) * 10) / 10,
    Math.ceil((maximum + margin) * 10) / 10,
  ];
}
