package com.example.app.sms;

/**
 * SMS验证结果类
 * 包含验证是否通过和相关消息
 */
public class SmsValidationResult {
    private final boolean canSend;
    private final String message;

    public SmsValidationResult(boolean canSend, String message) {
        this.canSend = canSend;
        this.message = message;
    }

    /**
     * 是否可以发送短信
     * 
     * @return true表示可以发送，false表示不能发送
     */
    public boolean canSend() {
        return canSend;
    }

    /**
     * 获取验证结果消息
     * 
     * @return 结果消息
     */
    public String getMessage() {
        return message;
    }

    @Override
    public String toString() {
        return "SmsValidationResult{" +
                "canSend=" + canSend +
                ", message='" + message + '\'' +
                '}';
    }
}