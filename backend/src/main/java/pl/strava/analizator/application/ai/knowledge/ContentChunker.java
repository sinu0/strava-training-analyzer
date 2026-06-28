package pl.strava.analizator.application.ai.knowledge;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

@Component
public class ContentChunker {

    private static final Pattern SCRIPT_TAG = Pattern.compile("<script[^>]*>[\\s\\S]*?</script>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern STYLE_TAG = Pattern.compile("<style[^>]*>[\\s\\S]*?</style>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern HTML_TAG = Pattern.compile("<[^>]+>");
    private static final Pattern WHITESPACE = Pattern.compile("\\s{2,}");
    private static final Pattern SENTENCE_END = Pattern.compile("(?<=[.!?])\\s+");

    private static final Set<String> SPORTS_TOPICS = Set.of(
            "cycling", "power", "ftp", "threshold", "ctl", "atl", "tsb",
            "training", "endurance", "aerobic", "anaerobic", "vo2max",
            "heart rate", "cadence", "watt", "w/kg", "interval", "recovery",
            "periodization", "taper", "polarized", "hiit", "overtraining",
            "fatigue", "readiness", "pmc", "performance", "lactate",
            "carbohydrate", "hydration", "nutrition", "sleep"
    );

    private static final int DEFAULT_CHUNK_SIZE = 800;
    private static final int OVERLAP = 100;

    public String extractMainContent(String html) {
        if (html == null) return "";
        String text = SCRIPT_TAG.matcher(html).replaceAll(" ");
        text = STYLE_TAG.matcher(text).replaceAll(" ");
        text = HTML_TAG.matcher(text).replaceAll(" ");
        text = text.replace("&nbsp;", " ").replace("&amp;", "&")
                .replace("&lt;", "<").replace("&gt;", ">")
                .replace("&quot;", "\"").replace("&#39;", "'");
        text = WHITESPACE.matcher(text).replaceAll(" ").trim();
        return text;
    }

    public List<String> chunk(String text, int chunkSize, int overlap) {
        if (text == null || text.isBlank()) return List.of();

        List<String> chunks = new ArrayList<>();
        String[] sentences = SENTENCE_END.split(text);
        StringBuilder current = new StringBuilder();

        for (String sentence : sentences) {
            if (current.length() + sentence.length() > chunkSize && !current.isEmpty()) {
                chunks.add(current.toString().trim());
                if (overlap > 0 && chunks.size() > 0) {
                    String last = chunks.get(chunks.size() - 1);
                    int start = Math.max(0, last.length() - overlap);
                    current = new StringBuilder(last.substring(start));
                } else {
                    current = new StringBuilder();
                }
            }
            if (!current.isEmpty()) current.append(" ");
            current.append(sentence.trim());
        }

        if (!current.isEmpty()) {
            chunks.add(current.toString().trim());
        }

        return chunks.stream().filter(c -> c.length() > 50).toList();
    }

    public List<String> chunk(String text) {
        return chunk(text, DEFAULT_CHUNK_SIZE, OVERLAP);
    }

    public List<String> extractTopics(String text) {
        if (text == null) return List.of();
        String lower = text.toLowerCase();
        return SPORTS_TOPICS.stream()
                .filter(topic -> lower.contains(topic))
                .collect(Collectors.toList());
    }
}
