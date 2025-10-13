package com.example.app.service;

import com.example.app.model.SmsRecord;
import com.example.app.service.SmsRateLimiter.SmsStats;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * SMS服务类
 * 集成频率限制器，提供短信发送功能
 */
public class SmsService {
    
    private final SmsRateLimiter rateLimiter;
    private final ScheduledExecutorService cleanupScheduler;
    
    public SmsService() {
        this.rateLimiter = new SmsRateLimiter();
        this.cleanupScheduler = Executors.newSingleThreadScheduledExecutor();
        
        // 每小时清理一次过期记录
        cleanupScheduler.scheduleAtFixedRate(
                rateLimiter::cleanupExpiredRecords,
                1, 1, TimeUnit.HOURS
        );
        
        System.out.println("SMS服务已启动");
    }
    
    /**
     * 发送短信
     * @param phoneNumber 手机号
     * @param content 短信内容
     * @return 发送结果
     */
    public SmsResult sendSms(String phoneNumber, String content) {
        System.out.println("尝试发送短信到: " + phoneNumber + ", 内容: " + content);
        
        // 检查频率限制
        if (!rateLimiter.canSendSms(phoneNumber)) {
            SmsStats stats = rateLimiter.getSmsStats(phoneNumber);
            return new SmsResult(false, "发送失败: " + getFailureReason(stats), stats);
        }
        
        try {
            // 模拟短信发送（实际项目中这里应该调用真实的短信API）
            boolean sent = simulateSmsSending(phoneNumber, content);
            
            if (sent) {
                // 记录发送成功
                rateLimiter.recordSmsSent(phoneNumber, content);
                SmsStats stats = rateLimiter.getSmsStats(phoneNumber);
                System.out.println("短信发送成功: " + phoneNumber);
                return new SmsResult(true, "短信发送成功", stats);
            } else {
                System.out.println("短信发送失败: " + phoneNumber);
                return new SmsResult(false, "短信发送失败", rateLimiter.getSmsStats(phoneNumber));
            }
            
        } catch (Exception e) {
            System.out.println("发送短信时发生异常: " + e.getMessage());
            return new SmsResult(false, "发送异常: " + e.getMessage(), rateLimiter.getSmsStats(phoneNumber));
        }
    }
    
    /**
     * 模拟短信发送过程
     * 实际项目中应该替换为真实的短信API调用
     */
    private boolean simulateSmsSending(String phoneNumber, String content) {
        try {
            // 模拟网络延迟
            Thread.sleep(100 + (long)(Math.random() * 200));
            
            // 模拟发送成功率（95%）
            return Math.random() > 0.05;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
    
    /**
     * 获取失败原因描述
     */
    private String getFailureReason(SmsStats stats) {
        if (stats.getTodayCount() >= stats.getDailyLimit()) {
            return "今日发送数量已达上限(" + stats.getDailyLimit() + "条)";
        } else if (!stats.isCanSend() && stats.getMinutesUntilNextSend() > 0) {
            return "10分钟内已发送过短信，请等待" + stats.getMinutesUntilNextSend() + "分钟后再试";
        } else {
            return "未知原因";
        }
    }
    
    /**
     * 获取手机号的发送统计
     */
    public SmsStats getSmsStats(String phoneNumber) {
        return rateLimiter.getSmsStats(phoneNumber);
    }
    
    /**
     * 获取所有手机号的统计信息
     */
    public List<SmsStats> getAllSmsStats() {
        return rateLimiter.getAllStats().values().stream()
                .sorted((a, b) -> a.getPhoneNumber().compareTo(b.getPhoneNumber()))
                .toList();
    }
    
    /**
     * 检查是否可以发送短信
     */
    public boolean canSendSms(String phoneNumber) {
        return rateLimiter.canSendSms(phoneNumber);
    }
    
    /**
     * 关闭服务
     */
    public void shutdown() {
        cleanupScheduler.shutdown();
        try {
            if (!cleanupScheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                cleanupScheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            cleanupScheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
        System.out.println("SMS服务已关闭");
    }
    
    /**
     * 短信发送结果类
     */
    public static class SmsResult {
        private final boolean success;
        private final String message;
        private final SmsStats stats;
        private final LocalDateTime timestamp;
        
        public SmsResult(boolean success, String message, SmsStats stats) {
            this.success = success;
            this.message = message;
            this.stats = stats;
            this.timestamp = LocalDateTime.now();
        }
        
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public SmsStats getStats() { return stats; }
        public LocalDateTime getTimestamp() { return timestamp; }
        
        @Override
        public String toString() {
            return String.format("[%s] %s - %s (%s)",
                    timestamp.format(DateTimeFormatter.ofPattern("HH:mm:ss")),
                    success ? "成功" : "失败",
                    message,
                    stats != null ? stats.toString() : "无统计信息"
            );
        }
    }
}