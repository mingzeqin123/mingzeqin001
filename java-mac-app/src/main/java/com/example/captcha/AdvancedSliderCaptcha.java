package com.example.captcha;

import javafx.animation.FadeTransition;
import javafx.animation.ScaleTransition;
import javafx.animation.TranslateTransition;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Cursor;
import javafx.scene.control.Label;
import javafx.scene.effect.DropShadow;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.image.PixelReader;
import javafx.scene.image.WritableImage;
import javafx.scene.layout.Pane;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.scene.shape.Rectangle;
import javafx.util.Duration;

import java.util.Random;

/**
 * 高级滑块验证码组件
 * 包含更多安全特性和视觉效果的滑块验证码
 */
public class AdvancedSliderCaptcha extends VBox {
    
    private static final int CAPTCHA_WIDTH = 400;
    private static final int CAPTCHA_HEIGHT = 240;
    private static final int PUZZLE_SIZE = 80;
    private static final int SLIDER_WIDTH = 350;
    private static final int SLIDER_HEIGHT = 50;
    
    private ImageView backgroundImageView;
    private ImageView puzzleImageView;
    private Rectangle slider;
    private Rectangle sliderTrack;
    private Label statusLabel;
    private Label instructionLabel;
    private Circle successIndicator;
    
    private double puzzleX;
    private double puzzleY;
    private double startX;
    private boolean isDragging = false;
    private boolean isVerified = false;
    private int attemptCount = 0;
    private long startTime;
    
    private CaptchaVerificationListener verificationListener;
    
    public interface CaptchaVerificationListener {
        void onVerificationSuccess();
        void onVerificationFailed();
        void onMaxAttemptsReached();
    }
    
    public AdvancedSliderCaptcha() {
        initializeComponents();
        generateCaptcha();
        setupEventHandlers();
    }
    
