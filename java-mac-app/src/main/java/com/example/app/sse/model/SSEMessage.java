package com.example.app.sse.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * SSE消息模型
 * 用于Server-Sent Events的消息传输
 */
public class SSEMessage {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("event")
    private String event;
    
    @JsonProperty("data")
    private String data;
    
    @JsonProperty("retry")
    private Long retry;
    
    @JsonProperty("timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    // 构造函数
    public SSEMessage() {
        this.timestamp = LocalDateTime.now();
    }
    
    public SSEMessage(String id, String event, String data) {
        this();
        this.id = id;
        this.event = event;
        this.data = data;
    }
    
    public SSEMessage(String id, String event, String data, Long retry) {
        this(id, event, data);
        this.retry = retry;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getEvent() {
        return event;
    }
    
    public void setEvent(String event) {
        this.event = event;
    }
    
    public String getData() {
        return data;
    }
    
    public void setData(String data) {
        this.data = data;
    }
    
    public Long getRetry() {
        return retry;
    }
    
    public void setRetry(Long retry) {
        this.retry = retry;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public Map<String, Object> getMetadata() {
        return metadata;
    }
    
    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
    
    /**
     * 将SSE消息转换为SSE格式的字符串
     */
    public String toSSEFormat() {
        StringBuilder sse = new StringBuilder();
        
        if (id != null) {
            sse.append("id: ").append(id).append("\n");
        }
        
        if (event != null) {
            sse.append("event: ").append(event).append("\n");
        }
        
        if (retry != null) {
            sse.append("retry: ").append(retry).append("\n");
        }
        
        if (data != null) {
            // 处理多行数据
            String[] lines = data.split("\n");
            for (String line : lines) {
                sse.append("data: ").append(line).append("\n");
            }
        }
        
        sse.append("\n"); // SSE消息结束标志
        
        return sse.toString();
    }
    
    @Override
    public String toString() {
        return "SSEMessage{" +
                "id='" + id + '\'' +
                ", event='" + event + '\'' +
                ", data='" + data + '\'' +
                ", retry=" + retry +
                ", timestamp=" + timestamp +
                ", metadata=" + metadata +
                '}';
    }
}