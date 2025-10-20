package com.example.captcha;

import javafx.scene.image.WritableImage;
import javafx.scene.paint.Color;
import java.util.Random;

/**
 * 验证码工具类
 * 提供各种验证码生成和验证的辅助方法
 */
public class CaptchaUtils {
    
    private static final Random random = new Random();
    
    /**
     * 生成随机颜色
     */
    public static Color getRandomColor() {
        return Color.color(random.nextDouble(), random.nextDouble(), random.nextDouble());
    }
    
    /**
     * 生成随机HSB颜色
     */
    public static Color getRandomHSBColor(double saturation, double brightness) {
        double hue = random.nextDouble() * 360;
        return Color.hsb(hue, saturation, brightness);
    }
    
    /**
     * 创建纹理背景图片
     */
    public static WritableImage createTexturedBackground(int width, int height) {
        WritableImage image = new WritableImage(width, height);
        
        // 创建复杂纹理背景
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                // 使用多层噪声创建纹理
                double noise1 = Math.sin(x * 0.01) * Math.cos(y * 0.01);
                double noise2 = Math.sin(x * 0.03 + y * 0.02) * 0.5;
                double noise3 = Math.sin((x + y) * 0.005) * 0.3;
                
                double combined = (noise1 + noise2 + noise3) * 0.3 + 0.7;
                
                // 添加随机颜色变化
                double hue = (x * 0.5 + y * 0.3) % 360;
                double saturation = 0.2 + Math.abs(noise1) * 0.3;
                double brightness = Math.max(0.4, Math.min(0.9, combined));
                
                Color color = Color.hsb(hue, saturation, brightness);
                image.getPixelWriter().setColor(x, y, color);
            }
        }
        
        return image;
    }
    
    /**
     * 在图片上添加干扰线
     */
    public static void addInterferenceLines(WritableImage image, int lineCount) {
        int width = (int) image.getWidth();
        int height = (int) image.getHeight();
        
        for (int i = 0; i < lineCount; i++) {
            int x1 = random.nextInt(width);
            int y1 = random.nextInt(height);
            int x2 = random.nextInt(width);
            int y2 = random.nextInt(height);
            
            Color lineColor = getRandomHSBColor(0.8, 0.6);
            drawLine(image, x1, y1, x2, y2, lineColor);
        }
    }
    
    /**
     * 在图片上绘制线条
     */
    private static void drawLine(WritableImage image, int x1, int y1, int x2, int y2, Color color) {
        int dx = Math.abs(x2 - x1);
        int dy = Math.abs(y2 - y1);
        int sx = x1 < x2 ? 1 : -1;
        int sy = y1 < y2 ? 1 : -1;
        int err = dx - dy;
        
        int x = x1, y = y1;
        
        while (true) {
            if (x >= 0 && x < image.getWidth() && y >= 0 && y < image.getHeight()) {
                image.getPixelWriter().setColor(x, y, color);
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
     * 验证拼图位置是否正确
     */
    public static boolean verifyPuzzlePosition(double actualX, double expectedX, double tolerance) {
        return Math.abs(actualX - expectedX) <= tolerance;
    }
    
    /**
     * 计算拼图的形状路径（可用于更复杂的拼图形状）
     */
    public static boolean isInPuzzleShape(int x, int y, int size) {
        int centerX = size / 2;
        int centerY = size / 2;
        int radius = size / 3;
        
        // 简单的圆形拼图
        double distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        return distance <= radius;
    }
    
    /**
     * 生成随机拼图位置
     */
    public static class PuzzlePosition {
        public final double x;
        public final double y;
        
        public PuzzlePosition(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }
    
    public static PuzzlePosition generateRandomPuzzlePosition(int imageWidth, int imageHeight, int puzzleSize) {
        int minX = puzzleSize / 2 + 20;
        int maxX = imageWidth - puzzleSize / 2 - 20;
        int minY = puzzleSize / 2 + 20;
        int maxY = imageHeight - puzzleSize / 2 - 20;
        
        double x = minX + random.nextDouble() * (maxX - minX);
        double y = minY + random.nextDouble() * (maxY - minY);
        
        return new PuzzlePosition(x, y);
    }
}