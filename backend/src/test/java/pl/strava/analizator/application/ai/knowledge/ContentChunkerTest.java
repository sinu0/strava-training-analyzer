package pl.strava.analizator.application.ai.knowledge;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class ContentChunkerTest {

    private final ContentChunker chunker = new ContentChunker();

    @Test
    void extractMainContent_stripsHtmlTags() {
        String html = "<html><body><script>alert('xss')</script><style>.cls{}</style><p>Clean text here.</p></body></html>";
        String result = chunker.extractMainContent(html);
        assertThat(result).isEqualTo("Clean text here.");
    }

    @Test
    void extractMainContent_nullInput_returnsEmpty() {
        assertThat(chunker.extractMainContent(null)).isEmpty();
    }

    @Test
    void extractMainContent_htmlEntities_decoded() {
        String html = "<p>5&nbsp;km &amp; 200&nbsp;W</p>";
        String result = chunker.extractMainContent(html);
        assertThat(result).isEqualTo("5 km & 200 W");
    }

    @Test
    void chunk_shortText_returnsSingleChunk() {
        String text = "This is a slightly longer text that exceeds fifty characters. With two sentences here.";
        List<String> chunks = chunker.chunk(text, 500, 50);
        assertThat(chunks).hasSize(1);
        assertThat(chunks.get(0)).contains("longer text");
    }

    @Test
    void chunk_longText_returnsMultipleChunks() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 100; i++) {
            sb.append("Sentence number ").append(i).append(". ");
        }
        List<String> chunks = chunker.chunk(sb.toString(), 200, 50);
        assertThat(chunks).hasSizeGreaterThan(2);
    }

    @Test
    void chunk_emptyOrNull_returnsEmptyList() {
        assertThat(chunker.chunk("")).isEmpty();
        assertThat(chunker.chunk(null)).isEmpty();
    }

    @Test
    void chunk_filtersVeryShortChunks() {
        String text = "Hi. Ok. This is a longer sentence that should be kept in a chunk.";
        List<String> chunks = chunker.chunk(text, 500, 50);
        assertThat(chunks).allMatch(c -> c.length() > 50);
    }

    @Test
    void extractTopics_findsCyclingTerms() {
        String text = "FTP testing at threshold with power meter. CTL and TSB show training stress. Recovery is key for endurance cycling.";
        List<String> topics = chunker.extractTopics(text);
        assertThat(topics).contains("ftp", "power", "threshold", "ctl", "tsb", "training", "endurance", "recovery", "cycling");
    }

    @Test
    void extractTopics_noMatches_returnsEmpty() {
        List<String> topics = chunker.extractTopics("irrelevant text about cooking");
        assertThat(topics).isEmpty();
    }

    @Test
    void extractTopics_nullInput_returnsEmpty() {
        assertThat(chunker.extractTopics(null)).isEmpty();
    }
}
