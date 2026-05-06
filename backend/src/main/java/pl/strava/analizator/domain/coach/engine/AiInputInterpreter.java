package pl.strava.analizator.domain.coach.engine;

import java.util.Locale;

import pl.strava.analizator.domain.coach.model.AiInputModifiers;

public class AiInputInterpreter {

    public AiInputModifiers interpret(String rawInput) {
        if (rawInput == null || rawInput.isBlank()) {
            return AiInputModifiers.builder()
                    .readinessAdjustment(0)
                    .intensityBias(1.0)
                    .fatigueSensitivity(1.0)
                    .maxDurationMinutes(null)
                    .preferredType(null)
                    .interpretedIntent("NO_INPUT")
                    .rawInput(rawInput)
                    .build();
        }

        String input = rawInput.toLowerCase(Locale.ROOT).trim();

        double readinessAdjustment = 0;
        double intensityBias = 1.0;
        double fatigueSensitivity = 1.0;
        Integer maxDuration = null;
        String preferredType = null;
        String interpretedIntent = "NONE";

        if (containsAny(input,
                "tired", "exhausted", "worn out", "fatigued", "no energy", "drained",
                "zmęczony", "zmeczony", "wyczerpany", "bez energii", "padam", "słaby", "slaby",
                "ledwo", "ciężko", "ciezko", "boli", "zakwasy", "nie mam siły", "nie mam sily",
                "przetrenowany")) {
            readinessAdjustment = -20;
            intensityBias = 0.6;
            fatigueSensitivity = 1.5;
            preferredType = "RECOVERY";
            interpretedIntent = "ATHLETE_TIRED";
        }
        if (containsAny(input,
                "strong", "great", "fresh", "energetic", "ready", "powerful",
                "silny", "silnie", "świetnie", "swietnie", "swiezy", "świeży", "energia",
                "moc", "power", "gotowy", "forma", "dobrze", "super", "mam powera",
                "czuję moc", "czuje moc", "wypoczęty", "wypoczety")) {
            readinessAdjustment = 15;
            intensityBias = 1.3;
            fatigueSensitivity = 0.7;
            interpretedIntent = "ATHLETE_STRONG";
        }
        if (containsAny(input,
                "short ride", "short session", "quick ride", "limited time", "busy",
                "krótki", "krotki", "krótka", "krotka", "krótką", "krotka jazda",
                "mało czasu", "malo czasu", "szybka jazda", "szybko", "30 min", "45 min",
                "godzina", "niewiele czasu", "zajęty", "zajety")) {
            maxDuration = 60;
            interpretedIntent = "PREFER_SHORT";
        }
        if (containsAny(input,
                "long ride", "long session", "big day", "epic",
                "długi", "dlugi", "długa", "dluga", "długo", "dlugo",
                "długą", "dluga jazda", "dużo", "duzo", "wiele", "3 godziny",
                "4 godziny", "cały dzień", "caly dzien", "wyprawa")) {
            maxDuration = null;
            intensityBias = Math.max(intensityBias, 1.1);
            interpretedIntent = "PREFER_LONG";
        }
        if (containsAny(input,
                "easy", "light", "gentle", "recovery", "easy day",
                "lekki", "lekka", "lekką", "lekko", "spokojnie", "spokojny",
                "regeneracja", "odpoczynek", "odpocząć", "odpoczac", "luz",
                "odpoczynkowy", "rozjazd", "rozjeżdżenie", "rozjezdzenie",
                "na luzie", "bez spinania", "z1", "strefa 1")) {
            preferredType = "RECOVERY";
            intensityBias = Math.min(intensityBias, 0.7);
            interpretedIntent = "PREFER_EASY";
        }
        if (containsAny(input,
                "hard", "push", "intense", "hard day", "quality", "intervals",
                "ciężki", "ciezki", "ciężko", "ciezko", "ostro", "mocno",
                "intensywnie", "interwały", "interwaly", "jakość", "jakosc",
                "zakwasić", "zakwasic", "ostra jazda", "dac czadu", "dać czadu",
                "granica", "max", "full", "cisnę", "cisne")) {
            preferredType = "THRESHOLD";
            intensityBias = Math.max(intensityBias, 1.3);
            interpretedIntent = "PREFER_HARD";
        }
        if (containsAny(input,
                "endurance", "steady", "zone 2", "base", "long slow",
                "wytrzymałość", "wytrzymalosc", "podstawa", "baza",
                "tlenowo", "tlen", "dystans", "z2", "strefa 2",
                "spokojna jazda", "równo", "rowno", "tempowo")) {
            preferredType = "ENDURANCE";
            interpretedIntent = "PREFER_ENDURANCE";
        }
        if (containsAny(input,
                "vo2", "vo2max", "vo2 max", "vo2max", "vomax",
                "pułap tlenowy", "pulap tlenowy", "tlenowy")) {
            preferredType = "VO2MAX";
            interpretedIntent = "PREFER_VO2MAX";
        }
        if (containsAny(input,
                "threshold", "ftp", "sweet spot", "sweetspot",
                "próg", "prog", "progu", "progowo", "sweet",
                "tempo progowe", "cp20", "cp30")) {
            preferredType = "THRESHOLD";
            interpretedIntent = "PREFER_THRESHOLD";
        }
        if (containsAny(input,
                "indoor", "trainer", "zwift",
                "trenażer", "trenazer", "w domu", "domu",
                "stacjonarny", "rolki", "kuchnia")) {
            interpretedIntent = "PREFER_INDOOR";
        }
        if (containsAny(input,
                "outdoor", "outside", "road",
                "na zewnątrz", "na zewnatrz", "dwór", "dwor", "plener",
                "szosa", "asfalt", "na drodze", "w teren", "las")) {
            interpretedIntent = "PREFER_OUTDOOR";
        }

        return AiInputModifiers.builder()
                .readinessAdjustment(readinessAdjustment)
                .intensityBias(intensityBias)
                .fatigueSensitivity(fatigueSensitivity)
                .maxDurationMinutes(maxDuration)
                .preferredType(preferredType)
                .interpretedIntent(interpretedIntent)
                .rawInput(rawInput)
                .build();
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