    private void initializeComponents() {
        this.setSpacing(15);
        this.setPadding(new Insets(25));
        this.setAlignment(Pos.CENTER);
        this.setStyle("-fx-background-color: #f8f9fa; -fx-background-radius: 10; -fx-border-color: #dee2e6; -fx-border-width: 1; -fx-border-radius: 10;");
        
        // 说明标签
        instructionLabel = new Label("请拖动滑块将拼图块放到正确位置");
        instructionLabel.setStyle("-fx-font-size: 16px; -fx-text-fill: #495057; -fx-font-weight: bold;");
        
        // 验证码图片容器
        Pane captchaContainer = new Pane();
        captchaContainer.setPrefSize(CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
        captchaContainer.setStyle("-fx-border-color: #ced4da; -fx-border-width: 2; -fx-border-radius: 8; -fx-background-color: white;");
        
        // 添加阴影效果
        DropShadow shadow = new DropShadow();
        shadow.setColor(Color.GRAY);
        shadow.setOffsetX(2);
        shadow.setOffsetY(2);
        shadow.setRadius(5);
        captchaContainer.setEffect(shadow);
        
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
        
        // 成功指示器
        successIndicator = new Circle(15);
        successIndicator.setFill(Color.web("#28a745"));
        successIndicator.setStroke(Color.WHITE);
        successIndicator.setStrokeWidth(3);
        successIndicator.setVisible(false);
        
        captchaContainer.getChildren().addAll(backgroundImageView, puzzleImageView, successIndicator);
        
        // 滑块轨道
        sliderTrack = new Rectangle(SLIDER_WIDTH, SLIDER_HEIGHT);
        sliderTrack.setFill(Color.web("#e9ecef"));
        sliderTrack.setStroke(Color.web("#ced4da"));
        sliderTrack.setStrokeWidth(2);
        sliderTrack.setArcWidth(25);
        sliderTrack.setArcHeight(25);
        
        // 滑块
        slider = new Rectangle(SLIDER_HEIGHT - 4, SLIDER_HEIGHT - 4);
        slider.setFill(Color.web("#007bff"));
        slider.setStroke(Color.web("#0056b3"));
        slider.setStrokeWidth(2);
        slider.setArcWidth(20);
        slider.setArcHeight(20);
        slider.setCursor(Cursor.HAND);
        
        // 滑块阴影效果
        DropShadow sliderShadow = new DropShadow();
        sliderShadow.setColor(Color.GRAY);
        sliderShadow.setOffsetX(1);
        sliderShadow.setOffsetY(1);
        sliderShadow.setRadius(3);
        slider.setEffect(sliderShadow);
        
        // 滑块容器
        StackPane sliderContainer = new StackPane();
        sliderContainer.setPrefSize(SLIDER_WIDTH, SLIDER_HEIGHT);
        sliderContainer.getChildren().addAll(sliderTrack, slider);
        StackPane.setAlignment(slider, Pos.CENTER_LEFT);
        
        // 状态标签
        statusLabel = new Label("等待验证 (尝试次数: 0/3)");
        statusLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #6c757d;");
        
        this.getChildren().addAll(instructionLabel, captchaContainer, sliderContainer, statusLabel);
    }
    
    private void generateCaptcha() {
        // 使用工具类生成更复杂的背景
        WritableImage backgroundImage = CaptchaUtils.createTexturedBackground(CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
        
        // 添加干扰线
        CaptchaUtils.addInterferenceLines(backgroundImage, 3);
        
        backgroundImageView.setImage(backgroundImage);
        
        // 生成随机拼图位置
        CaptchaUtils.PuzzlePosition position = CaptchaUtils.generateRandomPuzzlePosition(
            CAPTCHA_WIDTH, CAPTCHA_HEIGHT, PUZZLE_SIZE);
        puzzleX = position.x;
        puzzleY = position.y;
        
        // 创建更复杂的拼图块
        WritableImage puzzleImage = createAdvancedPuzzleImage(backgroundImage);
        puzzleImageView.setImage(puzzleImage);
        
        // 设置拼图块初始位置
        puzzleImageView.setLayoutX(15);
        puzzleImageView.setLayoutY(puzzleY);
        
        // 在背景图上创建拼图缺口
        createAdvancedPuzzleHole(backgroundImage);
        
        // 设置成功指示器位置
        successIndicator.setLayoutX(puzzleX + PUZZLE_SIZE / 2);
        successIndicator.setLayoutY(puzzleY + PUZZLE_SIZE / 2);
        successIndicator.setVisible(false);
        
        // 重置滑块
        resetSlider();
        startTime = System.currentTimeMillis();
    }
    
    private WritableImage createAdvancedPuzzleImage(WritableImage backgroundImage) {
        WritableImage puzzleImage = new WritableImage(PUZZLE_SIZE, PUZZLE_SIZE);
        PixelReader pixelReader = backgroundImage.getPixelReader();
        
        int centerX = PUZZLE_SIZE / 2;
        int centerY = PUZZLE_SIZE / 2;
        int radius = PUZZLE_SIZE / 3;
        
        // 创建圆形拼图块
        for (int x = 0; x < PUZZLE_SIZE; x++) {
            for (int y = 0; y < PUZZLE_SIZE; y++) {
                double distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                
                if (distance <= radius) {
                    int sourceX = (int) (puzzleX - PUZZLE_SIZE / 2 + x);
                    int sourceY = (int) (puzzleY - PUZZLE_SIZE / 2 + y);
                    
                    if (sourceX >= 0 && sourceX < CAPTCHA_WIDTH && sourceY >= 0 && sourceY < CAPTCHA_HEIGHT) {
                        Color color = pixelReader.getColor(sourceX, sourceY);
                        puzzleImage.getPixelWriter().setColor(x, y, color);
                    } else {
                        puzzleImage.getPixelWriter().setColor(x, y, Color.TRANSPARENT);
                    }
                } else {
                    puzzleImage.getPixelWriter().setColor(x, y, Color.TRANSPARENT);
                }
            }
        }
        
        return puzzleImage;
    }
    
    private void createAdvancedPuzzleHole(WritableImage backgroundImage) {
        int centerX = (int) puzzleX;
        int centerY = (int) puzzleY;
        int radius = PUZZLE_SIZE / 3;
        
        // 创建圆形缺口
        for (int x = -radius; x <= radius; x++) {
            for (int y = -radius; y <= radius; y++) {
                double distance = Math.sqrt(x * x + y * y);
                
                if (distance <= radius) {
                    int targetX = centerX + x;
                    int targetY = centerY + y;
                    
                    if (targetX >= 0 && targetX < CAPTCHA_WIDTH && targetY >= 0 && targetY < CAPTCHA_HEIGHT) {
                        Color originalColor = backgroundImage.getPixelReader().getColor(targetX, targetY);
                        Color holeColor = originalColor.darker().darker().darker();
                        backgroundImage.getPixelWriter().setColor(targetX, targetY, holeColor);
                    }
                }
            }
        }
    }
    
    private void setupEventHandlers() {
        slider.setOnMousePressed(event -> {
            if (!isVerified && attemptCount < 3) {
                isDragging = true;
                startX = event.getSceneX();
                statusLabel.setText("拖动中... (尝试次数: " + attemptCount + "/3)");
                statusLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #007bff;");
                
                // 滑块按下动画
                ScaleTransition scaleDown = new ScaleTransition(Duration.millis(100), slider);
                scaleDown.setToX(0.95);
                scaleDown.setToY(0.95);
                scaleDown.play();
            }
        });
        
        slider.setOnMouseDragged(event -> {
            if (isDragging && !isVerified && attemptCount < 3) {
                double deltaX = event.getSceneX() - startX;
                double newX = Math.max(0, Math.min(SLIDER_WIDTH - SLIDER_HEIGHT, deltaX));
                
                slider.setTranslateX(newX);
                
                // 同步移动拼图块，考虑圆形拼图的中心点
                double progress = newX / (SLIDER_WIDTH - SLIDER_HEIGHT);
                double puzzleNewX = 15 + progress * (puzzleX - 15 - PUZZLE_SIZE / 2);
                puzzleImageView.setLayoutX(puzzleNewX);
                
                // 滑块颜色渐变效果
                double colorProgress = Math.min(1.0, progress * 1.2);
                Color sliderColor = Color.web("#007bff").interpolate(Color.web("#28a745"), colorProgress);
                slider.setFill(sliderColor);
            }
        });
        
        slider.setOnMouseReleased(event -> {
            if (isDragging && !isVerified && attemptCount < 3) {
                isDragging = false;
                
                // 滑块释放动画
                ScaleTransition scaleUp = new ScaleTransition(Duration.millis(100), slider);
                scaleUp.setToX(1.0);
                scaleUp.setToY(1.0);
                scaleUp.play();
                
                checkAdvancedVerification();
            }
        });
    }
    
    private void checkAdvancedVerification() {
        double currentX = slider.getTranslateX();
        double expectedX = (puzzleX - 15 - PUZZLE_SIZE / 2) / (CAPTCHA_WIDTH - 15 - PUZZLE_SIZE / 2) * (SLIDER_WIDTH - SLIDER_HEIGHT);
        double tolerance = 20; // 允许的误差范围
        
        long timeTaken = System.currentTimeMillis() - startTime;
        
        // 检查时间是否过快（可能是机器人）
        if (timeTaken < 1000) {
            showFailure("操作过快，请重试");
            return;
        }
        
        if (CaptchaUtils.verifyPuzzlePosition(currentX, expectedX, tolerance)) {
            // 验证成功
            isVerified = true;
            statusLabel.setText("验证成功！耗时: " + (timeTaken / 1000.0) + " 秒");
            statusLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #28a745; -fx-font-weight: bold;");
            
            slider.setFill(Color.web("#28a745"));
            slider.setCursor(Cursor.DEFAULT);
            
            // 拼图块归位动画
            TranslateTransition puzzleTransition = new TranslateTransition(Duration.millis(500), puzzleImageView);
            puzzleTransition.setToX(puzzleX - PUZZLE_SIZE / 2);
            puzzleTransition.play();
            
            // 成功指示器动画
            successIndicator.setVisible(true);
            successIndicator.setScaleX(0);
            successIndicator.setScaleY(0);
            
            ScaleTransition successScale = new ScaleTransition(Duration.millis(300), successIndicator);
            successScale.setToX(1.0);
            successScale.setToY(1.0);
            successScale.play();
            
            if (verificationListener != null) {
                verificationListener.onVerificationSuccess();
            }
        } else {
            showFailure("位置不正确，请重试");
        }
    }
    
    private void showFailure(String message) {
        attemptCount++;
        
        if (attemptCount >= 3) {
            statusLabel.setText("验证失败次数过多，请刷新验证码");
            statusLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #dc3545; -fx-font-weight: bold;");
            slider.setCursor(Cursor.DEFAULT);
            slider.setFill(Color.web("#dc3545"));
            
            if (verificationListener != null) {
                verificationListener.onMaxAttemptsReached();
            }
        } else {
            statusLabel.setText(message + " (尝试次数: " + attemptCount + "/3)");
            statusLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #dc3545;");
            
            // 滑块回弹动画
            TranslateTransition sliderTransition = new TranslateTransition(Duration.millis(400), slider);
            sliderTransition.setToX(0);
            sliderTransition.setOnFinished(e -> {
                slider.setFill(Color.web("#007bff"));
                puzzleImageView.setLayoutX(15);
            });
            sliderTransition.play();
            
            if (verificationListener != null) {
                verificationListener.onVerificationFailed();
            }
        }
    }
    
    private void resetSlider() {
        slider.setTranslateX(0);
        slider.setFill(Color.web("#007bff"));
        slider.setCursor(Cursor.HAND);
        isVerified = false;
        attemptCount = 0;
        successIndicator.setVisible(false);
        statusLabel.setText("等待验证 (尝试次数: 0/3)");
        statusLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #6c757d;");
    }
    
    public void refresh() {
        resetSlider();
        generateCaptcha();
    }
    
    public boolean isVerified() {
        return isVerified;
    }
    
    public int getAttemptCount() {
        return attemptCount;
    }
    
    public void setVerificationListener(CaptchaVerificationListener listener) {
        this.verificationListener = listener;
    }
}