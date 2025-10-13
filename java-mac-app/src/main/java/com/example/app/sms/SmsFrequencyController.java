package com.example.app.sms;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SMS频率控制器
 * 实现以下功能：
 * 1. 10分钟内不能重复发短信给同一手机号
 * 2. 一个手机号一天最多发10条短信
 */
public class SmsFrequencyController {
    
    // 10分钟的间隔时间（毫秒）
    private static final long INTERVAL_MINUTES = 10;
    private static final long INTERVAL_MILLIS = INTERVAL_MINUTES * 60 * 1000;
    
    // 每天最大短信数量
    private static final int MAX_DAILY_SMS = 10;
    
    // 存储每个手机号的最后发送时间
    private final Map<String, LocalDateTime> lastSendTimeMap = new ConcurrentHashMap<>();
    
    // 存储每个手机号每天的发送记录
    private final Map<String, Map<LocalDate, Integer>> dailySendCountMap = new ConcurrentHashMap<>();
    
    // 存储所有发送记录（可选，用于审计）
    private final List<SmsRecord> smsRecords = Collections.synchronizedList(new ArrayList<>());

    /**
     * 检查是否可以向指定手机号发送短信
     * 
     * @param phoneNumber 手机号
     * @return 检查结果
     */
    public SmsValidationResult canSendSms(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return new SmsValidationResult(false, "手机号不能为空");
        }
        
        // 标准化手机号（移除空格和特殊字符）
        phoneNumber = normalizePhoneNumber(phoneNumber);
        
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        
        // 检查10分钟间隔限制
        LocalDateTime lastSendTime = lastSendTimeMap.get(phoneNumber);
        if (lastSendTime != null) {
            long timeDiff = java.time.Duration.between(lastSendTime, now).toMillis();
            if (timeDiff < INTERVAL_MILLIS) {
                long remainingMinutes = (INTERVAL_MILLIS - timeDiff) / (60 * 1000) + 1;
                return new SmsValidationResult(false, 
                    String.format("距离上次发送不足10分钟，请等待 %d 分钟后再试", remainingMinutes));
            }
        }
        
        // 检查每日发送限制
        Map<LocalDate, Integer> phoneCountMap = dailySendCountMap.computeIfAbsent(phoneNumber, 
            k -> new ConcurrentHashMap<>());
        int todayCount = phoneCountMap.getOrDefault(today, 0);
        
        if (todayCount >= MAX_DAILY_SMS) {
            return new SmsValidationResult(false, 
                String.format("今日已发送 %d 条短信，已达到每日最大限制（%d条）", todayCount, MAX_DAILY_SMS));
        }
        
        return new SmsValidationResult(true, 
            String.format("可以发送，今日已发送 %d/%d 条", todayCount, MAX_DAILY_SMS));
    }
    
    /**
     * 记录短信发送
     * 
     * @param phoneNumber 手机号
     * @param content 短信内容
     * @param messageId 消息ID
     * @return 是否记录成功
     */
    public boolean recordSmsSent(String phoneNumber, String content, String messageId) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return false;
        }
        
        phoneNumber = normalizePhoneNumber(phoneNumber);
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        
        // 更新最后发送时间
        lastSendTimeMap.put(phoneNumber, now);
        
        // 更新每日发送计数
        Map<LocalDate, Integer> phoneCountMap = dailySendCountMap.computeIfAbsent(phoneNumber, 
            k -> new ConcurrentHashMap<>());
        phoneCountMap.put(today, phoneCountMap.getOrDefault(today, 0) + 1);
        
        // 记录发送历史
        SmsRecord record = new SmsRecord(phoneNumber, now, content, messageId);
        smsRecords.add(record);
        
        // 清理过期数据（保留最近30天的数据）
        cleanupOldRecords();
        
        return true;
    }
    
    /**
     * 获取指定手机号的发送统计信息
     * 
     * @param phoneNumber 手机号
     * @return 统计信息
     */
    public SmsStatistics getStatistics(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return new SmsStatistics(phoneNumber, 0, null, 0);
        }
        
        final String normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
        LocalDate today = LocalDate.now();
        
        // 今日发送数量
        Map<LocalDate, Integer> phoneCountMap = dailySendCountMap.get(normalizedPhoneNumber);
        int todayCount = (phoneCountMap != null) ? phoneCountMap.getOrDefault(today, 0) : 0;
        
        // 最后发送时间
        LocalDateTime lastSendTime = lastSendTimeMap.get(normalizedPhoneNumber);
        
        // 总发送数量
        long totalCount = smsRecords.stream()
            .filter(record -> normalizedPhoneNumber.equals(record.getPhoneNumber()))
            .count();
        
        return new SmsStatistics(normalizedPhoneNumber, todayCount, lastSendTime, (int) totalCount);
    }
    
    /**
     * 获取所有手机号的发送统计
     * 
     * @return 统计信息列表
     */
    public List<SmsStatistics> getAllStatistics() {
        Set<String> allPhoneNumbers = new HashSet<>();
        allPhoneNumbers.addAll(lastSendTimeMap.keySet());
        allPhoneNumbers.addAll(dailySendCountMap.keySet());
        
        return allPhoneNumbers.stream()
            .map(this::getStatistics)
            .sorted((a, b) -> {
                // 按今日发送数量降序排列
                int countCompare = Integer.compare(b.getTodayCount(), a.getTodayCount());
                if (countCompare != 0) return countCompare;
                
                // 如果今日发送数量相同，按最后发送时间降序排列
                if (a.getLastSendTime() == null && b.getLastSendTime() == null) return 0;
                if (a.getLastSendTime() == null) return 1;
                if (b.getLastSendTime() == null) return -1;
                return b.getLastSendTime().compareTo(a.getLastSendTime());
            })
            .toList();
    }
    
    /**
     * 清理过期的记录数据
     */
    private void cleanupOldRecords() {
        LocalDate cutoffDate = LocalDate.now().minusDays(30);
        
        // 清理每日计数中的过期数据
        dailySendCountMap.values().forEach(dateCountMap -> 
            dateCountMap.entrySet().removeIf(entry -> entry.getKey().isBefore(cutoffDate))
        );
        
        // 清理发送记录中的过期数据
        smsRecords.removeIf(record -> record.getSendTime().toLocalDate().isBefore(cutoffDate));
    }
    
    /**
     * 标准化手机号格式
     * 
     * @param phoneNumber 原始手机号
     * @return 标准化后的手机号
     */
    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) return null;
        
        // 移除所有非数字字符
        String normalized = phoneNumber.replaceAll("[^0-9]", "");
        
        // 如果是11位数字且以1开头，认为是中国手机号
        if (normalized.length() == 11 && normalized.startsWith("1")) {
            return normalized;
        }
        
        // 如果是13位数字且以86开头，去掉国家代码
        if (normalized.length() == 13 && normalized.startsWith("86")) {
            return normalized.substring(2);
        }
        
        return normalized;
    }
    
    /**
     * 重置指定手机号的发送记录（仅用于测试或管理员操作）
     * 
     * @param phoneNumber 手机号
     */
    public void resetPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return;
        }
        
        final String normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
        lastSendTimeMap.remove(normalizedPhoneNumber);
        dailySendCountMap.remove(normalizedPhoneNumber);
        smsRecords.removeIf(record -> normalizedPhoneNumber.equals(record.getPhoneNumber()));
    }
    
    /**
     * 清空所有记录（仅用于测试或管理员操作）
     */
    public void clearAllRecords() {
        lastSendTimeMap.clear();
        dailySendCountMap.clear();
        smsRecords.clear();
    }
}