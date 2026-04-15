package pl.strava.analizator.infrastructure.strava;

import java.net.URI;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.AthleteProfile;

@RestController
@RequestMapping("/api/auth/strava")
public class StravaAuthController {

    private final StravaOAuth2Service oAuth2Service;
    private final String frontendUrl;

    public StravaAuthController(StravaOAuth2Service oAuth2Service,
                                 @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.oAuth2Service = oAuth2Service;
        this.frontendUrl = frontendUrl;
    }

    @GetMapping("/connect")
    public ResponseEntity<Map<String, String>> connect() {
        String url = oAuth2Service.getAuthorizationUrl();
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam("code") String code,
            @RequestParam(value = "scope", required = false) String scope) {
        
        AthleteProfile profile = oAuth2Service.exchangeCodeForTokens(code);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(frontendUrl + "/?strava=connected"))
                .build();
    }
}
