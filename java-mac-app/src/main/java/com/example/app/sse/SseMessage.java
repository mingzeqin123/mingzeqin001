package com.example.app.sse;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * SSE消息模型
 * 用于封装Server-Sent Events消息的数据结构
 */
public class SseMessage {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("event")
    private String event;
    
    @JsonProperty("data")
    private Object data;
    
    @JsonProperty("timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;
    
    @JsonProperty("retry")
    private Long retry;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    public SseMessage() {
        this.timestamp = LocalDateTime.now();
    }
    
    public SseMessage(String event, Object data) {
        this();
        this.event = event;
        this.data = data;
    }
    
    public SseMessage(String id, String event, Object data) {
        this(event, data);
        this.id = id;
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
    
    public Object getData() {
        return data;
    }
    
    public void setData(Object data) {
        this.data = data;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public Long getRetry() {
        return retry;
    }
    
    public void setRetry(Long retry) {
        this.retry = retry;
    }
    
    public Map<String, Object> getMetadata() {
        return metadata;
    }
    
    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
    
    @Override
    public String toString() {
        return "SseMessage{" +
                "id='" + id + '\'' +
                ", event='" + event + '\'' +
                ", data=" + data +
                ", timestamp=" + timestamp +
                ", retry=" + retry +
                ", metadata=" + metadata +
                '}';
    }
}