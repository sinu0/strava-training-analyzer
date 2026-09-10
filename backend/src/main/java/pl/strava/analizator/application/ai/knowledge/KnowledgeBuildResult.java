package pl.strava.analizator.application.ai.knowledge;

public record KnowledgeBuildResult(
        boolean changed,
        String corpusVersion,
        int documents,
        int sources
) {
}
