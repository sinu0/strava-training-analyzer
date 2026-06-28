package pl.strava.analizator.application.ai.mcp;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import pl.strava.analizator.domain.ai.AiTool;

@Component
public class McpClientService implements McpToolProvider {

    private static final Logger log = LoggerFactory.getLogger(McpClientService.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, McpServerConnection> connections = new ConcurrentHashMap<>();

    @Value("${ai.mcp.external-servers:}")
    private String externalServersConfig;

    public List<AiTool> getToolDefinitions() {
        List<AiTool> all = new ArrayList<>();
        for (McpServerConnection conn : connections.values()) {
            all.addAll(conn.getTools());
        }
        return all;
    }

    public void discoverAndConnect() {
        if (externalServersConfig == null || externalServersConfig.isBlank()) {
            log.info("No external MCP servers configured");
            return;
        }

        for (String entry : externalServersConfig.split(",")) {
            String trimmed = entry.trim();
            if (trimmed.isBlank()) continue;
            String[] parts = trimmed.split("@", 2);
            if (parts.length < 2) continue;
            String name = parts[0].trim();
            String url = parts[1].trim();

            try {
                McpServerConnection conn = new McpServerConnection(name, url, restTemplate);
                conn.initialize();
                connections.put(name, conn);
                log.info("Connected to external MCP server: {} ({} tools)", name, conn.getTools().size());
            } catch (Exception e) {
                log.warn("Failed to connect to MCP server {}: {}", name, e.getMessage());
            }
        }
    }

    @Override
    public String executeTool(String toolName, Map<String, Object> arguments, UUID contextActivityId) {
        for (McpServerConnection conn : connections.values()) {
            if (conn.hasTool(toolName)) {
                return conn.callTool(toolName, arguments);
            }
        }
        return "Tool not found: " + toolName;
    }

    @Override
    public boolean hasTool(String toolName) {
        return connections.values().stream().anyMatch(c -> c.hasTool(toolName));
    }

    public boolean isAvailable() {
        return !connections.isEmpty();
    }

    static class McpServerConnection {
        private final String serverName;
        private final String baseUrl;
        private final RestTemplate restTemplate;
        private String sessionId;
        private final List<AiTool> tools = new ArrayList<>();

        McpServerConnection(String serverName, String baseUrl, RestTemplate restTemplate) {
            this.serverName = serverName;
            this.baseUrl = baseUrl;
            this.restTemplate = restTemplate;
        }

        @SuppressWarnings("unchecked")
        void initialize() {
            Map<String, Object> request = Map.of(
                    "jsonrpc", "2.0",
                    "method", "initialize",
                    "params", Map.of("protocolVersion", "2024-11-05"),
                    "id", 1
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    baseUrl + "/message", new HttpEntity<>(request, headers), Map.class);

            if (response.getBody() != null) {
                Map<String, Object> result = (Map<String, Object>) response.getBody().get("result");
                if (result != null) {
                    sessionId = (String) result.get("sessionId");
                }
            }

            discoverTools();
        }

        @SuppressWarnings("unchecked")
        void discoverTools() {
            Map<String, Object> request = Map.of(
                    "jsonrpc", "2.0",
                    "method", "tools/list",
                    "params", Map.of(),
                    "id", 2
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String url = baseUrl + "/message";
            if (sessionId != null) url += "?sessionId=" + sessionId;

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    url, new HttpEntity<>(request, headers), Map.class);

            if (response.getBody() != null) {
                Map<String, Object> result = (Map<String, Object>) response.getBody().get("result");
                if (result != null && result.containsKey("tools")) {
                    List<Map<String, Object>> toolList = (List<Map<String, Object>>) result.get("tools");
                    for (Map<String, Object> t : toolList) {
                        String toolName = (String) t.get("name");
                        String description = (String) t.getOrDefault("description", "");
                        Map<String, Object> params = (Map<String, Object>) t.getOrDefault("inputSchema",
                                t.getOrDefault("parameters", Map.of()));
                        tools.add(AiTool.of(toolName, description, params));
                    }
                }
            }
        }

        @SuppressWarnings("unchecked")
        String callTool(String toolName, Map<String, Object> arguments) {
            Map<String, Object> request = new HashMap<>();
            request.put("jsonrpc", "2.0");
            request.put("method", "tools/call");
            request.put("params", Map.of("name", toolName, "arguments", arguments));
            request.put("id", 3);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String url = baseUrl + "/message";
            if (sessionId != null) url += "?sessionId=" + sessionId;

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    url, new HttpEntity<>(request, headers), Map.class);

            if (response.getBody() != null) {
                Map<String, Object> result = (Map<String, Object>) response.getBody().get("result");
                if (result != null) {
                    return result.getOrDefault("content", result.toString()).toString();
                }
                Map<String, Object> error = (Map<String, Object>) response.getBody().get("error");
                if (error != null) {
                    return "MCP Error: " + error.getOrDefault("message", "unknown error");
                }
            }

            return "Empty response from MCP server";
        }

        List<AiTool> getTools() { return List.copyOf(tools); }
        boolean hasTool(String name) { return tools.stream().anyMatch(t -> t.name().equals(name)); }
    }
}
