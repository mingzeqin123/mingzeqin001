package com.example.app.test;

import com.example.app.service.SmsService;
import com.example.app.service.SmsService.SmsResult;
import com.example.app.service.SmsRateLimiter.SmsStats;

/**
 * SMS频率限制器测试类
 * 演示10分钟内不重复发送和每日10条限制的功能
 */
public class SmsRateLimiterTest {
    
    public static void main(String[] args) {
        System.out.println("=== SMS频率限制器测试 ===");
        
        SmsService smsService = new SmsService();
        String testPhone = "13800138000";
        
        try {
            // 测试1: 正常发送
            System.out.println("\n1. 测试正常发送短信...");
            SmsResult result1 = smsService.sendSms(testPhone, "测试短信1");
            System.out.println("结果: " + result1);
            
            // 测试2: 立即再次发送（应该被限制）
            System.out.println("\n2. 测试10分钟内重复发送...");
            SmsResult result2 = smsService.sendSms(testPhone, "测试短信2");
            System.out.println("结果: " + result2);
            
            // 测试3: 查看统计信息
            System.out.println("\n3. 查看统计信息...");
            SmsStats stats = smsService.getSmsStats(testPhone);
            System.out.println("统计: " + stats);
            
            // 测试4: 测试不同手机号
            System.out.println("\n4. 测试不同手机号...");
            String testPhone2 = "13900139000";
            SmsResult result3 = smsService.sendSms(testPhone2, "测试短信3");
            System.out.println("结果: " + result3);
            
            // 测试5: 查看所有统计
            System.out.println("\n5. 查看所有统计信息...");
            smsService.getAllSmsStats().forEach(System.out::println);
            
            // 测试6: 测试每日限制（模拟发送10条）
            System.out.println("\n6. 测试每日限制...");
            for (int i = 1; i <= 12; i++) {
                // 注意：这里需要修改时间才能测试每日限制
                // 实际测试中需要等待或修改系统时间
                SmsResult result = smsService.sendSms(testPhone, "批量测试短信" + i);
                System.out.println("第" + i + "条: " + (result.isSuccess() ? "成功" : "失败"));
                
                if (!result.isSuccess()) {
                    System.out.println("失败原因: " + result.getMessage());
                    break;
                }
            }
            
        } finally {
            // 关闭服务
            smsService.shutdown();
        }
        
        System.out.println("\n=== 测试完成 ===");
    }
}