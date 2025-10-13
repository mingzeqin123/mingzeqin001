package com.example.app.model;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * SMS记录模型，用于跟踪短信发送记录
 */
public class SmsRecord {
    private String phoneNumber;
    private LocalDateTime sendTime;
    private String content;
    private boolean sent;

    public SmsRecord() {
    }

    public SmsRecord(String phoneNumber, LocalDateTime sendTime, String content, boolean sent) {
        this.phoneNumber = phoneNumber;
        this.sendTime = sendTime;
        this.content = content;
        this.sent = sent;
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

    public boolean isSent() {
        return sent;
    }

    public void setSent(boolean sent) {
        this.sent = sent;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SmsRecord smsRecord = (SmsRecord) o;
        return Objects.equals(phoneNumber, smsRecord.phoneNumber) &&
               Objects.equals(sendTime, smsRecord.sendTime);
    }

    @Override
    public int hashCode() {
        return Objects.hash(phoneNumber, sendTime);
    }

    @Override
    public String toString() {
        return "SmsRecord{" +
                "phoneNumber='" + phoneNumber + '\'' +
                ", sendTime=" + sendTime +
                ", content='" + content + '\'' +
                ", sent=" + sent +
                '}';
    }
}