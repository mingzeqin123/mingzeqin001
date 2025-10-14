package com.example.app.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.sse.EventSource;
import okhttp3.sse.EventSourceListener;
import okhttp3.sse.EventSources;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * SSE客户端
 * 用于连接和接收Server-Sent Events
 */
public class SseClient {
    
    private static final Logger logger = LoggerFactory.getLogger(SseClient.class);
    
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, Consumer<SseMessage>> eventHandlers;
    private final ConcurrentHashMap<String, Consumer<String>> rawEventHandlers;
    
    private EventSource eventSource;
    private String serverUrl;
    private String clientId;
    private boolean connected = false;
    private Consumer<String> connectionStatusHandler;
    private Consumer<Exception> errorHandler;
    
    public SseClient() {
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(0, TimeUnit.SECONDS) // SSE需要长连接
                .writeTimeout(10, TimeUnit.SECONDS)
                .build();
        this.objectMapper = new ObjectMapper();
        this.eventHandlers = new ConcurrentHashMap<>();
        this.rawEventHandlers = new ConcurrentHashMap<>();
    }
    
    /**
     * 连接到SSE服务器
     */
    public CompletableFuture<Void> connect(String serverUrl, String clientId) {
        this.serverUrl = serverUrl;
        this.clientId = clientId;
        
        CompletableFuture<Void> future = new CompletableFuture<>();
        
        String url = serverUrl + "/api/sse/connect?clientId=" + clientId;
        Request request = new Request.Builder()
                .url(url)
                .header("Accept", "text/event-stream")
                .header("Cache-Control", "no-cache")
                .build();
        
        EventSourceListener listener = new EventSourceListener() {
            @Override
            public void onOpen(EventSource eventSource, Response response) {
                logger.info("SSE连接已建立: url={}, clientId={}", url, clientId);
                connected = true;
                if (connectionStatusHandler != null) {
                    connectionStatusHandler.accept("已连接");
                }
                future.complete(null);
            }
            
            @Override
            public void onEvent(EventSource eventSource, String id, String type, String data) {
                logger.debug("收到SSE事件: id={}, type={}, data={}", id, type, data);
                
                try {
                    // 处理原始事件
                    if (rawEventHandlers.containsKey(type)) {
                        rawEventHandlers.get(type).accept(data);
                    }
                    
                    // 处理结构化消息
                    if (eventHandlers.containsKey(type)) {
                        SseMessage message = new SseMessage();
                        message.setId(id);
                        message.setEvent(type);
                        message.setTimestamp(LocalDateTime.now());
                        
                        // 尝试解析JSON数据
                        try {
                            Object parsedData = objectMapper.readValue(data, Object.class);
                            message.setData(parsedData);
                        } catch (Exception e) {
                            // 如果不是JSON，直接使用字符串
                            message.setData(data);
                        }
                        
                        eventHandlers.get(type).accept(message);
                    }
                    
                    // 默认处理器
                    if (eventHandlers.containsKey("*")) {
                        SseMessage message = new SseMessage();
                        message.setId(id);
                        message.setEvent(type);
                        message.setTimestamp(LocalDateTime.now());
                        message.setData(data);
                        eventHandlers.get("*").accept(message);
                    }
                    
                } catch (Exception e) {
                    logger.error("处理SSE事件时出错", e);
                    if (errorHandler != null) {
                        errorHandler.accept(e);
                    }
                }
            }
            
            @Override
            public void onClosed(EventSource eventSource) {
                logger.info("SSE连接已关闭: clientId={}", clientId);
                connected = false;
                if (connectionStatusHandler != null) {
                    connectionStatusHandler.accept("连接已关闭");
                }
            }
            
            @Override
            public void onFailure(EventSource eventSource, Throwable t, Response response) {
                logger.error("SSE连接失败: clientId={}", clientId, t);
                connected = false;
                if (connectionStatusHandler != null) {
                    connectionStatusHandler.accept("连接失败: " + t.getMessage());
                }
                if (errorHandler != null && t instanceof Exception) {
                    errorHandler.accept((Exception) t);
                }
                if (!future.isDone()) {
                    future.completeExceptionally(t);
                }
            }
        };
        
        this.eventSource = EventSources.createFactory(httpClient).newEventSource(request, listener);
        
        return future;
    }
    
    /**
     * 断开连接
     */
    public void disconnect() {
        if (eventSource != null) {
            eventSource.cancel();
            eventSource = null;
        }
        connected = false;
        logger.info("SSE客户端已断开连接: clientId={}", clientId);
    }
    
    /**
     * 注册事件处理器
     */
    public void onEvent(String eventType, Consumer<SseMessage> handler) {
        eventHandlers.put(eventType, handler);
    }
    
    /**
     * 注册原始事件处理器
     */
    public void onRawEvent(String eventType, Consumer<String> handler) {
        rawEventHandlers.put(eventType, handler);
    }
    
    /**
     * 注册连接状态处理器
     */
    public void onConnectionStatus(Consumer<String> handler) {
        this.connectionStatusHandler = handler;
    }
    
    /**
     * 注册错误处理器
     */
    public void onError(Consumer<Exception> handler) {
        this.errorHandler = handler;
    }
    
    /**
     * 移除事件处理器
     */
    public void removeEventHandler(String eventType) {
        eventHandlers.remove(eventType);
    }
    
    /**
     * 移除原始事件处理器
     */
    public void removeRawEventHandler(String eventType) {
        rawEventHandlers.remove(eventType);
    }
    
    /**
     * 检查连接状态
     */
    public boolean isConnected() {
        return connected;
    }
    
    /**
     * 获取客户端ID
     */
    public String getClientId() {
        return clientId;
    }
    
    /**
     * 获取服务器URL
     */
    public String getServerUrl() {
        return serverUrl;
    }
    
    /**
     * 重新连接
     */
    public CompletableFuture<Void> reconnect() {
        if (serverUrl == null || clientId == null) {
            return CompletableFuture.failedFuture(
                new IllegalStateException("服务器URL和客户端ID不能为空"));
        }
        
        disconnect();
        return connect(serverUrl, clientId);
    }
    
    /**
     * 发送HTTP请求到服务器（用于发送消息等操作）
     */
    public CompletableFuture<String> sendHttpRequest(String endpoint, String method, String body) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Request.Builder requestBuilder = new Request.Builder()
                        .url(serverUrl + endpoint)
                        .header("Content-Type", "application/json");
                
                if ("POST".equalsIgnoreCase(method) && body != null) {
                    requestBuilder.post(okhttp3.RequestBody.create(
                        body, okhttp3.MediaType.get("application/json")));
                } else if ("DELETE".equalsIgnoreCase(method)) {
                    requestBuilder.delete();
                }
                
                try (Response response = httpClient.newCall(requestBuilder.build()).execute()) {
                    if (response.body() != null) {
                        return response.body().string();
                    }
                    return "";
                }
            } catch (IOException e) {
                throw new RuntimeException("HTTP请求失败", e);
            }
        });
    }
    
    /**
     * 关闭客户端并释放资源
     */
    public void close() {
        disconnect();
        httpClient.dispatcher().executorService().shutdown();
        httpClient.connectionPool().evictAll();
    }
}