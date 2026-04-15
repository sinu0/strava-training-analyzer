export interface WeeklyMmp {
  weekLabel: string;
  weekStart: string;
  bestEfforts: Record<string, number>;
}

export interface WPrimeBalanceData {
  wPrime: number;
  criticalPower: number;
  minBalance: number;
  avgBalance: number;
  secondsBelowFiftyPct: number;
  secondsBelowTwentyFivePct: number;
  depletionEvents: number;
  balanceOverTime: number[];
}
