package com.example.app.sse.client;

import com.example.app.sse.model.MessageType;
import com.example.app.sse.model.SSEMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

/**
 * SSE客户端处理器
 * 用于连接和处理Server-Sent Events
 */
public class SSEClientProcessor {
    
    private static final Logger logger = LoggerFactory.getLogger(SSEClientProcessor.class);
    
    private final String serverUrl;
    private final String clientId;
    private final String sessionId;
    private final ObjectMapper objectMapper;
    private final ExecutorService executor;
    
    private volatile boolean isConnected = false;
    private volatile boolean shouldStop = false;
    private HttpURLConnection connection;
    private BufferedReader reader;
    
    // 消息处理器
    private Consumer<SSEMessage> messageHandler;
    private Consumer<String> errorHandler;
    private Consumer<String> connectionHandler;
    
    public SSEClientProcessor(String serverUrl, String clientId, String sessionId) {
        this.serverUrl = serverUrl;
        this.clientId = clientId;
        this.sessionId = sessionId;
        this.objectMapper = new ObjectMapper();
        this.executor = Executors.newSingleThreadExecutor();
    }
    
    /**
     * 连接到SSE服务器
     */
    public void connect() {
        if (isConnected) {
            logger.warn("客户端已连接，无需重复连接");
            return;
        }
        
        executor.submit(() -> {
            try {
                establishConnection();
                processMessages();
            } catch (Exception e) {
                logger.error("SSE连接失败", e);
                if (errorHandler != null) {
                    errorHandler.accept("连接失败: " + e.getMessage());
                }
            } finally {
                cleanup();
            }
        });
    }
    
    /**
     * 建立HTTP连接
     */
    private void establishConnection() throws IOException {
        String url = String.format("%s/api/sse/connect?clientId=%s&sessionId=%s", 
                                 serverUrl, clientId, sessionId);
        
        URL sseUrl = new URL(url);
        connection = (HttpURLConnection) sseUrl.openConnection();
        
        // 设置SSE请求头
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Accept", "text/event-stream");
        connection.setRequestProperty("Cache-Control", "no-cache");
        connection.setRequestProperty("Connection", "keep-alive");
        connection.setRequestProperty("User-Agent", "Java-SSE-Client/1.0");
        
        // 设置超时
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(0); // 不设置读取超时，保持长连接
        
        connection.connect();
        
        int responseCode = connection.getResponseCode();
        if (responseCode != 200) {
            throw new IOException("HTTP错误: " + responseCode);
        }
        
        reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
        isConnected = true;
        
        logger.info("SSE连接已建立: {} (会话: {})", clientId, sessionId);
        
        if (connectionHandler != null) {
            connectionHandler.accept("连接已建立");
        }
    }
    
    /**
     * 处理SSE消息流
     */
    private void processMessages() throws IOException {
        StringBuilder messageBuffer = new StringBuilder();
        String line;
        
        while (!shouldStop && (line = reader.readLine()) != null) {
            if (line.trim().isEmpty()) {
                // 空行表示消息结束
                if (messageBuffer.length() > 0) {
                    processSSEMessage(messageBuffer.toString());
                    messageBuffer.setLength(0);
                }
            } else {
                messageBuffer.append(line).append("\n");
            }
        }
    }
    
    /**
     * 处理单个SSE消息
     */
    private void processSSEMessage(String rawMessage) {
        try {
            SSEMessage message = parseSSEMessage(rawMessage);
            
            logger.debug("收到SSE消息: {} - {}", message.getEvent(), message.getData());
            
            if (messageHandler != null) {
                messageHandler.accept(message);
            }
            
            // 处理特殊消息类型
            handleSpecialMessages(message);
            
        } catch (Exception e) {
            logger.error("处理SSE消息失败", e);
            if (errorHandler != null) {
                errorHandler.accept("消息处理失败: " + e.getMessage());
            }
        }
    }
    
    /**
     * 解析SSE消息
     */
    private SSEMessage parseSSEMessage(String rawMessage) {
        SSEMessage message = new SSEMessage();
        
        String[] lines = rawMessage.split("\n");
        for (String line : lines) {
            if (line.startsWith("id:")) {
                message.setId(line.substring(3).trim());
            } else if (line.startsWith("event:")) {
                message.setEvent(line.substring(6).trim());
            } else if (line.startsWith("data:")) {
                String data = line.substring(5).trim();
                if (message.getData() == null) {
                    message.setData(data);
                } else {
                    message.setData(message.getData() + "\n" + data);
                }
            } else if (line.startsWith("retry:")) {
                try {
                    message.setRetry(Long.parseLong(line.substring(6).trim()));
                } catch (NumberFormatException e) {
                    logger.warn("无效的重试时间: {}", line);
                }
            }
        }
        
        return message;
    }
    
    /**
     * 处理特殊消息类型
     */
    private void handleSpecialMessages(SSEMessage message) {
        MessageType messageType = MessageType.fromEventType(message.getEvent());
        
        switch (messageType) {
            case STATUS_CONNECTED:
                logger.info("服务器确认连接: {}", message.getData());
                break;
                
            case STATUS_DISCONNECTED:
                logger.info("服务器断开连接: {}", message.getData());
                disconnect();
                break;
                
            case HEARTBEAT:
                logger.debug("收到心跳: {}", message.getData());
                break;
                
            case SYSTEM_ERROR:
                logger.error("系统错误: {}", message.getData());
                break;
                
            case SYSTEM_WARNING:
                logger.warn("系统警告: {}", message.getData());
                break;
                
            default:
                // 其他消息类型由用户处理器处理
                break;
        }
    }
    
    /**
     * 断开连接
     */
    public void disconnect() {
        shouldStop = true;
        isConnected = false;
        
        logger.info("SSE连接已断开: {}", clientId);
        
        if (connectionHandler != null) {
            connectionHandler.accept("连接已断开");
        }
    }
    
    /**
     * 清理资源
     */
    private void cleanup() {
        try {
            if (reader != null) {
                reader.close();
            }
        } catch (IOException e) {
            logger.warn("关闭读取器失败", e);
        }
        
        try {
            if (connection != null) {
                connection.disconnect();
            }
        } catch (Exception e) {
            logger.warn("断开连接失败", e);
        }
        
        isConnected = false;
    }
    
    /**
     * 关闭客户端
     */
    public void close() {
        disconnect();
        executor.shutdown();
        logger.info("SSE客户端已关闭: {}", clientId);
    }
    
    // 设置处理器
    public void setMessageHandler(Consumer<SSEMessage> messageHandler) {
        this.messageHandler = messageHandler;
    }
    
    public void setErrorHandler(Consumer<String> errorHandler) {
        this.errorHandler = errorHandler;
    }
    
    public void setConnectionHandler(Consumer<String> connectionHandler) {
        this.connectionHandler = connectionHandler;
    }
    
    // 获取状态
    public boolean isConnected() {
        return isConnected;
    }
    
    public String getClientId() {
        return clientId;
    }
    
    public String getSessionId() {
        return sessionId;
    }
}