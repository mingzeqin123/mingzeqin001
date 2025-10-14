package com.example.app.sse.model;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * SSE客户端信息模型
 * 用于管理SSE连接和客户端状态
 */
public class SSEClient {
    
    private String clientId;
    private String sessionId;
    private String userAgent;
    private String remoteAddress;
    private LocalDateTime connectedAt;
    private LocalDateTime lastActivity;
    private boolean isActive;
    private Map<String, Object> attributes;
    
    public SSEClient() {
        this.connectedAt = LocalDateTime.now();
        this.lastActivity = LocalDateTime.now();
        this.isActive = true;
        this.attributes = new ConcurrentHashMap<>();
    }
    
    public SSEClient(String clientId, String sessionId) {
        this();
        this.clientId = clientId;
        this.sessionId = sessionId;
    }
    
    // Getters and Setters
    public String getClientId() {
        return clientId;
    }
    
    public void setClientId(String clientId) {
        this.clientId = clientId;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public String getUserAgent() {
        return userAgent;
    }
    
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
    
    public String getRemoteAddress() {
        return remoteAddress;
    }
    
    public void setRemoteAddress(String remoteAddress) {
        this.remoteAddress = remoteAddress;
    }
    
    public LocalDateTime getConnectedAt() {
        return connectedAt;
    }
    
    public void setConnectedAt(LocalDateTime connectedAt) {
        this.connectedAt = connectedAt;
    }
    
    public LocalDateTime getLastActivity() {
        return lastActivity;
    }
    
    public void setLastActivity(LocalDateTime lastActivity) {
        this.lastActivity = lastActivity;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
    
    public Map<String, Object> getAttributes() {
        return attributes;
    }
    
    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }
    
    /**
     * 更新最后活动时间
     */
    public void updateLastActivity() {
        this.lastActivity = LocalDateTime.now();
    }
    
    /**
     * 设置客户端属性
     */
    public void setAttribute(String key, Object value) {
        this.attributes.put(key, value);
    }
    
    /**
     * 获取客户端属性
     */
    public Object getAttribute(String key) {
        return this.attributes.get(key);
    }
    
    /**
     * 检查连接是否超时
     */
    public boolean isConnectionTimeout(int timeoutMinutes) {
        if (!isActive) {
            return true;
        }
        return lastActivity.isBefore(LocalDateTime.now().minusMinutes(timeoutMinutes));
    }
    
    @Override
    public String toString() {
        return "SSEClient{" +
                "clientId='" + clientId + '\'' +
                ", sessionId='" + sessionId + '\'' +
                ", userAgent='" + userAgent + '\'' +
                ", remoteAddress='" + remoteAddress + '\'' +
                ", connectedAt=" + connectedAt +
                ", lastActivity=" + lastActivity +
                ", isActive=" + isActive +
                '}';
    }
}