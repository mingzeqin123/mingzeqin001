package com.example.app.sse.service;

import com.example.app.sse.model.SSEClient;
import com.example.app.sse.model.SSEMessage;
import com.example.app.sse.model.MessageType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * SSE服务类
 * 管理SSE连接和消息广播
 */
@Service
public class SSEService {
    
    private static final Logger logger = LoggerFactory.getLogger(SSEService.class);
    
    // 存储所有活跃的SSE连接
    private final Map<String, SSEClient> clients = new ConcurrentHashMap<>();
    
    // 存储每个客户端的消息队列
    private final Map<String, List<SSEMessage>> messageQueues = new ConcurrentHashMap<>();
    
    // 定时任务执行器
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    
    // 心跳间隔（秒）
    private static final int HEARTBEAT_INTERVAL = 30;
    
    // 连接超时时间（分钟）
    private static final int CONNECTION_TIMEOUT = 5;
    
    public SSEService() {
        // 启动心跳检测
        startHeartbeat();
        // 启动连接清理
        startConnectionCleanup();
    }
    
    /**
     * 注册新的SSE客户端
     */
    public SSEClient registerClient(String clientId, String sessionId, String userAgent, String remoteAddress) {
        SSEClient client = new SSEClient(clientId, sessionId);
        client.setUserAgent(userAgent);
        client.setRemoteAddress(remoteAddress);
        
        clients.put(clientId, client);
        messageQueues.put(clientId, new CopyOnWriteArrayList<>());
        
        logger.info("SSE客户端已注册: {} (会话: {})", clientId, sessionId);
        
        // 发送连接成功消息
        sendMessageToClient(clientId, MessageType.STATUS_CONNECTED, "连接已建立");
        
        return client;
    }
    
    /**
     * 注销SSE客户端
     */
    public void unregisterClient(String clientId) {
        SSEClient client = clients.remove(clientId);
        messageQueues.remove(clientId);
        
        if (client != null) {
            logger.info("SSE客户端已注销: {} (会话: {})", clientId, client.getSessionId());
        }
    }
    
    /**
     * 获取客户端信息
     */
    public SSEClient getClient(String clientId) {
        return clients.get(clientId);
    }
    
    /**
     * 获取所有活跃客户端
     */
    public Collection<SSEClient> getAllClients() {
        return clients.values();
    }
    
    /**
     * 获取活跃客户端数量
     */
    public int getActiveClientCount() {
        return clients.size();
    }
    
    /**
     * 向指定客户端发送消息
     */
    public void sendMessageToClient(String clientId, MessageType messageType, String data) {
        sendMessageToClient(clientId, messageType, data, null);
    }
    
    /**
     * 向指定客户端发送消息（带重试）
     */
    public void sendMessageToClient(String clientId, MessageType messageType, String data, Long retry) {
        SSEClient client = clients.get(clientId);
        if (client == null || !client.isActive()) {
            logger.warn("客户端不存在或已断开: {}", clientId);
            return;
        }
        
        SSEMessage message = new SSEMessage();
        message.setId(UUID.randomUUID().toString());
        message.setEvent(messageType.getEventType());
        message.setData(data);
        message.setRetry(retry);
        message.setTimestamp(LocalDateTime.now());
        
        List<SSEMessage> queue = messageQueues.get(clientId);
        if (queue != null) {
            queue.add(message);
            client.updateLastActivity();
            logger.debug("消息已发送到客户端 {}: {}", clientId, messageType.getEventType());
        }
    }
    
    /**
     * 向所有客户端广播消息
     */
    public void broadcastMessage(MessageType messageType, String data) {
        broadcastMessage(messageType, data, null);
    }
    
    /**
     * 向所有客户端广播消息（带重试）
     */
    public void broadcastMessage(MessageType messageType, String data, Long retry) {
        SSEMessage message = new SSEMessage();
        message.setId(UUID.randomUUID().toString());
        message.setEvent(messageType.getEventType());
        message.setData(data);
        message.setRetry(retry);
        message.setTimestamp(LocalDateTime.now());
        
        for (Map.Entry<String, SSEClient> entry : clients.entrySet()) {
            String clientId = entry.getKey();
            SSEClient client = entry.getValue();
            
            if (client.isActive()) {
                List<SSEMessage> queue = messageQueues.get(clientId);
                if (queue != null) {
                    queue.add(message);
                    client.updateLastActivity();
                }
            }
        }
        
        logger.info("消息已广播到 {} 个客户端: {}", clients.size(), messageType.getEventType());
    }
    
    /**
     * 获取客户端的待发送消息
     */
    public List<SSEMessage> getPendingMessages(String clientId) {
        List<SSEMessage> queue = messageQueues.get(clientId);
        if (queue == null) {
            return new ArrayList<>();
        }
        
        List<SSEMessage> messages = new ArrayList<>(queue);
        queue.clear(); // 清空队列
        
        // 更新客户端活动时间
        SSEClient client = clients.get(clientId);
        if (client != null) {
            client.updateLastActivity();
        }
        
        return messages;
    }
    
    /**
     * 启动心跳检测
     */
    private void startHeartbeat() {
        scheduler.scheduleAtFixedRate(() -> {
            try {
                broadcastMessage(MessageType.HEARTBEAT, "ping");
                logger.debug("心跳检测已发送");
            } catch (Exception e) {
                logger.error("心跳检测失败", e);
            }
        }, HEARTBEAT_INTERVAL, HEARTBEAT_INTERVAL, TimeUnit.SECONDS);
    }
    
    /**
     * 启动连接清理
     */
    private void startConnectionCleanup() {
        scheduler.scheduleAtFixedRate(() -> {
            try {
                List<String> timeoutClients = new ArrayList<>();
                
                for (Map.Entry<String, SSEClient> entry : clients.entrySet()) {
                    String clientId = entry.getKey();
                    SSEClient client = entry.getValue();
                    
                    if (client.isConnectionTimeout(CONNECTION_TIMEOUT)) {
                        timeoutClients.add(clientId);
                    }
                }
                
                // 清理超时连接
                for (String clientId : timeoutClients) {
                    unregisterClient(clientId);
                    logger.info("超时连接已清理: {}", clientId);
                }
                
                if (!timeoutClients.isEmpty()) {
                    logger.info("已清理 {} 个超时连接", timeoutClients.size());
                }
            } catch (Exception e) {
                logger.error("连接清理失败", e);
            }
        }, 1, 1, TimeUnit.MINUTES);
    }
    
    /**
     * 关闭服务
     */
    public void shutdown() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
        
        // 通知所有客户端服务关闭
        broadcastMessage(MessageType.SYSTEM_INFO, "服务正在关闭");
        
        clients.clear();
        messageQueues.clear();
        
        logger.info("SSE服务已关闭");
    }
}