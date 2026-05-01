package pl.strava.analizator.domain.model;

/**
 * Result of fitting the 2-parameter Critical Power model P(t) = W' / t + CP.
 *
 * @param cp          Critical Power in watts (the asymptote — power sustainable quasi-indefinitely)
 * @param wPrime      W' (anaerobic work capacity) in joules
 * @param rSquared    goodness of fit (0–1), higher = better model fit
 * @param cpPerKg     CP relative to body weight (W/kg)
 * @param dataPoints  number of (time, work) pairs used for fitting
 * @param cpConfidence Pct — how confident we are in this CP estimate (0–100)
 * @param currentFtp  athlete's current FTP for reference (W)
 * @param ftpVsCpPct  how FTP compares to CP as percentage
 */
public record CpModelResult(
        double cp,
        double wPrime,
        double rSquared,
        double cpPerKg,
        int dataPoints,
        int cpConfidence,
        double currentFtp,
        double ftpVsCpPct
) {}
