package com.example.app.service;

import com.example.app.model.SmsRecord;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * SMS频率限制器
 * 实现以下限制：
 * 1. 10分钟内不能重复发送短信给同一个手机号
 * 2. 一个手机号一天最多发送10条短信
 */
public class SmsRateLimiter {
    
    // 10分钟限制（毫秒）
    private static final long COOLDOWN_MINUTES = 10;
    // 每日最大发送数量
    private static final int DAILY_MAX_COUNT = 10;
    
    // 存储每个手机号的发送记录
    private final Map<String, List<SmsRecord>> phoneRecords = new ConcurrentHashMap<>();
    
    /**
     * 检查是否可以发送短信
     * @param phoneNumber 手机号
     * @return 是否可以发送
     */
    public boolean canSendSms(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            System.out.println("警告：手机号为空，拒绝发送");
            return false;
        }
        
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        List<SmsRecord> records = phoneRecords.getOrDefault(normalizedPhone, new ArrayList<>());
        
        // 检查10分钟内是否已发送过
        if (isWithinCooldown(normalizedPhone)) {
            System.out.println("警告：手机号 " + normalizedPhone + " 在10分钟内已发送过短信，拒绝发送");
            return false;
        }
        
        // 检查今日发送数量是否已达上限
        if (getTodaySmsCount(normalizedPhone) >= DAILY_MAX_COUNT) {
            System.out.println("警告：手机号 " + normalizedPhone + " 今日发送数量已达上限(" + DAILY_MAX_COUNT + "条)，拒绝发送");
            return false;
        }
        
        return true;
    }
    
    /**
     * 记录短信发送
     * @param phoneNumber 手机号
     * @param content 短信内容
     * @return 是否发送成功
     */
    public boolean recordSmsSent(String phoneNumber, String content) {
        if (!canSendSms(phoneNumber)) {
            return false;
        }
        
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        SmsRecord record = new SmsRecord(normalizedPhone, LocalDateTime.now(), content, true);
        
        phoneRecords.computeIfAbsent(normalizedPhone, k -> new ArrayList<>()).add(record);
        
        System.out.println("短信发送记录已保存: 手机号=" + normalizedPhone + ", 内容=" + content);
        return true;
    }
    
    /**
     * 检查是否在冷却期内（10分钟内）
     */
    private boolean isWithinCooldown(String phoneNumber) {
        List<SmsRecord> records = phoneRecords.get(phoneNumber);
        if (records == null || records.isEmpty()) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        return records.stream()
                .anyMatch(record -> {
                    long minutesBetween = ChronoUnit.MINUTES.between(record.getSendTime(), now);
                    return minutesBetween < COOLDOWN_MINUTES;
                });
    }
    
    /**
     * 获取今日发送的短信数量
     */
    private int getTodaySmsCount(String phoneNumber) {
        List<SmsRecord> records = phoneRecords.get(phoneNumber);
        if (records == null) {
            return 0;
        }
        
        LocalDateTime today = LocalDateTime.now().toLocalDate().atStartOfDay();
        return (int) records.stream()
                .filter(record -> record.getSendTime().isAfter(today))
                .count();
    }
    
    /**
     * 标准化手机号格式
     */
    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return "";
        }
        // 移除所有非数字字符
        return phoneNumber.replaceAll("[^0-9]", "");
    }
    
    /**
     * 获取手机号的发送统计信息
     */
    public SmsStats getSmsStats(String phoneNumber) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        List<SmsRecord> records = phoneRecords.getOrDefault(normalizedPhone, new ArrayList<>());
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();
        LocalDateTime tenMinutesAgo = now.minusMinutes(COOLDOWN_MINUTES);
        
        int todayCount = (int) records.stream()
                .filter(record -> record.getSendTime().isAfter(today))
                .count();
        
        boolean canSend = canSendSms(phoneNumber);
        long minutesUntilNextSend = 0;
        
        if (!canSend && !records.isEmpty()) {
            Optional<SmsRecord> lastRecord = records.stream()
                    .max(Comparator.comparing(SmsRecord::getSendTime));
            
            if (lastRecord.isPresent()) {
                LocalDateTime nextAllowedTime = lastRecord.get().getSendTime().plusMinutes(COOLDOWN_MINUTES);
                if (nextAllowedTime.isAfter(now)) {
                    minutesUntilNextSend = ChronoUnit.MINUTES.between(now, nextAllowedTime);
                }
            }
        }
        
        return new SmsStats(normalizedPhone, todayCount, DAILY_MAX_COUNT, canSend, minutesUntilNextSend);
    }
    
    /**
     * 清理过期的记录（超过1天的记录）
     */
    public void cleanupExpiredRecords() {
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        
        phoneRecords.entrySet().removeIf(entry -> {
            List<SmsRecord> records = entry.getValue();
            records.removeIf(record -> record.getSendTime().isBefore(oneDayAgo));
            return records.isEmpty();
        });
        
        System.out.println("已清理过期的短信记录");
    }
    
    /**
     * 获取所有手机号的统计信息
     */
    public Map<String, SmsStats> getAllStats() {
        return phoneRecords.keySet().stream()
                .collect(Collectors.toMap(
                        phoneNumber -> phoneNumber,
                        this::getSmsStats
                ));
    }
    
    /**
     * SMS统计信息类
     */
    public static class SmsStats {
        private final String phoneNumber;
        private final int todayCount;
        private final int dailyLimit;
        private final boolean canSend;
        private final long minutesUntilNextSend;
        
        public SmsStats(String phoneNumber, int todayCount, int dailyLimit, boolean canSend, long minutesUntilNextSend) {
            this.phoneNumber = phoneNumber;
            this.todayCount = todayCount;
            this.dailyLimit = dailyLimit;
            this.canSend = canSend;
            this.minutesUntilNextSend = minutesUntilNextSend;
        }
        
        public String getPhoneNumber() { return phoneNumber; }
        public int getTodayCount() { return todayCount; }
        public int getDailyLimit() { return dailyLimit; }
        public boolean isCanSend() { return canSend; }
        public long getMinutesUntilNextSend() { return minutesUntilNextSend; }
        
        @Override
        public String toString() {
            return String.format("手机号: %s, 今日发送: %d/%d, 可发送: %s, 下次可发送: %d分钟后",
                    phoneNumber, todayCount, dailyLimit, canSend ? "是" : "否", minutesUntilNextSend);
        }
    }
}