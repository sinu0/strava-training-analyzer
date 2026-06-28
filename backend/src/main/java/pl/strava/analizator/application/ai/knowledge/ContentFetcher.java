package pl.strava.analizator.application.ai.knowledge;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ContentFetcher {

    private static final Logger log = LoggerFactory.getLogger(ContentFetcher.class);

    private final HttpClient httpClient;

    public ContentFetcher() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public String fetch(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("User-Agent", "StravaAnalizator/2.0 (AI Knowledge Base; +https://github.com/strava-analizator)")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return response.body();
            }
            log.warn("Failed to fetch {}: HTTP {}", url, response.statusCode());
            return null;
        } catch (IOException | InterruptedException e) {
            log.warn("Failed to fetch {}: {}", url, e.getMessage());
            Thread.currentThread().interrupt();
            return null;
        }
    }
}
