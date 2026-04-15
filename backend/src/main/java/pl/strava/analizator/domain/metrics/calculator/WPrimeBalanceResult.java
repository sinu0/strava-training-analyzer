package pl.strava.analizator.domain.metrics.calculator;

/**
 * W' Balance analysis result from the Skiba integral model.
 *
 * @param wPrime                      initial W' capacity in joules
 * @param criticalPower               estimated CP in watts
 * @param minBalance                  lowest W'bal reached (joules)
 * @param avgBalance                  mean W'bal over the activity (joules)
 * @param secondsBelowFiftyPct        seconds where W'bal &lt; 50% of W'
 * @param secondsBelowTwentyFivePct   seconds where W'bal &lt; 25% of W'
 * @param depletionEvents             number of times W'bal crossed below 25%
 * @param balanceOverTime             per-second W'bal array
 */
public record WPrimeBalanceResult(
        double wPrime,
        double criticalPower,
        double minBalance,
        double avgBalance,
        int secondsBelowFiftyPct,
        int secondsBelowTwentyFivePct,
        int depletionEvents,
        double[] balanceOverTime
) {}
