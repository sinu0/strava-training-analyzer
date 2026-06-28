package pl.strava.analizator.application.ai.knowledge;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public record KnowledgeSourceConfig(
        String name,
        String baseUrl,
        List<String> seedUrls,
        String defaultType,
        Set<String> topics,
        boolean enabled
) {

    public static KnowledgeSourceConfig forTrainingPeaks() {
        return new KnowledgeSourceConfig(
                "trainingpeaks",
                "https://www.trainingpeaks.com",
                List.of(
                        "https://www.trainingpeaks.com/blog/",
                        "https://www.trainingpeaks.com/blog/training-articles/cycling/"
                ),
                "METHODOLOGY",
                Set.of("cycling", "power", "tsb", "ctl", "atl", "ftp", "training", "periodization"),
                true
        );
    }

    public static KnowledgeSourceConfig forFriel() {
        return new KnowledgeSourceConfig(
                "friel",
                "https://www.trainingpeaks.com",
                List.of(
                        "https://www.trainingpeaks.com/blog/what-is-tsb/",
                        "https://www.trainingpeaks.com/blog/understanding-your-trainingpeaks-chart/"
                ),
                "FRAMEWORK",
                Set.of("tsb", "ctl", "atl", "pmc", "performance-management", "friel"),
                true
        );
    }

    public static KnowledgeSourceConfig forCoggan() {
        return new KnowledgeSourceConfig(
                "coggan",
                "https://www.trainingpeaks.com",
                List.of(
                        "https://www.trainingpeaks.com/blog/power-training-levels/"
                ),
                "FRAMEWORK",
                Set.of("power", "zones", "coggan", "threshold", "ftp", "training-levels"),
                true
        );
    }

    public static KnowledgeSourceConfig forSeiler() {
        return new KnowledgeSourceConfig(
                "seiler",
                "https://pubmed.ncbi.nlm.nih.gov",
                List.of(),
                "SCIENTIFIC",
                Set.of("polarized", "seiler", "intensity-distribution", "endurance"),
                true
        );
    }

    public static KnowledgeSourceConfig forIntervalsIcu() {
        return new KnowledgeSourceConfig(
                "intervals_icu",
                "https://intervals.icu",
                List.of(
                        "https://intervals.icu/docs/"
                ),
                "ANALYTICS",
                Set.of("analytics", "power", "hr", "pmc", "fitness"),
                true
        );
    }
}
