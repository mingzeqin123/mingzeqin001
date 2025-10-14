package com.example.app.sse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ConfigurableApplicationContext;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * SSE演示类
 * 展示如何使用SSE消息处理功能
 */
public class SseDemo {
    
    private static final Logger logger = LoggerFactory.getLogger(SseDemo.class);
    
    private ConfigurableApplicationContext serverContext;
    private SseClient client1;
    private SseClient client2;
    private SseMessageProcessor processor;
    private ScheduledExecutorService scheduler;
    
    public static void main(String[] args) {
        SseDemo demo = new SseDemo();
        demo.runDemo();
    }
    
    /**
     * 运行完整演示
     */
    public void runDemo() {
        logger.info("=== SSE消息处理演示开始 ===");
        
        try {
            // 1. 启动服务器
            startServer();
            Thread.sleep(2000); // 等待服务器启动
            
            // 2. 创建消息处理器
            setupMessageProcessor();
            
            // 3. 创建并连接客户端
            setupClients();
            Thread.sleep(1000); // 等待连接建立
            
            // 4. 演示消息发送和接收
            demonstrateMessaging();
            
            // 5. 演示消息处理功能
            demonstrateMessageProcessing();
            
            // 6. 演示自动消息生成
            demonstrateAutomaticMessages();
            
            // 等待演示完成
            Thread.sleep(10000);
            
        } catch (Exception e) {
            logger.error("演示过程中发生错误", e);
        } finally {
            cleanup();
        }
        
        logger.info("=== SSE消息处理演示结束 ===");
    }
    
    /**
     * 启动SSE服务器
     */
    private void startServer() {
        logger.info("启动SSE服务器...");
        serverContext = SseServerApplication.startServer(8080);
        logger.info("SSE服务器已启动在端口 8080");
    }
    
    /**
     * 设置消息处理器
     */
    private void setupMessageProcessor() {
        logger.info("设置消息处理器...");
        processor = new SseMessageProcessor();
        
        // 设置默认处理器
        processor.setupDefaultHandlers();
        processor.setupDefaultFilters();
        processor.setupDefaultTransformers();
        
        // 添加自定义处理器
        processor.registerHandler("demo", message -> {
            logger.info("演示处理器收到消息: {}", message.getData());
        });
        
        processor.registerHandler("broadcast", message -> {
            logger.info("广播消息: {}", message.getData());
        });
        
        // 添加自定义过滤器
        processor.registerFilter("importantOnly", message -> {
            Object data = message.getData();
            if (data instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> dataMap = (Map<String, Object>) data;
                return "important".equals(dataMap.get("priority"));
            }
            return false;
        });
        
        // 添加自定义转换器
        processor.registerTransformer("addMetadata", message -> {
            if (message.getMetadata() == null) {
                message.setMetadata(new HashMap<>());
            }
            message.getMetadata().put("processed", true);
            message.getMetadata().put("processedAt", LocalDateTime.now().toString());
            return message;
        });
        
        logger.info("消息处理器设置完成");
    }
    
    /**
     * 设置客户端连接
     */
    private void setupClients() {
        logger.info("设置客户端连接...");
        
        // 客户端1
        client1 = new SseClient();
        client1.onConnectionStatus(status -> {
            logger.info("客户端1连接状态: {}", status);
        });
        
        client1.onEvent("*", message -> {
            logger.info("客户端1收到消息: {} - {}", message.getEvent(), message.getData());
            processor.submitMessage(message);
        });
        
        client1.onError(error -> {
            logger.error("客户端1错误: {}", error.getMessage());
        });
        
        // 客户端2
        client2 = new SseClient();
        client2.onConnectionStatus(status -> {
            logger.info("客户端2连接状态: {}", status);
        });
        
        client2.onEvent("*", message -> {
            logger.info("客户端2收到消息: {} - {}", message.getEvent(), message.getData());
        });
        
        client2.onError(error -> {
            logger.error("客户端2错误: {}", error.getMessage());
        });
        
        // 连接到服务器
        CompletableFuture.allOf(
            client1.connect("http://localhost:8080", "demo-client-1"),
            client2.connect("http://localhost:8080", "demo-client-2")
        ).join();
        
        logger.info("客户端连接完成");
    }
    
    /**
     * 演示基本消息发送和接收
     */
    private void demonstrateMessaging() {
        logger.info("=== 演示基本消息发送和接收 ===");
        
        try {
            // 发送通知消息
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("title", "系统通知");
            notificationData.put("content", "这是一条演示通知消息");
            notificationData.put("priority", "normal");
            
            SseMessage notification = new SseMessage("notification", notificationData);
            sendBroadcastMessage(notification);
            
            Thread.sleep(1000);
            
            // 发送日志消息
            Map<String, Object> logData = new HashMap<>();
            logData.put("level", "INFO");
            logData.put("message", "演示日志消息");
            logData.put("source", "SseDemo");
            
            SseMessage logMessage = new SseMessage("log", logData);
            sendBroadcastMessage(logMessage);
            
            Thread.sleep(1000);
            
            // 发送错误消息
            Map<String, Object> errorData = new HashMap<>();
            errorData.put("error", "演示错误");
            errorData.put("details", "这是一个演示用的错误消息");
            errorData.put("priority", "important");
            
            SseMessage errorMessage = new SseMessage("error", errorData);
            sendBroadcastMessage(errorMessage);
            
        } catch (Exception e) {
            logger.error("演示消息发送失败", e);
        }
    }
    
