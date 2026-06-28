package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ResponseValidatorTest {

    private final ResponseValidator validator = new ResponseValidator();

    @Test
    void validate_validJson_returnsOk() {
        String json = """
                {
                  "summary": "FTP estimated at 290W",
                  "insight": "CTL rising over 8 weeks",
                  "action": "Perform a 20-minute FTP test",
                  "metrics": {"currentFtp": "290W"},
                  "confidence": 0.85,
                  "reasoning": "Based on power data"
                }""";

        ResponseValidator.ValidationResult result = validator.validate(json);

        assertThat(result.ok()).isTrue();
        assertThat(result.warning()).isFalse();
    }

    @Test
    void validate_missingSummary_returnsWarning() {
        String json = """
                {
                  "insight": "Some insight",
                  "action": "Some action",
                  "metrics": {},
                  "confidence": 0.5,
                  "reasoning": "Some reasoning"
                }""";

        ResponseValidator.ValidationResult result = validator.validate(json);

        assertThat(result.ok()).isTrue();
        assertThat(result.warning()).isTrue();
        assertThat(result.message()).contains("summary");
    }

    @Test
    void validate_missingMultipleFields_returnsWarning() {
        String json = """
                {
                  "summary": "Test summary"
                }""";

        ResponseValidator.ValidationResult result = validator.validate(json);

        assertThat(result.ok()).isTrue();
        assertThat(result.warning()).isTrue();
        assertThat(result.message()).contains("insight");
        assertThat(result.message()).contains("action");
        assertThat(result.message()).contains("confidence");
    }

    @Test
    void validate_emptyString_returnsFailure() {
        ResponseValidator.ValidationResult result = validator.validate("");

        assertThat(result.ok()).isFalse();
        assertThat(result.message()).contains("empty");
    }

    @Test
    void validate_nullInput_returnsFailure() {
        ResponseValidator.ValidationResult result = validator.validate(null);

        assertThat(result.ok()).isFalse();
        assertThat(result.message()).contains("empty");
    }

    @Test
    void validate_jsonWrappedInText_extractsAndValidates() {
        String text = """
                Some text before
                {
                  "summary": "FTP estimated at 290W",
                  "insight": "CTL rising over 8 weeks",
                  "action": "Perform an FTP test",
                  "metrics": {"ftp": "290W"},
                  "confidence": 0.85,
                  "reasoning": "Based on data"
                }
                Some text after""";

        ResponseValidator.ValidationResult result = validator.validate(text);

        assertThat(result.ok()).isTrue();
        assertThat(result.warning()).isFalse();
    }

    @Test
    void validate_summaryTooLong_returnsWarning() {
        String longSummary = "x".repeat(201);
        String json = """
                {
                  "summary": "%s",
                  "insight": "Some insight",
                  "action": "Some action",
                  "metrics": {},
                  "confidence": 0.5,
                  "reasoning": "Some reasoning"
                }""".formatted(longSummary);

        ResponseValidator.ValidationResult result = validator.validate(json);

        assertThat(result.ok()).isTrue();
        assertThat(result.warning()).isTrue();
        assertThat(result.message()).contains("summary too long");
    }

    @Test
    void validate_notJsonAtAll_returnsFailure() {
        ResponseValidator.ValidationResult result = validator.validate("plain text, no braces at all");

        assertThat(result.ok()).isFalse();
        assertThat(result.message()).contains("not valid JSON");
    }
}
