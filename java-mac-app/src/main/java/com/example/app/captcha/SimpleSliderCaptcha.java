package com.example.app.captcha;

import java.util.Random;

/**
 * 简化版滑块验证码核心类（不依赖JavaFX）
 * 负责生成验证码逻辑、验证用户操作等核心功能
 */
public class SimpleSliderCaptcha {
    
    private static final int IMAGE_WIDTH = 300;
    private static final int IMAGE_HEIGHT = 200;
    private static final int PUZZLE_SIZE = 50;
    private static final int PUZZLE_RADIUS = 8;
    
    private int correctX;
    private int correctY;
    private String sessionId;
    private long createTime;
    private boolean isVerified;
    
    public SimpleSliderCaptcha() {
        this.sessionId = generateSessionId();
        this.createTime = System.currentTimeMillis();
        this.isVerified = false;
        generateCaptcha();
    }
    
    /**
     * 生成验证码
     */
    private void generateCaptcha() {
        Random random = new Random();
        
        // 随机生成拼图位置
        correctX = random.nextInt(IMAGE_WIDTH - PUZZLE_SIZE - 20) + 10;
        correctY = random.nextInt(IMAGE_HEIGHT - PUZZLE_SIZE - 20) + 10;
    }
    
    /**
     * 验证用户操作
     */
    public boolean verify(int userX, int userY) {
        if (isVerified) {
            return false; // 已经验证过了
        }
        
        // 检查是否在有效范围内（允许5像素的误差）
        int tolerance = 5;
        boolean xValid = Math.abs(userX - correctX) <= tolerance;
        boolean yValid = Math.abs(userY - correctY) <= tolerance;
        
        if (xValid && yValid) {
            isVerified = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * 检查验证码是否过期（5分钟）
     */
    public boolean isExpired() {
        return System.currentTimeMillis() - createTime > 5 * 60 * 1000;
    }
    
    /**
     * 生成会话ID
     */
    private String generateSessionId() {
        return "captcha_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);
    }
    
    // Getters
    public int getCorrectX() {
        return correctX;
    }
    
    public int getCorrectY() {
        return correctY;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public boolean isVerified() {
        return isVerified;
    }
    
    public int getImageWidth() {
        return IMAGE_WIDTH;
    }
    
    public int getImageHeight() {
        return IMAGE_HEIGHT;
    }
    
    public int getPuzzleSize() {
        return PUZZLE_SIZE;
    }
}