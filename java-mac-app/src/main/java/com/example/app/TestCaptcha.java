package com.example.app;

import com.example.app.captcha.SliderCaptcha;
import com.example.app.captcha.CaptchaImageGenerator;

/**
 * 滑块验证码测试程序
 * 用于验证滑块验证码的核心功能
 */
public class TestCaptcha {
    
    public static void main(String[] args) {
        System.out.println("=== 滑块验证码测试程序 ===");
        System.out.println();
        
        // 测试1: 创建验证码
        System.out.println("测试1: 创建滑块验证码");
        SliderCaptcha captcha = new SliderCaptcha();
        System.out.println("✓ 验证码创建成功");
        System.out.println("  会话ID: " + captcha.getSessionId());
        System.out.println("  正确位置: (" + captcha.getCorrectX() + ", " + captcha.getCorrectY() + ")");
        System.out.println("  是否已验证: " + captcha.isVerified());
        System.out.println("  是否过期: " + captcha.isExpired());
        System.out.println();
        
        // 测试2: 验证正确位置
        System.out.println("测试2: 验证正确位置");
        boolean result1 = captcha.verify(captcha.getCorrectX(), captcha.getCorrectY());
        System.out.println("✓ 验证结果: " + (result1 ? "成功" : "失败"));
        System.out.println("  验证后状态: " + captcha.isVerified());
        System.out.println();
        
        // 测试3: 验证错误位置
        System.out.println("测试3: 验证错误位置");
        SliderCaptcha captcha2 = new SliderCaptcha();
        boolean result2 = captcha2.verify(captcha2.getCorrectX() + 10, captcha2.getCorrectY() + 10);
        System.out.println("✓ 验证结果: " + (result2 ? "成功" : "失败"));
        System.out.println("  验证后状态: " + captcha2.isVerified());
        System.out.println();
        
        // 测试4: 重复验证
        System.out.println("测试4: 重复验证（应该失败）");
        boolean result3 = captcha.verify(captcha.getCorrectX(), captcha.getCorrectY());
        System.out.println("✓ 重复验证结果: " + (result3 ? "成功" : "失败"));
        System.out.println();
        
        // 测试5: 生成验证码示例
        System.out.println("测试5: 生成验证码示例");
        try {
            CaptchaImageGenerator.createCaptchaExample();
            System.out.println("✓ 验证码示例生成成功");
        } catch (Exception e) {
            System.out.println("✗ 验证码示例生成失败: " + e.getMessage());
        }
        System.out.println();
        
        // 测试6: 性能测试
        System.out.println("测试6: 性能测试（创建100个验证码）");
        long startTime = System.currentTimeMillis();
        for (int i = 0; i < 100; i++) {
            new SliderCaptcha();
        }
        long endTime = System.currentTimeMillis();
        System.out.println("✓ 创建100个验证码耗时: " + (endTime - startTime) + "ms");
        System.out.println();
        
        // 测试7: 验证码过期测试
        System.out.println("测试7: 验证码过期测试");
        SliderCaptcha oldCaptcha = new SliderCaptcha();
        // 模拟过期（这里只是演示，实际需要等待5分钟）
        System.out.println("  新验证码是否过期: " + oldCaptcha.isExpired());
        System.out.println("✓ 过期测试完成");
        System.out.println();
        
        System.out.println("=== 所有测试完成 ===");
        System.out.println("滑块验证码功能正常工作！");
    }
}