package pl.strava.analizator.application.dto;

public record StravaConfigDto(
        String clientId,
        String clientIdSource,
        boolean hasClientSecret,
        String clientSecretSource,
        boolean hasWebhookToken,
        String webhookTokenSource
) {}
