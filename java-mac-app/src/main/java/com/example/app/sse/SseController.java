package com.example.app.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * SSE控制器
 * 提供Server-Sent Events的HTTP端点
 */
@RestController
@RequestMapping("/api/sse")
@CrossOrigin(origins = "*")
public class SseController {
    
    private static final Logger logger = LoggerFactory.getLogger(SseController.class);
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30分钟超时
    
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final AtomicLong messageIdCounter = new AtomicLong(0);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    
    public SseController() {
        // 启动心跳检测
        startHeartbeat();
    }
    
    /**
     * 建立SSE连接
     */
    @GetMapping(value = "/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@RequestParam(defaultValue = "default") String clientId) {
        logger.info("新的SSE连接: clientId={}", clientId);
        
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        
        // 设置连接完成和超时回调
        emitter.onCompletion(() -> {
            logger.info("SSE连接完成: clientId={}", clientId);
            emitters.remove(clientId);
        });
        
        emitter.onTimeout(() -> {
            logger.info("SSE连接超时: clientId={}", clientId);
            emitters.remove(clientId);
        });
        
        emitter.onError((ex) -> {
            logger.error("SSE连接错误: clientId={}", clientId, ex);
            emitters.remove(clientId);
        });
        
        // 保存连接
        emitters.put(clientId, emitter);
        
        // 发送连接确认消息
        try {
            SseMessage welcomeMessage = new SseMessage("connection", "连接成功");
            welcomeMessage.setId(String.valueOf(messageIdCounter.incrementAndGet()));
            sendToEmitter(emitter, welcomeMessage);
        } catch (IOException e) {
            logger.error("发送欢迎消息失败", e);
        }
        
        return emitter;
    }
    
    /**
     * 发送消息到指定客户端
     */
    @PostMapping("/send/{clientId}")
    public ResponseEntity<String> sendMessage(
            @PathVariable String clientId,
            @RequestBody SseMessage message) {
        
        SseEmitter emitter = emitters.get(clientId);
        if (emitter == null) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            message.setId(String.valueOf(messageIdCounter.incrementAndGet()));
            sendToEmitter(emitter, message);
            logger.info("消息已发送到客户端: clientId={}, message={}", clientId, message);
            return ResponseEntity.ok("消息发送成功");
        } catch (IOException e) {
            logger.error("发送消息失败: clientId={}", clientId, e);
            emitters.remove(clientId);
            return ResponseEntity.internalServerError().body("消息发送失败");
        }
    }
    
    /**
     * 广播消息到所有客户端
     */
    @PostMapping("/broadcast")
    public ResponseEntity<String> broadcastMessage(@RequestBody SseMessage message) {
        if (emitters.isEmpty()) {
            return ResponseEntity.ok("没有活跃的连接");
        }
        
        message.setId(String.valueOf(messageIdCounter.incrementAndGet()));
        int successCount = 0;
        int failCount = 0;
        
        for (Map.Entry<String, SseEmitter> entry : emitters.entrySet()) {
            try {
                sendToEmitter(entry.getValue(), message);
                successCount++;
            } catch (IOException e) {
                logger.error("广播消息失败: clientId={}", entry.getKey(), e);
                emitters.remove(entry.getKey());
                failCount++;
            }
        }
        
        logger.info("广播消息完成: 成功={}, 失败={}, 消息={}", successCount, failCount, message);
        return ResponseEntity.ok(String.format("广播完成: 成功%d个, 失败%d个", successCount, failCount));
    }
    
    /**
     * 获取连接状态
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = Map.of(
            "activeConnections", emitters.size(),
            "totalMessagesSent", messageIdCounter.get(),
            "serverTime", LocalDateTime.now()
        );
        return ResponseEntity.ok(status);
    }
    
    /**
     * 断开指定客户端连接
     */
    @DeleteMapping("/disconnect/{clientId}")
    public ResponseEntity<String> disconnect(@PathVariable String clientId) {
        SseEmitter emitter = emitters.remove(clientId);
        if (emitter != null) {
            emitter.complete();
            logger.info("客户端连接已断开: clientId={}", clientId);
            return ResponseEntity.ok("连接已断开");
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * 发送消息到指定的SseEmitter
     */
    private void sendToEmitter(SseEmitter emitter, SseMessage message) throws IOException {
        String jsonData = objectMapper.writeValueAsString(message.getData());
        
        SseEmitter.SseEventBuilder eventBuilder = SseEmitter.event();
        
        if (message.getId() != null) {
            eventBuilder.id(message.getId());
        }
        
        if (message.getEvent() != null) {
            eventBuilder.name(message.getEvent());
        }
        
        eventBuilder.data(jsonData);
        
        if (message.getRetry() != null) {
            eventBuilder.reconnectTime(message.getRetry());
        }
        
        emitter.send(eventBuilder);
    }
    
    /**
     * 启动心跳检测
     */
    private void startHeartbeat() {
        scheduler.scheduleAtFixedRate(() -> {
            if (!emitters.isEmpty()) {
                SseMessage heartbeat = new SseMessage("heartbeat", "ping");
                heartbeat.setId(String.valueOf(messageIdCounter.incrementAndGet()));
                
                emitters.entrySet().removeIf(entry -> {
                    try {
                        sendToEmitter(entry.getValue(), heartbeat);
                        return false;
                    } catch (IOException e) {
                        logger.debug("心跳检测失败，移除连接: clientId={}", entry.getKey());
                        return true;
                    }
                });
            }
        }, 30, 30, TimeUnit.SECONDS);
    }
}