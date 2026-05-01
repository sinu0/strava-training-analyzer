package pl.strava.analizator.domain.metrics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.vo.Lap;

/**
 * Enriches lap data with computed performance metrics from activity streams.
 * Pure domain logic - no framework dependencies.
 */
public class LapMetricsService {

    private static final int NP_ROLLING_WINDOW = 30;
    private static final double VO2_THRESHOLD = 1.06; // >106% FTP
    private static final double THRESHOLD_THRESHOLD = 0.91; // 91-106% FTP
    private static final double ENDURANCE_THRESHOLD = 0.56; // 56-91% FTP

    public List<Lap> enrichLaps(Activity activity, Short ftp) {
        if (activity.getLaps() == null || activity.getLaps().isEmpty()) {
            return activity.getLaps();
        }

        int[] powerStream = activity.getPowerStream();
        List<Lap> enriched = new ArrayList<>();
        Short prevAvgPower = null;

        for (int i = 0; i < activity.getLaps().size(); i++) {
            Lap lap = activity.getLaps().get(i);
            Lap.LapBuilder builder = Lap.builder()
                    .name(lap.getName())
                    .lapIndex(lap.getLapIndex())
                    .startIndex(lap.getStartIndex())
                    .endIndex(lap.getEndIndex())
                    .distanceM(lap.getDistanceM())
                    .elapsedTimeSec(lap.getElapsedTimeSec())
                    .movingTimeSec(lap.getMovingTimeSec())
                    .avgSpeedMs(lap.getAvgSpeedMs())
                    .maxSpeedMs(lap.getMaxSpeedMs())
                    .avgHeartrate(lap.getAvgHeartrate())
                    .maxHeartrate(lap.getMaxHeartrate())
                    .avgPowerW(lap.getAvgPowerW())
                    .maxPowerW(lap.getMaxPowerW())
                    .avgCadence(lap.getAvgCadence())
                    .totalElevationGain(lap.getTotalElevationGain());

            if (powerStream != null && lap.getStartIndex() != null && lap.getEndIndex() != null
                    && lap.getStartIndex() >= 0 && lap.getEndIndex() > lap.getStartIndex()
                    && lap.getEndIndex() <= powerStream.length) {
                int[] lapPower = slice(powerStream, lap.getStartIndex(), lap.getEndIndex());

                Short np = computeNormalizedPower(lapPower);
                builder.normalizedPowerW(np);

                if (np != null && lap.getAvgPowerW() != null && lap.getAvgPowerW() > 0) {
                    double vi = (double) np / lap.getAvgPowerW();
                    builder.variabilityIndex(BigDecimal.valueOf(vi).setScale(2, RoundingMode.HALF_UP));
                }

                if (prevAvgPower != null && prevAvgPower > 0 && lap.getAvgPowerW() != null) {
                    double drop = ((double) (prevAvgPower - lap.getAvgPowerW()) / prevAvgPower) * 100.0;
                    builder.powerDropPct(BigDecimal.valueOf(drop).setScale(1, RoundingMode.HALF_UP));
                }

                if (ftp != null && ftp > 0 && lap.getAvgPowerW() != null) {
                    double pctFtp = (double) lap.getAvgPowerW() / ftp;
                    builder.intensityClass(classifyIntensity(pctFtp));
                }
            } else if (ftp != null && ftp > 0 && lap.getAvgPowerW() != null) {
                double pctFtp = (double) lap.getAvgPowerW() / ftp;
                builder.intensityClass(classifyIntensity(pctFtp));
            }

            prevAvgPower = lap.getAvgPowerW();
            enriched.add(builder.build());
        }

        return enriched;
    }

    private Short computeNormalizedPower(int[] powerStream) {
        if (powerStream.length < NP_ROLLING_WINDOW) {
            double avg = averagePower(powerStream);
            return (short) Math.round(avg);
        }

        double[] rollingAvg = new double[powerStream.length - NP_ROLLING_WINDOW + 1];
        double windowSum = 0;
        for (int i = 0; i < NP_ROLLING_WINDOW; i++) {
            windowSum += powerStream[i];
        }
        rollingAvg[0] = windowSum / NP_ROLLING_WINDOW;

        for (int i = 1; i < rollingAvg.length; i++) {
            windowSum += powerStream[i + NP_ROLLING_WINDOW - 1] - powerStream[i - 1];
            rollingAvg[i] = windowSum / NP_ROLLING_WINDOW;
        }

        double sumFourthPower = 0;
        for (double avg : rollingAvg) {
            double v = avg * avg;
            sumFourthPower += v * v;
        }
        double avgFourthPower = sumFourthPower / rollingAvg.length;

        return (short) Math.round(Math.pow(avgFourthPower, 0.25));
    }

    private double averagePower(int[] powerStream) {
        double sum = 0;
        for (int w : powerStream) {
            sum += w;
        }
        return sum / powerStream.length;
    }

    private String classifyIntensity(double pctFtp) {
        if (pctFtp >= VO2_THRESHOLD) {
            return "VO2";
        }
        if (pctFtp >= THRESHOLD_THRESHOLD) {
            return "THRESHOLD";
        }
        if (pctFtp >= ENDURANCE_THRESHOLD) {
            return "ENDURANCE";
        }
        return "RECOVERY";
    }

    private int[] slice(int[] source, int from, int to) {
        int len = to - from;
        int[] result = new int[len];
        System.arraycopy(source, from, result, 0, len);
        return result;
    }
}
