package pl.strava.analizator.infrastructure.web;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import pl.strava.analizator.application.ai.McpToolService;
import pl.strava.analizator.domain.ai.AiTool;
import pl.strava.analizator.domain.ai.ToolCall;
import pl.strava.analizator.domain.ai.ToolResult;

/**
 * Embedded MCP (Model Context Protocol) server.
 * <p>
 * Exposes training data tools over the MCP protocol so that external MCP clients
 * (Claude Desktop, Cursor, etc.) can query athlete metrics directly.
 * <p>
 * Transport: HTTP + SSE (Server-Sent Events) as specified by the MCP spec.
 * <ul>
 *   <li>{@code GET  /api/mcp/sse}     – establish SSE connection, server sends session endpoint URL</li>
 *   <li>{@code POST /api/mcp/message} – send JSON-RPC 2.0 messages to the server</li>
 *   <li>{@code GET  /api/mcp/info}    – server metadata (no session needed)</li>
 * </ul>
 *
 * <b>Supported JSON-RPC methods:</b>
 * <ul>
 *   <li>{@code initialize}   – protocol handshake, returns server capabilities</li>
 *   <li>{@code tools/list}   – returns available tool definitions</li>
 *   <li>{@code tools/call}   – executes a named tool with arguments</li>
 *   <li>{@code ping}         – health check</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/mcp")
public class McpServerController {

    private static final Logger log = LoggerFactory.getLogger(McpServerController.class);
    private static final String PROTOCOL_VERSION = "2024-11-05";
    private static final String SERVER_NAME = "strava-analizator-mcp";
    private static final String SERVER_VERSION = "1.0.0";

    /** Active SSE sessions: sessionId → emitter */
    private final ConcurrentHashMap<String, SseEmitter> sessions = new ConcurrentHashMap<>();

    private final McpToolService toolService;

    public McpServerController(McpToolService toolService) {
        this.toolService = toolService;
    }

    // -------------------------------------------------------------------------
    // SSE connection endpoint
    // -------------------------------------------------------------------------

    /**
     * Client connects here to establish the SSE stream.
     * Server immediately sends an {@code endpoint} event containing the URL
     * the client should POST messages to.
     */
    @GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect() {
        String sessionId = UUID.randomUUID().toString();
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        sessions.put(sessionId, emitter);
        emitter.onCompletion(() -> sessions.remove(sessionId));
        emitter.onTimeout(() -> sessions.remove(sessionId));
        emitter.onError(e -> sessions.remove(sessionId));

        try {
            // Tell the client where to POST messages
            emitter.send(SseEmitter.event()
                    .name("endpoint")
                    .data("/api/mcp/message?sessionId=" + sessionId));
        } catch (IOException e) {
            log.warn("Failed to send endpoint event to session {}: {}", sessionId, e.getMessage());
            sessions.remove(sessionId);
        }

        log.debug("MCP SSE session opened: {}", sessionId);
        return emitter;
    }

    // -------------------------------------------------------------------------
    // Message (JSON-RPC) endpoint
    // -------------------------------------------------------------------------

    /**
     * Receives JSON-RPC 2.0 messages from the client and dispatches them.
     * Responses are sent back via SSE to the client's open stream.
     */
    @PostMapping("/message")
    public ResponseEntity<Void> message(
            @RequestParam String sessionId,
            @RequestBody Map<String, Object> request) {

        SseEmitter emitter = sessions.get(sessionId);
        if (emitter == null) {
            return ResponseEntity.badRequest().build();
        }

        Object id = request.get("id");
        String method = (String) request.get("method");
        @SuppressWarnings("unchecked")
        Map<String, Object> params = (Map<String, Object>) request.getOrDefault("params", Map.of());

        log.debug("MCP [{}] method={}", sessionId, method);

        try {
            Object result = dispatch(method, params);
            sendResponse(emitter, id, result, null);
        } catch (Exception e) {
            log.warn("MCP method [{}] failed: {}", method, e.getMessage());
            sendResponse(emitter, id, null,
                    Map.of("code", -32603, "message", e.getMessage()));
        }

        return ResponseEntity.accepted().build();
    }

    // -------------------------------------------------------------------------
    // Info endpoint (no session required)
    // -------------------------------------------------------------------------

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> info() {
        return ResponseEntity.ok(Map.of(
                "name", SERVER_NAME,
                "version", SERVER_VERSION,
                "protocolVersion", PROTOCOL_VERSION,
                "tools", toolService.getToolDefinitions().stream().map(t -> Map.of(
                        "name", t.name(),
                        "description", t.description()
                )).toList()
        ));
    }

    // -------------------------------------------------------------------------
    // Dispatch
    // -------------------------------------------------------------------------

    private Object dispatch(String method, Map<String, Object> params) {
        return switch (method) {
            case "initialize" -> handleInitialize(params);
            case "notifications/initialized" -> null; // no response needed
            case "ping" -> Map.of();
            case "tools/list" -> handleToolsList();
            case "tools/call" -> handleToolsCall(params);
            default -> throw new IllegalArgumentException("Unknown method: " + method);
        };
    }

    private Map<String, Object> handleInitialize(Map<String, Object> params) {
        return Map.of(
                "protocolVersion", PROTOCOL_VERSION,
                "serverInfo", Map.of(
                        "name", SERVER_NAME,
                        "version", SERVER_VERSION
                ),
                "capabilities", Map.of(
                        "tools", Map.of("listChanged", false)
                )
        );
    }

    private Map<String, Object> handleToolsList() {
        List<Map<String, Object>> tools = toolService.getToolDefinitions().stream()
                .map(t -> Map.<String, Object>of(
                        "name", t.name(),
                        "description", t.description(),
                        "inputSchema", t.parameters()
                ))
                .toList();
        return Map.of("tools", tools);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> handleToolsCall(Map<String, Object> params) {
        String toolName = (String) params.get("name");
        Map<String, Object> arguments = (Map<String, Object>) params.getOrDefault("arguments", Map.of());

        ToolCall call = new ToolCall(UUID.randomUUID().toString(), toolName, arguments);
        ToolResult result = toolService.execute(call, null);

        return Map.of(
                "content", List.of(
                        Map.of("type", "text", "text", result.content())
                ),
                "isError", false
        );
    }

    // -------------------------------------------------------------------------
    // SSE send helper
    // -------------------------------------------------------------------------

    private void sendResponse(SseEmitter emitter, Object id, Object result, Object error) {
        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("jsonrpc", "2.0");
        response.put("id", id);
        if (error != null) {
            response.put("error", error);
        } else if (result != null) {
            response.put("result", result);
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("message")
                    .data(response, MediaType.APPLICATION_JSON));
        } catch (IOException e) {
            log.warn("Failed to send SSE message: {}", e.getMessage());
        }
    }
}
