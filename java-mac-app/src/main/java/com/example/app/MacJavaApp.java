package com.example.app;

import com.example.app.service.SmsService;
import com.example.app.service.SmsService.SmsResult;
import com.example.app.service.SmsRateLimiter.SmsStats;
import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * A simple JavaFX application for macOS
 * This application demonstrates a modern GUI with file operations and system integration
 */
public class MacJavaApp extends Application {

    private TextArea outputArea;
    private Label statusLabel;
    private SmsService smsService;
    
    // SMS相关控件
    private TextField phoneNumberField;
    private TextArea smsContentArea;
    private Button sendSmsButton;
    private Button checkStatsButton;
    private Button showAllStatsButton;

    @Override
    public void start(Stage primaryStage) {
        primaryStage.setTitle("Mac Java Application v1.0 - SMS管理");
        
        // 初始化SMS服务
        smsService = new SmsService();

        // Create the main layout
        VBox root = new VBox(10);
        root.setPadding(new Insets(20));
        root.setAlignment(Pos.TOP_CENTER);

        // Title
        Label titleLabel = new Label("SMS短信管理系统");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 24));
        titleLabel.setTextFill(Color.DARKBLUE);

        // Description
        Label descLabel = new Label("支持短信频率限制：10分钟内不重复发送，每日最多10条");
        descLabel.setFont(Font.font("System", 14));
        descLabel.setTextFill(Color.GRAY);

        // SMS输入区域
        VBox smsInputArea = createSmsInputArea();
        
        // Button panel
        HBox buttonPanel = new HBox(10);
        buttonPanel.setAlignment(Pos.CENTER);

        Button systemInfoButton = new Button("系统信息");
        Button clearButton = new Button("清空输出");

        // Style buttons
        String buttonStyle = "-fx-background-color: #007AFF; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;";
        systemInfoButton.setStyle(buttonStyle);
        clearButton.setStyle("-fx-background-color: #FF3B30; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;");

        buttonPanel.getChildren().addAll(systemInfoButton, clearButton);

        // Output area
        outputArea = new TextArea();
        outputArea.setEditable(false);
        outputArea.setPrefRowCount(15);
        outputArea.setWrapText(true);
        outputArea.setStyle("-fx-font-family: 'Monaco', 'Consolas', monospace; -fx-font-size: 12px;");

        // Status bar
        statusLabel = new Label("就绪");
        statusLabel.setStyle("-fx-background-color: #F0F0F0; -fx-padding: 5; -fx-font-size: 12px;");

        // Event handlers
        systemInfoButton.setOnAction(e -> showSystemInfo());
        clearButton.setOnAction(e -> clearOutput());

        // Add components to root
        root.getChildren().addAll(titleLabel, descLabel, smsInputArea, buttonPanel, outputArea, statusLabel);

        // Create scene
        Scene scene = new Scene(root, 800, 700);
        primaryStage.setScene(scene);
        primaryStage.setResizable(true);
        primaryStage.show();

        // Initial welcome message
        appendOutput("SMS短信管理系统启动成功！");
        appendOutput("当前时间: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        appendOutput("系统限制：10分钟内不重复发送，每日最多10条短信");
        updateStatus("SMS管理系统已启动");
    }
    
    /**
     * 创建SMS输入区域
     */
    private VBox createSmsInputArea() {
        VBox smsArea = new VBox(10);
        smsArea.setPadding(new Insets(15));
        smsArea.setStyle("-fx-background-color: #F8F9FA; -fx-border-color: #DEE2E6; -fx-border-width: 1; -fx-border-radius: 5;");
        
        // 标题
        Label smsTitle = new Label("短信发送");
        smsTitle.setFont(Font.font("System", FontWeight.BOLD, 16));
        smsTitle.setTextFill(Color.DARKBLUE);
        
        // 手机号输入
        HBox phoneRow = new HBox(10);
        phoneRow.setAlignment(Pos.CENTER_LEFT);
        Label phoneLabel = new Label("手机号:");
        phoneLabel.setMinWidth(80);
        phoneNumberField = new TextField();
        phoneNumberField.setPromptText("请输入手机号，如：13800138000");
        phoneNumberField.setPrefWidth(200);
        phoneRow.getChildren().addAll(phoneLabel, phoneNumberField);
        
        // 短信内容输入
        VBox contentRow = new VBox(5);
        Label contentLabel = new Label("短信内容:");
        smsContentArea = new TextArea();
        smsContentArea.setPromptText("请输入短信内容...");
        smsContentArea.setPrefRowCount(3);
        smsContentArea.setWrapText(true);
        contentRow.getChildren().addAll(contentLabel, smsContentArea);
        
        // 按钮区域
        HBox buttonRow = new HBox(10);
        buttonRow.setAlignment(Pos.CENTER);
        
        sendSmsButton = new Button("发送短信");
        checkStatsButton = new Button("查看统计");
        showAllStatsButton = new Button("查看所有统计");
        
        String smsButtonStyle = "-fx-background-color: #28A745; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 4;";
        String infoButtonStyle = "-fx-background-color: #17A2B8; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 4;";
        
        sendSmsButton.setStyle(smsButtonStyle);
        checkStatsButton.setStyle(infoButtonStyle);
        showAllStatsButton.setStyle(infoButtonStyle);
        
        buttonRow.getChildren().addAll(sendSmsButton, checkStatsButton, showAllStatsButton);
        
        // 事件处理
        sendSmsButton.setOnAction(e -> sendSms());
        checkStatsButton.setOnAction(e -> checkSmsStats());
        showAllStatsButton.setOnAction(e -> showAllSmsStats());
        
        smsArea.getChildren().addAll(smsTitle, phoneRow, contentRow, buttonRow);
        return smsArea;
    }

    /**
     * 发送短信
     */
    private void sendSms() {
        String phoneNumber = phoneNumberField.getText().trim();
        String content = smsContentArea.getText().trim();
        
        if (phoneNumber.isEmpty()) {
            appendOutput("错误：请输入手机号");
            updateStatus("发送失败：手机号为空");
            return;
        }
        
        if (content.isEmpty()) {
            appendOutput("错误：请输入短信内容");
            updateStatus("发送失败：内容为空");
            return;
        }
        
        // 检查手机号格式
        if (!isValidPhoneNumber(phoneNumber)) {
            appendOutput("错误：手机号格式不正确，请输入11位数字");
            updateStatus("发送失败：手机号格式错误");
            return;
        }
        
        updateStatus("正在发送短信...");
        sendSmsButton.setDisable(true);
        
        // 在新线程中发送短信，避免阻塞UI
        new Thread(() -> {
            try {
                SmsResult result = smsService.sendSms(phoneNumber, content);
                
                // 在UI线程中更新界面
                javafx.application.Platform.runLater(() -> {
                    if (result.isSuccess()) {
                        appendOutput("✓ " + result.toString());
                        phoneNumberField.clear();
                        smsContentArea.clear();
                        updateStatus("短信发送成功");
                    } else {
                        appendOutput("✗ " + result.toString());
                        updateStatus("短信发送失败");
                    }
                    sendSmsButton.setDisable(false);
                });
            } catch (Exception e) {
                javafx.application.Platform.runLater(() -> {
                    appendOutput("✗ 发送异常: " + e.getMessage());
                    updateStatus("发送异常");
                    sendSmsButton.setDisable(false);
                });
            }
        }).start();
    }
    
    /**
     * 检查手机号格式
     */
    private boolean isValidPhoneNumber(String phoneNumber) {
        // 简单的手机号验证：11位数字
        return phoneNumber.matches("^1[3-9]\\d{9}$");
    }
    
    /**
     * 查看指定手机号的统计信息
     */
    private void checkSmsStats() {
        String phoneNumber = phoneNumberField.getText().trim();
        if (phoneNumber.isEmpty()) {
            appendOutput("错误：请输入要查询的手机号");
            return;
        }
        
        if (!isValidPhoneNumber(phoneNumber)) {
            appendOutput("错误：手机号格式不正确");
            return;
        }
        
        SmsStats stats = smsService.getSmsStats(phoneNumber);
        appendOutput("=== 手机号统计信息 ===");
        appendOutput(stats.toString());
        updateStatus("统计信息已显示");
    }
    
    /**
     * 显示所有手机号的统计信息
     */
    private void showAllSmsStats() {
        List<SmsStats> allStats = smsService.getAllSmsStats();
        
        if (allStats.isEmpty()) {
            appendOutput("暂无短信发送记录");
            updateStatus("无统计信息");
            return;
        }
        
        appendOutput("=== 所有手机号统计信息 ===");
        for (SmsStats stats : allStats) {
            appendOutput(stats.toString());
        }
        updateStatus("所有统计信息已显示");
    }

    private void showSystemInfo() {
        appendOutput("=== 系统信息 ===");
        appendOutput("操作系统: " + System.getProperty("os.name"));
        appendOutput("系统版本: " + System.getProperty("os.version"));
        appendOutput("系统架构: " + System.getProperty("os.arch"));
        appendOutput("Java版本: " + System.getProperty("java.version"));
        appendOutput("Java供应商: " + System.getProperty("java.vendor"));
        appendOutput("用户名: " + System.getProperty("user.name"));
        appendOutput("用户主目录: " + System.getProperty("user.home"));
        appendOutput("工作目录: " + System.getProperty("user.dir"));
        appendOutput("可用处理器: " + Runtime.getRuntime().availableProcessors());
        appendOutput("最大内存: " + Runtime.getRuntime().maxMemory() / 1024 / 1024 + " MB");
        appendOutput("已用内存: " + (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024 / 1024 + " MB");
        updateStatus("系统信息已显示");
    }

    private void clearOutput() {
        outputArea.clear();
        updateStatus("输出已清空");
    }

    private void appendOutput(String text) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        outputArea.appendText("[" + timestamp + "] " + text + "\n");
    }

    private void updateStatus(String status) {
        statusLabel.setText("状态: " + status);
    }

    @Override
    public void stop() throws Exception {
        // 关闭SMS服务
        if (smsService != null) {
            smsService.shutdown();
        }
        super.stop();
    }

    public static void main(String[] args) {
        // Set system properties for better macOS integration
        System.setProperty("apple.laf.useScreenMenuBar", "true");
        System.setProperty("com.apple.mrj.application.apple.menu.about.name", "SMS管理系统");
        System.setProperty("apple.awt.application.name", "SMS管理系统");

        launch(args);
    }
}