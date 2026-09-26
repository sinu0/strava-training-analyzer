package pl.strava.analizator.domain.ai;

import java.util.Locale;

/**
 * Language of AI-generated text. Prompts themselves stay in English; each language only adds a
 * directive (language + writing style) appended to the system prompt.
 */
public enum AiLanguage {

    PL("""
            OUTPUT LANGUAGE AND STYLE:
            - Write every human-readable text value in Polish (natural, correct Polish with proper diacritics).
            - Address the athlete directly and informally ("ty"), like an experienced Polish cycling coach: concise, concrete, calm.
            - Use Polish cycling terminology (e.g. "próg", "strefa Z2", "interwały", "kadencja", "regeneracja"); keep standard \
            abbreviations and units unchanged (FTP, CTL, ATL, TSB, TSS, IF, NP, HR, W, W/kg, bpm, rpm, km).
            - Keep JSON keys, enum values and section structure exactly as specified; translate only the values meant for the athlete.
            """),
    EN("""
            OUTPUT LANGUAGE AND STYLE:
            - Write every human-readable text value in English (clear, plain British English).
            - Address the athlete directly ("you"), like an experienced cycling coach: concise, concrete, calm.
            - Use standard cycling terminology and keep abbreviations and units unchanged \
            (FTP, CTL, ATL, TSB, TSS, IF, NP, HR, W, W/kg, bpm, rpm, km).
            - Keep JSON keys, enum values and section structure exactly as specified.
            """);

    public static final AiLanguage DEFAULT = PL;

    private final String promptDirective;

    AiLanguage(String promptDirective) {
        this.promptDirective = promptDirective;
    }

    public String promptDirective() {
        return promptDirective;
    }

    /** Lower-case code used by the API ("pl", "en"). */
    public String code() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static AiLanguage fromCode(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("AI language is required");
        }
        for (AiLanguage language : values()) {
            if (language.code().equalsIgnoreCase(code.trim())) {
                return language;
            }
        }
        throw new IllegalArgumentException("Unsupported AI language: " + code);
    }
}
