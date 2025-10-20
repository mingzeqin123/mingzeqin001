package com.example.app.captcha;

import javafx.scene.image.Image;
import javafx.scene.image.PixelWriter;
import javafx.scene.image.WritableImage;
import javafx.scene.paint.Color;

import java.util.Random;

/**
 * 滑块验证码核心类
 * 负责生成验证码图片、验证用户操作等核心功能
 */
public class SliderCaptcha {
    
    private static final int IMAGE_WIDTH = 300;
    private static final int IMAGE_HEIGHT = 200;
    private static final int PUZZLE_SIZE = 50;
    private static final int PUZZLE_RADIUS = 8;
    
    private Image backgroundImage;
    private Image puzzleImage;
    private int correctX;
    private int correctY;
    private String sessionId;
    private long createTime;
    private boolean isVerified;
    
    public SliderCaptcha() {
        this.sessionId = generateSessionId();
        this.createTime = System.currentTimeMillis();
        this.isVerified = false;
        generateCaptcha();
    }
    
    /**
     * 生成验证码图片
     */
    private void generateCaptcha() {
        Random random = new Random();
        
        // 生成背景图片
        backgroundImage = generateBackgroundImage();
        
        // 随机生成拼图位置
        correctX = random.nextInt(IMAGE_WIDTH - PUZZLE_SIZE - 20) + 10;
        correctY = random.nextInt(IMAGE_HEIGHT - PUZZLE_SIZE - 20) + 10;
        
        // 生成拼图块
        puzzleImage = generatePuzzleImage();
    }
    
    /**
     * 生成背景图片
     */
    private Image generateBackgroundImage() {
        WritableImage image = new WritableImage(IMAGE_WIDTH, IMAGE_HEIGHT);
        PixelWriter pixelWriter = image.getPixelWriter();
        Random random = new Random();
        
        // 生成随机背景
        for (int x = 0; x < IMAGE_WIDTH; x++) {
            for (int y = 0; y < IMAGE_HEIGHT; y++) {
                Color color = generateRandomColor(random);
                pixelWriter.setColor(x, y, color);
            }
        }
        
        // 添加一些装饰性元素
        addDecorativeElements(pixelWriter, random);
        
        return image;
    }
    
    /**
     * 生成拼图块图片
     */
    private Image generatePuzzleImage() {
        WritableImage image = new WritableImage(PUZZLE_SIZE, PUZZLE_SIZE);
        PixelWriter pixelWriter = image.getPixelWriter();
        
        // 从背景图片中提取拼图块
        for (int x = 0; x < PUZZLE_SIZE; x++) {
            for (int y = 0; y < PUZZLE_SIZE; y++) {
                int bgX = correctX + x;
                int bgY = correctY + y;
                
                if (bgX < IMAGE_WIDTH && bgY < IMAGE_HEIGHT) {
                    // 检查是否在拼图形状内
                    if (isInPuzzleShape(x, y)) {
                        Color color = backgroundImage.getPixelReader().getColor(bgX, bgY);
                        pixelWriter.setColor(x, y, color);
                    } else {
                        pixelWriter.setColor(x, y, Color.TRANSPARENT);
                    }
                }
            }
        }
        
        return image;
    }
    
    /**
     * 检查点是否在拼图形状内
     */
    private boolean isInPuzzleShape(int x, int y) {
        int centerX = PUZZLE_SIZE / 2;
        int centerY = PUZZLE_SIZE / 2;
        
        // 创建拼图形状（圆形 + 缺口）
        double distance = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
        
        // 主圆形
        if (distance <= PUZZLE_RADIUS) {
            return true;
        }
        
        // 添加缺口（右侧缺口）
        if (x >= centerX && x <= centerX + PUZZLE_RADIUS && 
            Math.abs(y - centerY) <= PUZZLE_RADIUS / 3) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 生成随机颜色
     */
    private Color generateRandomColor(Random random) {
        double r = 0.7 + random.nextDouble() * 0.3; // 0.7-1.0
        double g = 0.7 + random.nextDouble() * 0.3;
        double b = 0.7 + random.nextDouble() * 0.3;
        return new Color(r, g, b, 1.0);
    }
    
    /**
     * 添加装饰性元素
     */
    private void addDecorativeElements(PixelWriter pixelWriter, Random random) {
        // 添加一些随机线条
        for (int i = 0; i < 5; i++) {
            int x1 = random.nextInt(IMAGE_WIDTH);
            int y1 = random.nextInt(IMAGE_HEIGHT);
            int x2 = random.nextInt(IMAGE_WIDTH);
            int y2 = random.nextInt(IMAGE_HEIGHT);
            
            drawLine(pixelWriter, x1, y1, x2, y2, Color.WHITE.deriveColor(0, 1, 1, 0.3));
        }
        
        // 添加一些随机点
        for (int i = 0; i < 20; i++) {
            int x = random.nextInt(IMAGE_WIDTH);
            int y = random.nextInt(IMAGE_HEIGHT);
            pixelWriter.setColor(x, y, Color.WHITE.deriveColor(0, 1, 1, 0.5));
        }
    }
    
    /**
     * 画线
     */
    private void drawLine(PixelWriter pixelWriter, int x1, int y1, int x2, int y2, Color color) {
        int dx = Math.abs(x2 - x1);
        int dy = Math.abs(y2 - y1);
        int sx = x1 < x2 ? 1 : -1;
        int sy = y1 < y2 ? 1 : -1;
        int err = dx - dy;
        
        int x = x1, y = y1;
        while (true) {
            if (x >= 0 && x < IMAGE_WIDTH && y >= 0 && y < IMAGE_HEIGHT) {
                pixelWriter.setColor(x, y, color);
            }
            
            if (x == x2 && y == y2) break;
            
            int e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
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
    public Image getBackgroundImage() {
        return backgroundImage;
    }
    
    public Image getPuzzleImage() {
        return puzzleImage;
    }
    
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
}