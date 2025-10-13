package com.example.app.sms;

import java.time.LocalDateTime;

/**
 * SMS发送记录实体类
 * 用于记录每条短信的发送信息
 */
public class SmsRecord {
    private String phoneNumber;
    private LocalDateTime sendTime;
    private String content;
    private String messageId;

    public SmsRecord(String phoneNumber, LocalDateTime sendTime, String content, String messageId) {
        this.phoneNumber = phoneNumber;
        this.sendTime = sendTime;
        this.content = content;
        this.messageId = messageId;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public LocalDateTime getSendTime() {
        return sendTime;
    }

    public void setSendTime(LocalDateTime sendTime) {
        this.sendTime = sendTime;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    @Override
    public String toString() {
        return "SmsRecord{" +
                "phoneNumber='" + phoneNumber + '\'' +
                ", sendTime=" + sendTime +
                ", content='" + content + '\'' +
                ", messageId='" + messageId + '\'' +
                '}';
    }
}