package com.example.app.sse.model;

/**
 * SSE消息类型枚举
 * 定义不同类型的消息事件
 */
public enum MessageType {
    
    // 系统消息
    SYSTEM_INFO("system.info", "系统信息"),
    SYSTEM_ERROR("system.error", "系统错误"),
    SYSTEM_WARNING("system.warning", "系统警告"),
    
    // 用户消息
    USER_MESSAGE("user.message", "用户消息"),
    USER_NOTIFICATION("user.notification", "用户通知"),
    USER_ALERT("user.alert", "用户警告"),
    
    // 数据消息
    DATA_UPDATE("data.update", "数据更新"),
    DATA_SYNC("data.sync", "数据同步"),
    DATA_EXPORT("data.export", "数据导出"),
    
    // 状态消息
    STATUS_CONNECTED("status.connected", "连接已建立"),
    STATUS_DISCONNECTED("status.disconnected", "连接已断开"),
    STATUS_RECONNECTING("status.reconnecting", "正在重连"),
    
    // 进度消息
    PROGRESS_START("progress.start", "任务开始"),
    PROGRESS_UPDATE("progress.update", "进度更新"),
    PROGRESS_COMPLETE("progress.complete", "任务完成"),
    PROGRESS_ERROR("progress.error", "任务失败"),
    
    // 心跳消息
    HEARTBEAT("heartbeat", "心跳检测"),
    
    // 自定义消息
    CUSTOM("custom", "自定义消息");
    
    private final String eventType;
    private final String description;
    
    MessageType(String eventType, String description) {
        this.eventType = eventType;
        this.description = description;
    }
    
    public String getEventType() {
        return eventType;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * 根据事件类型获取枚举值
     */
    public static MessageType fromEventType(String eventType) {
        for (MessageType type : values()) {
            if (type.eventType.equals(eventType)) {
                return type;
            }
        }
        return CUSTOM;
    }
    
    /**
     * 检查是否为系统消息
     */
    public boolean isSystemMessage() {
        return this.eventType.startsWith("system.");
    }
    
    /**
     * 检查是否为用户消息
     */
    public boolean isUserMessage() {
        return this.eventType.startsWith("user.");
    }
    
    /**
     * 检查是否为数据消息
     */
    public boolean isDataMessage() {
        return this.eventType.startsWith("data.");
    }
    
    /**
     * 检查是否为状态消息
     */
    public boolean isStatusMessage() {
        return this.eventType.startsWith("status.");
    }
    
    /**
     * 检查是否为进度消息
     */
    public boolean isProgressMessage() {
        return this.eventType.startsWith("progress.");
    }
}