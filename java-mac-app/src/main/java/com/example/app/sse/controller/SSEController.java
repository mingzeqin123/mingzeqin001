package com.example.app.sse.controller;

import com.example.app.sse.model.SSEClient;
import com.example.app.sse.model.SSEMessage;
import com.example.app.sse.model.MessageType;
import com.example.app.sse.service.SSEService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * SSE控制器
 * 处理Server-Sent Events的HTTP端点
 */
@RestController
@RequestMapping("/api/sse")
@CrossOrigin(origins = "*")
public class SSEController {
    
    private static final Logger logger = LoggerFactory.getLogger(SSEController.class);
    
    @Autowired
    private SSEService sseService;
    
    // 存储活跃的SSE连接
    private final Map<String, SseEmitter> activeConnections = new java.util.concurrent.ConcurrentHashMap<>();
    
    // 定时任务执行器
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);
    
    /**
     * 建立SSE连接
     */
    @GetMapping(value = "/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String sessionId,
            HttpServletRequest request) {
        
        // 生成客户端ID和会话ID
        if (clientId == null || clientId.trim().isEmpty()) {
            clientId = "client_" + UUID.randomUUID().toString().substring(0, 8);
        }
        if (sessionId == null || sessionId.trim().isEmpty()) {
            sessionId = "session_" + UUID.randomUUID().toString().substring(0, 8);
        }
        
        // 创建SSE发射器
        SseEmitter emitter = new SseEmitter(0L); // 0表示不超时
        
        // 注册客户端
        SSEClient client = sseService.registerClient(
            clientId, 
            sessionId, 
            request.getHeader("User-Agent"),
            getClientIpAddress(request)
        );
        
        // 存储连接
        activeConnections.put(clientId, emitter);
        
        // 设置连接完成和超时回调
        emitter.onCompletion(() -> {
            logger.info("SSE连接完成: {}", clientId);
            cleanupConnection(clientId);
        });
        
        emitter.onTimeout(() -> {
            logger.warn("SSE连接超时: {}", clientId);
            cleanupConnection(clientId);
        });
        
        emitter.onError((ex) -> {
            logger.error("SSE连接错误: {}", clientId, ex);
            cleanupConnection(clientId);
        });
        
        // 启动消息推送任务
        startMessagePushing(clientId, emitter);
        
        logger.info("SSE连接已建立: {} (会话: {})", clientId, sessionId);
        
        return emitter;
    }
    
    /**
     * 发送消息到指定客户端
     */
    @PostMapping("/send/{clientId}")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable String clientId,
            @RequestParam String event,
            @RequestParam String data,
            @RequestParam(required = false) Long retry) {
        
        try {
            MessageType messageType = MessageType.fromEventType(event);
            sseService.sendMessageToClient(clientId, messageType, data, retry);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "消息已发送",
                "clientId", clientId,
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            logger.error("发送消息失败: {}", clientId, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "发送消息失败: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }
    
    /**
     * 广播消息到所有客户端
     */
    @PostMapping("/broadcast")
    public ResponseEntity<Map<String, Object>> broadcastMessage(
            @RequestParam String event,
            @RequestParam String data,
            @RequestParam(required = false) Long retry) {
        
        try {
            MessageType messageType = MessageType.fromEventType(event);
            sseService.broadcastMessage(messageType, data, retry);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "消息已广播",
                "clientCount", sseService.getActiveClientCount(),
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            logger.error("广播消息失败", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "广播消息失败: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }
    
    /**
     * 获取客户端状态
     */
    @GetMapping("/status/{clientId}")
    public ResponseEntity<Map<String, Object>> getClientStatus(@PathVariable String clientId) {
        SSEClient client = sseService.getClient(clientId);
        
        if (client == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(Map.of(
            "clientId", client.getClientId(),
            "sessionId", client.getSessionId(),
            "isActive", client.isActive(),
            "connectedAt", client.getConnectedAt(),
            "lastActivity", client.getLastActivity(),
            "userAgent", client.getUserAgent(),
            "remoteAddress", client.getRemoteAddress()
        ));
    }
    
    /**
     * 获取所有客户端状态
     */
    @GetMapping("/clients")
    public ResponseEntity<Map<String, Object>> getAllClients() {
        return ResponseEntity.ok(Map.of(
            "totalClients", sseService.getActiveClientCount(),
            "clients", sseService.getAllClients(),
            "timestamp", LocalDateTime.now()
        ));
    }
    
    /**
     * 断开指定客户端连接
     */
    @DeleteMapping("/disconnect/{clientId}")
    public ResponseEntity<Map<String, Object>> disconnectClient(@PathVariable String clientId) {
        try {
            cleanupConnection(clientId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "客户端已断开",
                "clientId", clientId,
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            logger.error("断开客户端失败: {}", clientId, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "断开客户端失败: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }
    
    /**
     * 启动消息推送任务
     */
    private void startMessagePushing(String clientId, SseEmitter emitter) {
        scheduler.scheduleAtFixedRate(() -> {
            try {
                List<SSEMessage> messages = sseService.getPendingMessages(clientId);
                
                for (SSEMessage message : messages) {
                    try {
                        emitter.send(SseEmitter.event()
                            .id(message.getId())
                            .name(message.getEvent())
                            .data(message.getData())
                            .reconnectTime(message.getRetry()));
                        
                        logger.debug("消息已推送到客户端 {}: {}", clientId, message.getEvent());
                    } catch (IOException e) {
                        logger.error("推送消息失败: {}", clientId, e);
                        cleanupConnection(clientId);
                        break;
                    }
                }
            } catch (Exception e) {
                logger.error("消息推送任务失败: {}", clientId, e);
                cleanupConnection(clientId);
            }
        }, 0, 1, TimeUnit.SECONDS);
    }
    
    /**
     * 清理连接
     */
    private void cleanupConnection(String clientId) {
        SseEmitter emitter = activeConnections.remove(clientId);
        if (emitter != null) {
            try {
                emitter.complete();
            } catch (Exception e) {
                logger.warn("完成SSE发射器失败: {}", clientId, e);
            }
        }
        
        sseService.unregisterClient(clientId);
        logger.info("SSE连接已清理: {}", clientId);
    }
    
    /**
     * 获取客户端IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}