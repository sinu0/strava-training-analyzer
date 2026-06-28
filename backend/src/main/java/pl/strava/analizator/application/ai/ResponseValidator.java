package pl.strava.analizator.application.ai;

import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ResponseValidator {

    private static final Logger log = LoggerFactory.getLogger(ResponseValidator.class);

    private static final Pattern JSON_PATTERN = Pattern.compile(
            "^\\s*\\{[\\s\\S]*\\}\\s*$", Pattern.DOTALL);

    public ValidationResult validate(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            return ValidationResult.failure("Response is empty");
        }

        String trimmed = rawResponse.trim();

        if (!JSON_PATTERN.matcher(trimmed).matches()) {
            String extracted = extractJson(trimmed);
            if (extracted != null) {
                return validateJsonStructure(extracted);
            }
            return ValidationResult.failure("Response is not valid JSON");
        }

        return validateJsonStructure(trimmed);
    }

    private ValidationResult validateJsonStructure(String json) {
        StringBuilder errors = new StringBuilder();

        if (!json.contains("\"summary\"")) errors.append("Missing 'summary' field. ");
        if (!json.contains("\"insight\"")) errors.append("Missing 'insight' field. ");
        if (!json.contains("\"action\"")) errors.append("Missing 'action' field. ");
        if (!json.contains("\"metrics\"")) errors.append("Missing 'metrics' field. ");
        if (!json.contains("\"confidence\"")) errors.append("Missing 'confidence' field. ");
        if (!json.contains("\"reasoning\"")) errors.append("Missing 'reasoning' field. ");

        if (!errors.isEmpty()) {
            log.warn("Response validation issues: {}", errors);
            return ValidationResult.withWarning("Missing fields: " + errors);
        }

        int summaryIdx = json.indexOf("\"summary\"");
        if (summaryIdx >= 0) {
            int colonIdx = json.indexOf(":", summaryIdx);
            if (colonIdx >= 0) {
                int closingIdx = json.indexOf("\"", colonIdx + 3);
                if (closingIdx > colonIdx) {
                    String summary = json.substring(colonIdx + 2, closingIdx);
                    if (summary.length() > 200) {
                        return ValidationResult.withWarning("summary too long: " + summary.length() + " chars");
                    }
                }
            }
        }

        return ValidationResult.success();
    }

    private String extractJson(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return null;
    }

    public record ValidationResult(boolean ok, boolean warning, String message) {
        public static ValidationResult success() { return new ValidationResult(true, false, ""); }
        public static ValidationResult withWarning(String msg) { return new ValidationResult(true, true, msg); }
        public static ValidationResult failure(String msg) { return new ValidationResult(false, false, msg); }
    }
}
