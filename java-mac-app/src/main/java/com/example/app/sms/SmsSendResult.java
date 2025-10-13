package com.example.app.sms;

/**
 * SMS发送结果类
 * 包含发送是否成功、结果消息和消息ID
 */
public class SmsSendResult {
    private final boolean success;
    private final String message;
    private final String messageId;

    public SmsSendResult(boolean success, String message, String messageId) {
        this.success = success;
        this.message = message;
        this.messageId = messageId;
    }

    /**
     * 是否发送成功
     * 
     * @return true表示发送成功，false表示发送失败
     */
    public boolean isSuccess() {
        return success;
    }

    /**
     * 获取结果消息
     * 
     * @return 结果消息
     */
    public String getMessage() {
        return message;
    }

    /**
     * 获取消息ID
     * 
     * @return 消息ID，发送失败时可能为null
     */
    public String getMessageId() {
        return messageId;
    }

    @Override
    public String toString() {
        return "SmsSendResult{" +
                "success=" + success +
                ", message='" + message + '\'' +
                ", messageId='" + messageId + '\'' +
                '}';
    }
}