    /**
     * 演示消息处理功能
     */
    private void demonstrateMessageProcessing() {
        logger.info("=== 演示消息处理功能 ===");
        
        try {
            // 发送演示消息
            Map<String, Object> demoData = new HashMap<>();
            demoData.put("message", "这是一条演示消息");
            demoData.put("type", "demo");
            
            SseMessage demoMessage = new SseMessage("demo", demoData);
            sendBroadcastMessage(demoMessage);
            
            Thread.sleep(1000);
            
            // 发送重要消息（会被过滤器处理）
            Map<String, Object> importantData = new HashMap<>();
            importantData.put("message", "这是一条重要消息");
            importantData.put("priority", "important");
            
            SseMessage importantMessage = new SseMessage("broadcast", importantData);
            sendBroadcastMessage(importantMessage);
            
            Thread.sleep(1000);
            
            // 发送普通消息（会被过滤器过滤）
            Map<String, Object> normalData = new HashMap<>();
            normalData.put("message", "这是一条普通消息");
            normalData.put("priority", "normal");
            
            SseMessage normalMessage = new SseMessage("broadcast", normalData);
            sendBroadcastMessage(normalMessage);
            
        } catch (Exception e) {
            logger.error("演示消息处理失败", e);
        }
    }
    
    /**
     * 演示自动消息生成
     */
    private void demonstrateAutomaticMessages() {
        logger.info("=== 演示自动消息生成 ===");
        
        scheduler = Executors.newScheduledThreadPool(2);
        
        // 定期发送心跳消息
        scheduler.scheduleAtFixedRate(() -> {
            try {
                Map<String, Object> heartbeatData = new HashMap<>();
                heartbeatData.put("timestamp", LocalDateTime.now().toString());
                heartbeatData.put("server", "demo-server");
                
                SseMessage heartbeat = new SseMessage("heartbeat", heartbeatData);
                sendBroadcastMessage(heartbeat);
            } catch (Exception e) {
                logger.error("发送心跳消息失败", e);
            }
        }, 2, 3, TimeUnit.SECONDS);
        
        // 定期发送状态更新
        scheduler.scheduleAtFixedRate(() -> {
            try {
                Map<String, Object> statusData = new HashMap<>();
                statusData.put("activeConnections", 2);
                statusData.put("messagesProcessed", processor.getStats().getQueueSize());
                statusData.put("uptime", "演示模式");
                
                SseMessage status = new SseMessage("status", statusData);
                sendBroadcastMessage(status);
            } catch (Exception e) {
                logger.error("发送状态更新失败", e);
            }
        }, 5, 5, TimeUnit.SECONDS);
    }
    
    /**
     * 发送广播消息
     */
    private void sendBroadcastMessage(SseMessage message) {
        String json = String.format(
            "{\"event\":\"%s\",\"data\":%s}",
            message.getEvent(),
            convertDataToJson(message.getData())
        );
        
        client1.sendHttpRequest("/api/sse/broadcast", "POST", json)
            .exceptionally(throwable -> {
                logger.error("发送广播消息失败", throwable);
                return null;
            });
    }
    
    /**
     * 将数据转换为JSON字符串
     */
    private String convertDataToJson(Object data) {
        if (data instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) data;
            StringBuilder json = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                if (!first) json.append(",");
                json.append("\"").append(entry.getKey()).append("\":\"")
                    .append(entry.getValue()).append("\"");
                first = false;
            }
            json.append("}");
            return json.toString();
        }
        return "\"" + data.toString() + "\"";
    }
    
    /**
     * 清理资源
     */
    private void cleanup() {
        logger.info("清理资源...");
        
        if (scheduler != null) {
            scheduler.shutdown();
        }
        
        if (client1 != null) {
            client1.close();
        }
        
        if (client2 != null) {
            client2.close();
        }
        
        if (processor != null) {
            processor.shutdown();
        }
        
        if (serverContext != null) {
            SseServerApplication.stopServer();
        }
        
        logger.info("资源清理完成");
    }
    
    /**
     * 获取处理器统计信息
     */
    public SseMessageProcessor.ProcessingStats getProcessorStats() {
        return processor != null ? processor.getStats() : null;
    }
    
    /**
     * 检查客户端连接状态
     */
    public boolean areClientsConnected() {
        return client1 != null && client1.isConnected() &&
               client2 != null && client2.isConnected();
    }
}