package pl.strava.analizator.infrastructure.routing;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Component
@ConfigurationProperties(prefix = "routing")
@Getter
@Setter
public class RoutingProperties {

    private Brouter brouter = new Brouter();
    private Osrm osrm = new Osrm();

    @Getter
    @Setter
    public static class Brouter {
        private boolean enabled = true;
        private String baseUrl = "https://brouter.de/brouter";
        private int alternativeCandidates = 3;
    }

    @Getter
    @Setter
    public static class Osrm {
        private boolean enabled = true;
        private String baseUrl = "https://router.project-osrm.org";
    }
}
