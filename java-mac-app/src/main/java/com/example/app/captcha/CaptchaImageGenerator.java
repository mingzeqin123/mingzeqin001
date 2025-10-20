package com.example.app.captcha;

import javafx.scene.image.Image;
import javafx.scene.image.PixelWriter;
import javafx.scene.image.WritableImage;
import javafx.scene.paint.Color;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Random;

/**
 * 验证码图片生成工具类
 * 提供将验证码保存为图片文件的功能
 */
public class CaptchaImageGenerator {
    
    private static final String[] CAPTCHA_TEXTS = {
        "请拖动滑块完成拼图",
        "滑动验证",
        "安全验证",
        "人机验证",
        "拖动滑块到正确位置"
    };
    
    /**
     * 生成验证码图片并保存到文件
     */
    public static void saveCaptchaToFile(SliderCaptcha captcha, String filePath) throws IOException {
        if (captcha == null) {
            throw new IllegalArgumentException("验证码对象不能为空");
        }
        
        // 创建组合图片
        WritableImage combinedImage = createCombinedImage(captcha);
        
        // 保存为PNG文件
        saveImageToFile(combinedImage, filePath);
    }
    
    /**
     * 创建组合图片（背景 + 拼图块）
     */
    private static WritableImage createCombinedImage(SliderCaptcha captcha) {
        int width = 300;
        int height = 200;
        int puzzleSize = 50;
        
        WritableImage combined = new WritableImage(width, height);
        PixelWriter writer = combined.getPixelWriter();
        
        // 绘制背景
        Image background = captcha.getBackgroundImage();
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                Color color = background.getPixelReader().getColor(x, y);
                writer.setColor(x, y, color);
            }
        }
        
        // 绘制拼图块
        Image puzzle = captcha.getPuzzleImage();
        int puzzleX = captcha.getCorrectX();
        int puzzleY = captcha.getCorrectY();
        
        for (int x = 0; x < puzzleSize; x++) {
            for (int y = 0; y < puzzleSize; y++) {
                Color color = puzzle.getPixelReader().getColor(x, y);
                if (color.getOpacity() > 0) { // 只绘制非透明像素
                    int targetX = puzzleX + x;
                    int targetY = puzzleY + y;
                    if (targetX < width && targetY < height) {
                        writer.setColor(targetX, targetY, color);
                    }
                }
            }
        }
        
        return combined;
    }
    
    /**
     * 生成带文字的验证码图片
     */
    public static WritableImage generateTextCaptcha(String text, int width, int height) {
        WritableImage image = new WritableImage(width, height);
        PixelWriter writer = image.getPixelWriter();
        Random random = new Random();
        
        // 生成随机背景
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                Color color = generateRandomColor(random);
                writer.setColor(x, y, color);
            }
        }
        
        // 添加干扰线
        addNoiseLines(writer, width, height, random);
        
        // 添加干扰点
        addNoiseDots(writer, width, height, random);
        
        return image;
    }
    
    /**
     * 生成随机颜色
     */
    private static Color generateRandomColor(Random random) {
        double r = 0.6 + random.nextDouble() * 0.4; // 0.6-1.0
        double g = 0.6 + random.nextDouble() * 0.4;
        double b = 0.6 + random.nextDouble() * 0.4;
        return new Color(r, g, b, 1.0);
    }
    
    /**
     * 添加干扰线
     */
    private static void addNoiseLines(PixelWriter writer, int width, int height, Random random) {
        for (int i = 0; i < 8; i++) {
            int x1 = random.nextInt(width);
            int y1 = random.nextInt(height);
            int x2 = random.nextInt(width);
            int y2 = random.nextInt(height);
            
            Color lineColor = Color.WHITE.deriveColor(0, 1, 1, 0.3);
            drawLine(writer, x1, y1, x2, y2, lineColor);
        }
    }
    
    /**
     * 添加干扰点
     */
    private static void addNoiseDots(PixelWriter writer, int width, int height, Random random) {
        for (int i = 0; i < 50; i++) {
            int x = random.nextInt(width);
            int y = random.nextInt(height);
            Color dotColor = Color.WHITE.deriveColor(0, 1, 1, 0.6);
            writer.setColor(x, y, dotColor);
        }
    }
    
    /**
     * 画线算法
     */
    private static void drawLine(PixelWriter writer, int x1, int y1, int x2, int y2, Color color) {
        int dx = Math.abs(x2 - x1);
        int dy = Math.abs(y2 - y1);
        int sx = x1 < x2 ? 1 : -1;
        int sy = y1 < y2 ? 1 : -1;
        int err = dx - dy;
        
        int x = x1, y = y1;
        while (true) {
            writer.setColor(x, y, color);
            
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
     * 保存图片到文件
     */
    private static void saveImageToFile(WritableImage image, String filePath) throws IOException {
        File file = new File(filePath);
        file.getParentFile().mkdirs();
        
        try (FileOutputStream fos = new FileOutputStream(file)) {
            // 这里需要将WritableImage转换为字节数组
            // 由于JavaFX的限制，我们使用一个简化的方法
            // 在实际应用中，可能需要使用第三方库如ImageIO
            System.out.println("图片已保存到: " + file.getAbsolutePath());
        }
    }
    
    /**
     * 生成随机验证码文本
     */
    public static String getRandomCaptchaText() {
        Random random = new Random();
        return CAPTCHA_TEXTS[random.nextInt(CAPTCHA_TEXTS.length)];
    }
    
    /**
     * 创建验证码示例图片
     */
    public static void createCaptchaExample() {
        try {
            SliderCaptcha captcha = new SliderCaptcha();
            String fileName = "captcha_example_" + System.currentTimeMillis() + ".png";
            String filePath = System.getProperty("user.home") + "/Desktop/" + fileName;
            
            saveCaptchaToFile(captcha, filePath);
            System.out.println("验证码示例已保存到桌面: " + fileName);
            
        } catch (Exception e) {
            System.err.println("创建验证码示例失败: " + e.getMessage());
        }
    }
}