package com.example.app.sms;

import java.util.Arrays;
import java.util.List;

/**
 * SMS频率控制功能测试类
 * 演示如何使用SMS服务和频率控制功能
 */
public class SmsFrequencyTest {

    public static void main(String[] args) {
        System.out.println("=== SMS频率控制功能测试 ===\n");
        
        SmsService smsService = new SmsService();
        
        // 测试1: 基本发送功能
        testBasicSending(smsService);
        
        // 测试2: 10分钟频率限制
        testFrequencyLimit(smsService);
        
        // 测试3: 每日发送限制
        testDailyLimit(smsService);
        
        // 测试4: 批量发送
        testBatchSending(smsService);
        
        // 测试5: 统计信息
        testStatistics(smsService);
        
        System.out.println("\n=== 测试完成 ===");
    }
    
    private static void testBasicSending(SmsService smsService) {
        System.out.println("1. 测试基本发送功能");
        System.out.println("-".repeat(40));
        
        String phoneNumber = "13800138000";
        String content = "这是一条测试短信";
        
        // 检查发送状态
        SmsValidationResult validation = smsService.canSendSms(phoneNumber);
        System.out.println("发送前检查: " + validation.getMessage());
        
        // 发送短信
        SmsSendResult result = smsService.sendSms(phoneNumber, content);
        System.out.println("发送结果: " + (result.isSuccess() ? "成功" : "失败"));
        System.out.println("消息: " + result.getMessage());
        if (result.getMessageId() != null) {
            System.out.println("消息ID: " + result.getMessageId());
        }
        
        System.out.println();
    }
    
    private static void testFrequencyLimit(SmsService smsService) {
        System.out.println("2. 测试10分钟频率限制");
        System.out.println("-".repeat(40));
        
        String phoneNumber = "13900139000";
        String content = "频率限制测试短信";
        
        // 第一次发送
        SmsSendResult result1 = smsService.sendSms(phoneNumber, content + " - 第1次");
        System.out.println("第1次发送: " + (result1.isSuccess() ? "成功" : "失败 - " + result1.getMessage()));
        
        // 立即第二次发送（应该失败）
        SmsSendResult result2 = smsService.sendSms(phoneNumber, content + " - 第2次");
        System.out.println("第2次发送: " + (result2.isSuccess() ? "成功" : "失败 - " + result2.getMessage()));
        
        // 检查状态
        SmsStatistics stats = smsService.getStatistics(phoneNumber);
        System.out.println("统计信息: " + stats);
        
        System.out.println();
    }
    
    private static void testDailyLimit(SmsService smsService) {
        System.out.println("3. 测试每日发送限制");
        System.out.println("-".repeat(40));
        
        String phoneNumber = "13700137000";
        String content = "每日限制测试短信";
        
        int successCount = 0;
        int failureCount = 0;
        
        // 尝试发送12条短信（超过每日限制10条）
        for (int i = 1; i <= 12; i++) {
            SmsSendResult result = smsService.sendSms(phoneNumber, content + " - 第" + i + "条");
            if (result.isSuccess()) {
                successCount++;
                System.out.println("第" + i + "条: 发送成功");
            } else {
                failureCount++;
                System.out.println("第" + i + "条: 发送失败 - " + result.getMessage());
            }
            
            // 模拟时间间隔，避免频率限制影响测试
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        System.out.println("测试结果: 成功 " + successCount + " 条, 失败 " + failureCount + " 条");
        
        SmsStatistics stats = smsService.getStatistics(phoneNumber);
        System.out.println("统计信息: " + stats);
        
        System.out.println();
    }
    
    private static void testBatchSending(SmsService smsService) {
        System.out.println("4. 测试批量发送");
        System.out.println("-".repeat(40));
        
        List<String> phoneNumbers = Arrays.asList(
            "13800138001", "13800138002", "13800138003", 
            "13800138004", "13800138005"
        );
        
        String content = "这是批量测试短信内容";
        
        SmsBatchSendResult result = smsService.batchSendSms(phoneNumbers, content);
        
        System.out.println("批量发送结果:");
        System.out.println("  成功: " + result.getSuccessCount() + " 条");
        System.out.println("  失败: " + result.getFailureCount() + " 条");
        System.out.println("  成功率: " + result.getSuccessRatePercentage());
        
        if (!result.getErrorMessages().isEmpty()) {
            System.out.println("  错误详情:");
            for (String error : result.getErrorMessages()) {
                System.out.println("    " + error);
            }
        }
        
        System.out.println();
    }
    
    private static void testStatistics(SmsService smsService) {
        System.out.println("5. 测试统计信息");
        System.out.println("-".repeat(40));
        
        List<SmsStatistics> allStats = smsService.getAllStatistics();
        
        System.out.println("所有手机号发送统计:");
        if (allStats.isEmpty()) {
            System.out.println("  暂无发送记录");
        } else {
            for (SmsStatistics stats : allStats) {
                System.out.println("  " + stats);
            }
        }
        
        System.out.println();
    }
}