package com.example.captcha;

import javafx.animation.TranslateTransition;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Cursor;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.image.PixelReader;
import javafx.scene.image.WritableImage;
import javafx.scene.layout.Pane;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;
import javafx.util.Duration;

import java.util.Random;

/**
 * 滑块验证码组件
 * 基于JavaFX实现的开源滑块验证码解决方案
 */
public class SliderCaptcha extends VBox {
    
    private static final int CAPTCHA_WIDTH = 350;
    private static final int CAPTCHA_HEIGHT = 200;
    private static final int PUZZLE_SIZE = 60;
    private static final int SLIDER_WIDTH = 300;
    private static final int SLIDER_HEIGHT = 40;
    
    private ImageView backgroundImageView;
    private ImageView puzzleImageView;
    private Rectangle slider;
    private Rectangle sliderTrack;
    private Label statusLabel;
    private Label instructionLabel;
    
    private double puzzleX;
    private double puzzleY;
    private double startX;
    private boolean isDragging = false;
    private boolean isVerified = false;
    
    private CaptchaVerificationListener verificationListener;
    
    public interface CaptchaVerificationListener {
        void onVerificationSuccess();
        void onVerificationFailed();
    }
    
    public SliderCaptcha() {
        initializeComponents();
        generateCaptcha();
        setupEventHandlers();
    }
    
