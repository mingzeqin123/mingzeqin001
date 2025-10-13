package com.example.app.sms;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * SMS统计信息类
 * 包含手机号的发送统计数据
 */
public class SmsStatistics {
    private final String phoneNumber;
    private final int todayCount;
    private final LocalDateTime lastSendTime;
    private final int totalCount;

    public SmsStatistics(String phoneNumber, int todayCount, LocalDateTime lastSendTime, int totalCount) {
        this.phoneNumber = phoneNumber;
        this.todayCount = todayCount;
        this.lastSendTime = lastSendTime;
        this.totalCount = totalCount;
    }

    /**
     * 获取手机号
     * 
     * @return 手机号
     */
    public String getPhoneNumber() {
        return phoneNumber;
    }

    /**
     * 获取今日发送数量
     * 
     * @return 今日发送数量
     */
    public int getTodayCount() {
        return todayCount;
    }

    /**
     * 获取最后发送时间
     * 
     * @return 最后发送时间，如果从未发送则为null
     */
    public LocalDateTime getLastSendTime() {
        return lastSendTime;
    }

    /**
     * 获取总发送数量
     * 
     * @return 总发送数量
     */
    public int getTotalCount() {
        return totalCount;
    }

    /**
     * 格式化最后发送时间
     * 
     * @return 格式化的时间字符串
     */
    public String getFormattedLastSendTime() {
        if (lastSendTime == null) {
            return "从未发送";
        }
        return lastSendTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    /**
     * 检查今日是否还可以发送
     * 
     * @return true表示今日还可以发送，false表示已达到每日限制
     */
    public boolean canSendToday() {
        return todayCount < 10; // MAX_DAILY_SMS = 10
    }

    /**
     * 获取今日剩余可发送数量
     * 
     * @return 今日剩余可发送数量
     */
    public int getRemainingTodayCount() {
        return Math.max(0, 10 - todayCount);
    }

    @Override
    public String toString() {
        return String.format("手机号: %s, 今日发送: %d/10, 总计发送: %d, 最后发送: %s",
                phoneNumber, todayCount, totalCount, getFormattedLastSendTime());
    }
}