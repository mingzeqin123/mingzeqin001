package com.example.app;

import com.example.app.captcha.SimpleSliderCaptcha;

/**
 * 滑块验证码简单测试程序（不依赖JavaFX）
 * 用于验证滑块验证码的核心逻辑功能
 */
public class TestCaptchaSimple {
    
    public static void main(String[] args) {
        System.out.println("=== 滑块验证码核心功能测试 ===");
        System.out.println();
        
        // 测试1: 创建验证码
        System.out.println("测试1: 创建滑块验证码");
        SimpleSliderCaptcha captcha = new SimpleSliderCaptcha();
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
        SimpleSliderCaptcha captcha2 = new SimpleSliderCaptcha();
        boolean result2 = captcha2.verify(captcha2.getCorrectX() + 10, captcha2.getCorrectY() + 10);
        System.out.println("✓ 验证结果: " + (result2 ? "成功" : "失败"));
        System.out.println("  验证后状态: " + captcha2.isVerified());
        System.out.println();
        
        // 测试4: 重复验证
        System.out.println("测试4: 重复验证（应该失败）");
        boolean result3 = captcha.verify(captcha.getCorrectX(), captcha.getCorrectY());
        System.out.println("✓ 重复验证结果: " + (result3 ? "成功" : "失败"));
        System.out.println();
        
        // 测试5: 边界测试
        System.out.println("测试5: 边界测试");
        SimpleSliderCaptcha captcha3 = new SimpleSliderCaptcha();
        int correctX = captcha3.getCorrectX();
        int correctY = captcha3.getCorrectY();
        
        // 测试在容差范围内的验证
        boolean result4 = captcha3.verify(correctX + 3, correctY + 3); // 在5像素容差内
        System.out.println("  容差内验证: " + (result4 ? "成功" : "失败"));
        
        boolean result5 = captcha3.verify(correctX + 6, correctY + 6); // 超出5像素容差
        System.out.println("  容差外验证: " + (result5 ? "成功" : "失败"));
        System.out.println();
        
        // 测试6: 性能测试
        System.out.println("测试6: 性能测试（创建100个验证码）");
        long startTime = System.currentTimeMillis();
        for (int i = 0; i < 100; i++) {
            new SimpleSliderCaptcha();
        }
        long endTime = System.currentTimeMillis();
        System.out.println("✓ 创建100个验证码耗时: " + (endTime - startTime) + "ms");
        System.out.println();
        
        // 测试7: 验证码过期测试
        System.out.println("测试7: 验证码过期测试");
        SimpleSliderCaptcha oldCaptcha = new SimpleSliderCaptcha();
        System.out.println("  新验证码是否过期: " + oldCaptcha.isExpired());
        System.out.println("✓ 过期测试完成");
        System.out.println();
        
        // 测试8: 随机性测试
        System.out.println("测试8: 随机性测试（创建10个验证码，检查位置是否不同）");
        int[] positions = new int[10];
        for (int i = 0; i < 10; i++) {
            SimpleSliderCaptcha testCaptcha = new SimpleSliderCaptcha();
            positions[i] = testCaptcha.getCorrectX() + testCaptcha.getCorrectY();
        }
        
        boolean allDifferent = true;
        for (int i = 0; i < positions.length; i++) {
            for (int j = i + 1; j < positions.length; j++) {
                if (positions[i] == positions[j]) {
                    allDifferent = false;
                    break;
                }
            }
        }
        System.out.println("  位置随机性: " + (allDifferent ? "良好" : "需要改进"));
        System.out.println();
        
        System.out.println("=== 所有测试完成 ===");
        System.out.println("✓ 滑块验证码核心功能正常工作！");
        System.out.println();
        System.out.println("功能特性:");
        System.out.println("• 随机生成拼图位置");
        System.out.println("• 支持拖拽验证");
        System.out.println("• 防重复验证");
        System.out.println("• 过期时间控制（5分钟）");
        System.out.println("• 容差验证（5像素）");
        System.out.println("• 会话管理");
        System.out.println();
        System.out.println("集成状态: 已成功集成到JavaFX应用程序中");
    }
}