    private void initializeComponents() {
        this.setSpacing(10);
        this.setPadding(new Insets(20));
        this.setAlignment(Pos.CENTER);
        
        // 说明标签
        instructionLabel = new Label("请拖动滑块完成验证");
        instructionLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #333;");
        
        // 验证码图片容器
        Pane captchaContainer = new Pane();
        captchaContainer.setPrefSize(CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
        captchaContainer.setStyle("-fx-border-color: #ddd; -fx-border-width: 1;");
        
        // 背景图片
        backgroundImageView = new ImageView();
        backgroundImageView.setFitWidth(CAPTCHA_WIDTH);
        backgroundImageView.setFitHeight(CAPTCHA_HEIGHT);
        backgroundImageView.setPreserveRatio(false);
        
        // 拼图块
        puzzleImageView = new ImageView();
        puzzleImageView.setFitWidth(PUZZLE_SIZE);
        puzzleImageView.setFitHeight(PUZZLE_SIZE);
        puzzleImageView.setPreserveRatio(false);
        
        captchaContainer.getChildren().addAll(backgroundImageView, puzzleImageView);
        
        // 滑块轨道
        sliderTrack = new Rectangle(SLIDER_WIDTH, SLIDER_HEIGHT);
        sliderTrack.setFill(Color.web("#f0f0f0"));
        sliderTrack.setStroke(Color.web("#ddd"));
        sliderTrack.setArcWidth(20);
        sliderTrack.setArcHeight(20);
        
        // 滑块
        slider = new Rectangle(SLIDER_HEIGHT, SLIDER_HEIGHT);
        slider.setFill(Color.web("#007AFF"));
        slider.setStroke(Color.web("#0056CC"));
        slider.setArcWidth(20);
        slider.setArcHeight(20);
        slider.setCursor(Cursor.HAND);
        
        // 滑块容器
        StackPane sliderContainer = new StackPane();
        sliderContainer.setPrefSize(SLIDER_WIDTH, SLIDER_HEIGHT);
        sliderContainer.getChildren().addAll(sliderTrack, slider);
        StackPane.setAlignment(slider, Pos.CENTER_LEFT);
        
        // 状态标签
        statusLabel = new Label("等待验证");
        statusLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #666;");
        
        this.getChildren().addAll(instructionLabel, captchaContainer, sliderContainer, statusLabel);
    }
    
    private void generateCaptcha() {
        // 生成随机背景图片（简单的渐变背景）
        WritableImage backgroundImage = createBackgroundImage();
        backgroundImageView.setImage(backgroundImage);
        
        // 随机生成拼图位置
        Random random = new Random();
        puzzleX = random.nextInt(CAPTCHA_WIDTH - PUZZLE_SIZE - 50) + 50;
        puzzleY = random.nextInt(CAPTCHA_HEIGHT - PUZZLE_SIZE - 20) + 20;
        
        // 创建拼图块
        WritableImage puzzleImage = createPuzzleImage(backgroundImage);
        puzzleImageView.setImage(puzzleImage);
        
        // 设置拼图块初始位置（左侧）
        puzzleImageView.setLayoutX(10);
        puzzleImageView.setLayoutY(puzzleY);
        
        // 在背景图上创建拼图缺口
        createPuzzleHole(backgroundImage);
        
        // 重置滑块位置
        resetSlider();
    }
    
    private WritableImage createBackgroundImage() {
        WritableImage image = new WritableImage(CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
        
        // 创建简单的渐变背景
        for (int x = 0; x < CAPTCHA_WIDTH; x++) {
            for (int y = 0; y < CAPTCHA_HEIGHT; y++) {
                double hue = (x + y) * 0.5 % 360;
                double saturation = 0.3;
                double brightness = 0.8 + (Math.sin(x * 0.02) * Math.sin(y * 0.02)) * 0.2;
                Color color = Color.hsb(hue, saturation, brightness);
                image.getPixelWriter().setColor(x, y, color);
            }
        }
        
        return image;
    }
    
    private WritableImage createPuzzleImage(WritableImage backgroundImage) {
        WritableImage puzzleImage = new WritableImage(PUZZLE_SIZE, PUZZLE_SIZE);
        PixelReader pixelReader = backgroundImage.getPixelReader();
        
        // 复制拼图区域的像素
        for (int x = 0; x < PUZZLE_SIZE; x++) {
            for (int y = 0; y < PUZZLE_SIZE; y++) {
                int sourceX = (int) (puzzleX + x);
                int sourceY = (int) (puzzleY + y);
                
                if (sourceX < CAPTCHA_WIDTH && sourceY < CAPTCHA_HEIGHT) {
                    Color color = pixelReader.getColor(sourceX, sourceY);
                    puzzleImage.getPixelWriter().setColor(x, y, color);
                }
            }
        }
        
        return puzzleImage;
    }
    
    private void createPuzzleHole(WritableImage backgroundImage) {
        // 在背景图上创建拼图缺口（变暗处理）
        for (int x = 0; x < PUZZLE_SIZE; x++) {
            for (int y = 0; y < PUZZLE_SIZE; y++) {
                int targetX = (int) (puzzleX + x);
                int targetY = (int) (puzzleY + y);
                
                if (targetX < CAPTCHA_WIDTH && targetY < CAPTCHA_HEIGHT) {
                    Color originalColor = backgroundImage.getPixelReader().getColor(targetX, targetY);
                    Color darkerColor = originalColor.darker().darker();
                    backgroundImage.getPixelWriter().setColor(targetX, targetY, darkerColor);
                }
            }
        }
    }
    
    private void setupEventHandlers() {
        slider.setOnMousePressed(event -> {
            if (!isVerified) {
                isDragging = true;
                startX = event.getSceneX();
                statusLabel.setText("拖动中...");
                statusLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #007AFF;");
            }
        });
        
        slider.setOnMouseDragged(event -> {
            if (isDragging && !isVerified) {
                double deltaX = event.getSceneX() - startX;
                double newX = Math.max(0, Math.min(SLIDER_WIDTH - SLIDER_HEIGHT, deltaX));
                
                slider.setTranslateX(newX);
                
                // 同步移动拼图块
                double puzzleNewX = 10 + (newX / (SLIDER_WIDTH - SLIDER_HEIGHT)) * (puzzleX - 10);
                puzzleImageView.setLayoutX(puzzleNewX);
            }
        });
        
        slider.setOnMouseReleased(event -> {
            if (isDragging && !isVerified) {
                isDragging = false;
                checkVerification();
            }
        });
    }
    
    private void checkVerification() {
        double currentX = slider.getTranslateX();
        double expectedX = (puzzleX - 10) / (CAPTCHA_WIDTH - 10) * (SLIDER_WIDTH - SLIDER_HEIGHT);
        double tolerance = 15; // 允许的误差范围
        
        if (Math.abs(currentX - expectedX) <= tolerance) {
            // 验证成功
            isVerified = true;
            statusLabel.setText("验证成功！");
            statusLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #28a745;");
            
            slider.setFill(Color.web("#28a745"));
            slider.setCursor(Cursor.DEFAULT);
            
            // 拼图块归位动画
            TranslateTransition transition = new TranslateTransition(Duration.millis(300), puzzleImageView);
            transition.setToX(puzzleX - 10);
            transition.play();
            
            if (verificationListener != null) {
                verificationListener.onVerificationSuccess();
            }
        } else {
            // 验证失败
            statusLabel.setText("验证失败，请重试");
            statusLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #dc3545;");
            
            // 滑块回弹动画
            TranslateTransition transition = new TranslateTransition(Duration.millis(300), slider);
            transition.setToX(0);
            transition.setOnFinished(e -> {
                resetSlider();
                generateCaptcha(); // 重新生成验证码
            });
            transition.play();
            
            if (verificationListener != null) {
                verificationListener.onVerificationFailed();
            }
        }
    }
    
    private void resetSlider() {
        slider.setTranslateX(0);
        slider.setFill(Color.web("#007AFF"));
        slider.setCursor(Cursor.HAND);
        isVerified = false;
        statusLabel.setText("等待验证");
        statusLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #666;");
    }
    
    public void refresh() {
        resetSlider();
        generateCaptcha();
    }
    
    public boolean isVerified() {
        return isVerified;
    }
    
    public void setVerificationListener(CaptchaVerificationListener listener) {
        this.verificationListener = listener;
    }
}