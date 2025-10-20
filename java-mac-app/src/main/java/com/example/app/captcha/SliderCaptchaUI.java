package com.example.app.captcha;

import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.util.Duration;

/**
 * 滑块验证码UI组件
 * 提供用户交互界面
 */
public class SliderCaptchaUI extends VBox {
    
    private SliderCaptcha captcha;
    private ImageView backgroundImageView;
    private ImageView puzzleImageView;
    private Slider slider;
    private Label statusLabel;
    private Button refreshButton;
    private Button verifyButton;
    private Label instructionLabel;
    
    private boolean isDragging = false;
    private double puzzleStartX = 0;
    private double puzzleStartY = 0;
    private int currentPuzzleX = 0;
    private int currentPuzzleY = 0;
    
    private CaptchaCallback callback;
    
    public interface CaptchaCallback {
        void onSuccess();
        void onFailure();
        void onRefresh();
    }
    
    public SliderCaptchaUI() {
        initializeUI();
        createNewCaptcha();
    }
    
    public SliderCaptchaUI(CaptchaCallback callback) {
        this.callback = callback;
        initializeUI();
        createNewCaptcha();
    }
    
    /**
     * 初始化UI组件
     */
    private void initializeUI() {
        setSpacing(15);
        setPadding(new Insets(20));
        setAlignment(Pos.CENTER);
        setStyle("-fx-background-color: #f5f5f5; -fx-border-color: #ddd; -fx-border-width: 1; -fx-border-radius: 8;");
        
        // 标题
        Label titleLabel = new Label("滑块验证码");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 18));
        titleLabel.setTextFill(Color.DARKBLUE);
        
        // 说明文字
        instructionLabel = new Label("请拖动滑块完成拼图");
        instructionLabel.setFont(Font.font("System", 12));
        instructionLabel.setTextFill(Color.GRAY);
        
        // 验证码容器
        VBox captchaContainer = createCaptchaContainer();
        
        // 滑块
        slider = createSlider();
        
        // 按钮面板
        HBox buttonPanel = createButtonPanel();
        
        // 状态标签
        statusLabel = new Label("请拖动滑块完成验证");
        statusLabel.setFont(Font.font("System", 12));
        statusLabel.setTextFill(Color.BLUE);
        
        getChildren().addAll(titleLabel, instructionLabel, captchaContainer, slider, buttonPanel, statusLabel);
    }
    
    /**
     * 创建验证码容器
     */
    private VBox createCaptchaContainer() {
        VBox container = new VBox(5);
        container.setAlignment(Pos.CENTER);
        
        // 背景图片容器
        StackPane backgroundContainer = new StackPane();
        backgroundContainer.setStyle("-fx-border-color: #ccc; -fx-border-width: 1; -fx-border-radius: 4;");
        backgroundContainer.setPrefSize(300, 200);
        
        backgroundImageView = new ImageView();
        backgroundImageView.setFitWidth(300);
        backgroundImageView.setFitHeight(200);
        backgroundImageView.setPreserveRatio(false);
        
        // 拼图块容器
        StackPane puzzleContainer = new StackPane();
        puzzleContainer.setPrefSize(300, 200);
        
        puzzleImageView = new ImageView();
        puzzleImageView.setFitWidth(50);
        puzzleImageView.setFitHeight(50);
        puzzleImageView.setPreserveRatio(false);
        
        // 添加拖拽事件
        setupDragEvents(puzzleImageView);
        
        puzzleContainer.getChildren().add(puzzleImageView);
        backgroundContainer.getChildren().addAll(backgroundImageView, puzzleContainer);
        
        container.getChildren().add(backgroundContainer);
        
        return container;
    }
    
    /**
     * 设置拖拽事件
     */
    private void setupDragEvents(ImageView puzzleView) {
        puzzleView.setOnMousePressed(this::onMousePressed);
        puzzleView.setOnMouseDragged(this::onMouseDragged);
        puzzleView.setOnMouseReleased(this::onMouseReleased);
    }
    
    /**
     * 鼠标按下事件
     */
    private void onMousePressed(MouseEvent event) {
        isDragging = true;
        puzzleStartX = event.getSceneX() - puzzleImageView.getLayoutX();
        puzzleStartY = event.getSceneY() - puzzleImageView.getLayoutY();
        statusLabel.setText("正在拖动...");
        statusLabel.setTextFill(Color.ORANGE);
    }
    
    /**
     * 鼠标拖拽事件
     */
    private void onMouseDragged(MouseEvent event) {
        if (isDragging) {
            double newX = event.getSceneX() - puzzleStartX;
            double newY = event.getSceneY() - puzzleStartY;
            
            // 限制在背景图片范围内
            newX = Math.max(0, Math.min(newX, 300 - 50));
            newY = Math.max(0, Math.min(newY, 200 - 50));
            
            puzzleImageView.setLayoutX(newX);
            puzzleImageView.setLayoutY(newY);
            
            currentPuzzleX = (int) newX;
            currentPuzzleY = (int) newY;
            
            // 更新滑块位置
            slider.setValue(newX);
        }
    }
    
    /**
     * 鼠标释放事件
     */
    private void onMouseReleased(MouseEvent event) {
        if (isDragging) {
            isDragging = false;
            verifyCaptcha();
        }
    }
    
    /**
     * 创建滑块
     */
    private Slider createSlider() {
        Slider slider = new Slider(0, 250, 0);
        slider.setPrefWidth(300);
        slider.setShowTickLabels(false);
        slider.setShowTickMarks(false);
        slider.setStyle("-fx-control-inner-background: #e0e0e0;");
        
        slider.valueProperty().addListener((obs, oldVal, newVal) -> {
            if (!isDragging) {
                currentPuzzleX = newVal.intValue();
                puzzleImageView.setLayoutX(currentPuzzleX);
            }
        });
        
        return slider;
    }
    
    /**
     * 创建按钮面板
     */
    private HBox createButtonPanel() {
        HBox buttonPanel = new HBox(10);
        buttonPanel.setAlignment(Pos.CENTER);
        
        refreshButton = new Button("刷新");
        refreshButton.setStyle("-fx-background-color: #28a745; -fx-text-fill: white; -fx-padding: 8 16; -fx-background-radius: 4;");
        refreshButton.setOnAction(e -> refreshCaptcha());
        
        verifyButton = new Button("验证");
        verifyButton.setStyle("-fx-background-color: #007bff; -fx-text-fill: white; -fx-padding: 8 16; -fx-background-radius: 4;");
        verifyButton.setOnAction(e -> verifyCaptcha());
        
        buttonPanel.getChildren().addAll(refreshButton, verifyButton);
        
        return buttonPanel;
    }
    
    /**
     * 创建新的验证码
     */
    private void createNewCaptcha() {
        captcha = new SliderCaptcha();
        backgroundImageView.setImage(captcha.getBackgroundImage());
        puzzleImageView.setImage(captcha.getPuzzleImage());
        
        // 重置位置
        puzzleImageView.setLayoutX(0);
        puzzleImageView.setLayoutY(0);
        slider.setValue(0);
        currentPuzzleX = 0;
        currentPuzzleY = 0;
        
        statusLabel.setText("请拖动滑块完成验证");
        statusLabel.setTextFill(Color.BLUE);
        
        if (callback != null) {
            callback.onRefresh();
        }
    }
    
    /**
     * 刷新验证码
     */
    public void refreshCaptcha() {
        createNewCaptcha();
    }
    
    /**
     * 验证验证码
     */
    private void verifyCaptcha() {
        if (captcha == null) {
            showStatus("验证码未初始化", Color.RED);
            return;
        }
        
        if (captcha.isExpired()) {
            showStatus("验证码已过期，请刷新", Color.RED);
            return;
        }
        
        boolean isValid = captcha.verify(currentPuzzleX, currentPuzzleY);
        
        if (isValid) {
            showStatus("验证成功！", Color.GREEN);
            disableControls();
            
            if (callback != null) {
                callback.onSuccess();
            }
        } else {
            showStatus("验证失败，请重试", Color.RED);
            
            if (callback != null) {
                callback.onFailure();
            }
        }
    }
    
    /**
     * 显示状态信息
     */
    private void showStatus(String message, Color color) {
        statusLabel.setText(message);
        statusLabel.setTextFill(color);
        
        // 3秒后自动清除状态
        Timeline timeline = new Timeline(new KeyFrame(Duration.seconds(3), e -> {
            if (!captcha.isVerified()) {
                statusLabel.setText("请拖动滑块完成验证");
                statusLabel.setTextFill(Color.BLUE);
            }
        }));
        timeline.play();
    }
    
    /**
     * 禁用控件
     */
    private void disableControls() {
        puzzleImageView.setDisable(true);
        slider.setDisable(true);
        verifyButton.setDisable(true);
        refreshButton.setDisable(false);
    }
    
    /**
     * 启用控件
     */
    public void enableControls() {
        puzzleImageView.setDisable(false);
        slider.setDisable(false);
        verifyButton.setDisable(false);
        refreshButton.setDisable(false);
    }
    
    /**
     * 重置验证码
     */
    public void reset() {
        createNewCaptcha();
        enableControls();
    }
    
    /**
     * 检查是否已验证
     */
    public boolean isVerified() {
        return captcha != null && captcha.isVerified();
    }
    
    /**
     * 设置回调
     */
    public void setCallback(CaptchaCallback callback) {
        this.callback = callback;
    }
}