package pl.strava.analizator.application.ai.knowledge;

import java.util.List;
import java.util.Set;

import pl.strava.analizator.domain.ai.KnowledgeSource;
import pl.strava.analizator.domain.ai.KnowledgeType;

public record KnowledgeSourceConfig(
        String name,
        KnowledgeSource source,
        String baseUrl,
        List<String> seedUrls,
        KnowledgeType defaultType,
        Set<String> topics,
        boolean enabled
) {

    public static KnowledgeSourceConfig forTrainingPeaks() {
        return new KnowledgeSourceConfig(
                "trainingpeaks",
                KnowledgeSource.TRAININGPEAKS,
                "https://www.trainingpeaks.com",
                List.of(
                        "https://www.trainingpeaks.com/learn/articles/what-is-the-performance-management-chart/",
                        "https://www.trainingpeaks.com/blog/managing-your-training-stress-balance/"
                ),
                KnowledgeType.METHODOLOGY,
                Set.of("cycling", "power", "tsb", "ctl", "atl", "ftp", "training", "periodization"),
                true
        );
    }

    public static KnowledgeSourceConfig forFriel() {
        return new KnowledgeSourceConfig(
                "friel",
                KnowledgeSource.FRIEL,
                "https://www.trainingpeaks.com",
                List.of(),
                KnowledgeType.FRAMEWORK,
                Set.of("tsb", "ctl", "atl", "pmc", "performance-management", "friel"),
                false
        );
    }

    public static KnowledgeSourceConfig forCoggan() {
        return new KnowledgeSourceConfig(
                "coggan",
                KnowledgeSource.COGGAN,
                "https://www.trainingpeaks.com",
                List.of(
                        "https://www.trainingpeaks.com/blog/power-training-levels/"
                ),
                KnowledgeType.FRAMEWORK,
                Set.of("power", "zones", "coggan", "threshold", "ftp", "training-levels"),
                true
        );
    }

    public static KnowledgeSourceConfig forSeiler() {
        return new KnowledgeSourceConfig(
                "seiler",
                KnowledgeSource.SEILER,
                "https://pubmed.ncbi.nlm.nih.gov",
                List.of(),
                KnowledgeType.SCIENTIFIC,
                Set.of("polarized", "seiler", "intensity-distribution", "endurance"),
                true
        );
    }

    public static KnowledgeSourceConfig forIntervalsIcu() {
        return new KnowledgeSourceConfig(
                "intervals_icu",
                KnowledgeSource.INTERVALS_ICU,
                "https://intervals.icu",
                List.of(
                        "https://intervals.icu/docs/"
                ),
                KnowledgeType.ANALYTICS,
                Set.of("analytics", "power", "hr", "pmc", "fitness"),
                true
        );
    }
}
