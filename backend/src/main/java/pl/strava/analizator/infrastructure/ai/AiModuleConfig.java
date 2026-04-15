package pl.strava.analizator.infrastructure.ai;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for the AI prediction module.
 * The module is activated by setting ai.enabled=true in application.yml.
 * 
 * Provider-specific beans are conditionally created:
 * - Ollama: ai.ollama.enabled=true
 * - OpenAI: ai.openai.enabled=true
 * 
 * Configuration properties:
 *   ai.enabled          - master switch (default: false)
 *   ai.provider         - active provider: "ollama" or "openai" (default: ollama)
 *   ai.model            - default model ID (default: llama3)
 *   
 *   ai.ollama.enabled   - enable Ollama adapter
 *   ai.ollama.base-url  - Ollama server URL (default: http://localhost:11434)
 *   
 *   ai.openai.enabled   - enable OpenAI adapter
 *   ai.openai.base-url  - OpenAI API URL (default: https://api.openai.com/v1)
 *   ai.openai.api-key   - API key for OpenAI
 */
@Configuration
@ConditionalOnProperty(name = "ai.enabled", havingValue = "true", matchIfMissing = false)
public class AiModuleConfig {
    // Provider beans are created by @ConditionalOnProperty on each adapter.
    // This config class serves as the master switch documentation.
}
