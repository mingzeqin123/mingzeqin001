package com.example.app;

import com.example.captcha.SliderCaptcha;
import com.example.captcha.AdvancedSliderCaptcha;
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
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * A simple JavaFX application for macOS
 * This application demonstrates a modern GUI with file operations and system integration
 */
public class MacJavaApp extends Application {

    private TextArea outputArea;
    private Label statusLabel;

    @Override
    public void start(Stage primaryStage) {
        primaryStage.setTitle("Mac Java Application v1.0");

        // Create the main layout
        VBox root = new VBox(10);
        root.setPadding(new Insets(20));
        root.setAlignment(Pos.TOP_CENTER);

        // Title
        Label titleLabel = new Label("欢迎使用 Mac Java 应用程序");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 24));
        titleLabel.setTextFill(Color.DARKBLUE);

        // Description
        Label descLabel = new Label("这是一个为macOS设计的Java应用程序示例");
        descLabel.setFont(Font.font("System", 14));
        descLabel.setTextFill(Color.GRAY);

        // Button panel
        HBox buttonPanel = new HBox(10);
        buttonPanel.setAlignment(Pos.CENTER);

        Button helloButton = new Button("问候消息");
        Button fileButton = new Button("选择文件");
        Button systemInfoButton = new Button("系统信息");
        Button captchaButton = new Button("基础验证码");
        Button advancedCaptchaButton = new Button("高级验证码");
        Button clearButton = new Button("清空输出");

        // Style buttons
        String buttonStyle = "-fx-background-color: #007AFF; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 5;";
        helloButton.setStyle(buttonStyle);
        fileButton.setStyle(buttonStyle);
        systemInfoButton.setStyle(buttonStyle);
        captchaButton.setStyle("-fx-background-color: #28a745; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 5;");
        advancedCaptchaButton.setStyle("-fx-background-color: #17a2b8; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 5;");
        clearButton.setStyle("-fx-background-color: #FF3B30; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 5;");

        // Create two rows of buttons for better layout
        VBox buttonContainer = new VBox(10);
        HBox topButtonRow = new HBox(10);
        HBox bottomButtonRow = new HBox(10);
        
        topButtonRow.setAlignment(Pos.CENTER);
        bottomButtonRow.setAlignment(Pos.CENTER);
        
        topButtonRow.getChildren().addAll(helloButton, fileButton, systemInfoButton);
        bottomButtonRow.getChildren().addAll(captchaButton, advancedCaptchaButton, clearButton);
        
        buttonContainer.getChildren().addAll(topButtonRow, bottomButtonRow);
        buttonContainer.setAlignment(Pos.CENTER);

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
        helloButton.setOnAction(e -> showGreeting());
        fileButton.setOnAction(e -> selectFile(primaryStage));
        systemInfoButton.setOnAction(e -> showSystemInfo());
        captchaButton.setOnAction(e -> showCaptchaDialog(primaryStage));
        advancedCaptchaButton.setOnAction(e -> showAdvancedCaptchaDialog(primaryStage));
        clearButton.setOnAction(e -> clearOutput());

        // Add components to root
        root.getChildren().addAll(titleLabel, descLabel, buttonContainer, outputArea, statusLabel);

        // Create scene
        Scene scene = new Scene(root, 750, 550);
        primaryStage.setScene(scene);
        primaryStage.setResizable(true);
        primaryStage.show();

        // Initial welcome message
        appendOutput("应用程序启动成功！");
        appendOutput("当前时间: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        updateStatus("应用程序已启动");
    }

    private void showGreeting() {
        String greeting = "你好！欢迎使用这个Java应用程序！\n" +
                         "这个程序演示了:\n" +
                         "• JavaFX GUI界面\n" +
                         "• 文件选择功能\n" +
                         "• 系统信息显示\n" +
                         "• 基础滑块验证码组件\n" +
                         "• 高级滑块验证码 (包含反机器人检测)\n" +
                         "• macOS集成\n\n" +
                         "🔒 验证码特性:\n" +
                         "  - 基础版本: 简单的拖拽验证\n" +
                         "  - 高级版本: 时间检测、尝试次数限制、视觉效果";
        appendOutput(greeting);
        updateStatus("显示问候消息");
    }

    private void selectFile(Stage stage) {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("选择文件");
        fileChooser.getExtensionFilters().addAll(
                new FileChooser.ExtensionFilter("所有文件", "*.*"),
                new FileChooser.ExtensionFilter("文本文件", "*.txt"),
                new FileChooser.ExtensionFilter("图片文件", "*.png", "*.jpg", "*.gif")
        );

        File selectedFile = fileChooser.showOpenDialog(stage);
        if (selectedFile != null) {
            appendOutput("选择的文件: " + selectedFile.getAbsolutePath());
            appendOutput("文件大小: " + selectedFile.length() + " 字节");
            appendOutput("文件可读: " + (selectedFile.canRead() ? "是" : "否"));
            updateStatus("文件已选择: " + selectedFile.getName());
        } else {
            updateStatus("文件选择已取消");
        }
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

    private void showCaptchaDialog(Stage parentStage) {
        Stage captchaStage = new Stage();
        captchaStage.initModality(Modality.APPLICATION_MODAL);
        captchaStage.initOwner(parentStage);
        captchaStage.setTitle("滑块验证码演示");
        captchaStage.setResizable(false);
        
        VBox dialogRoot = new VBox(20);
        dialogRoot.setPadding(new Insets(20));
        dialogRoot.setAlignment(Pos.CENTER);
        
        // 标题
        Label titleLabel = new Label("安全验证");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 18));
        titleLabel.setTextFill(Color.DARKBLUE);
        
        // 创建滑块验证码
        SliderCaptcha captcha = new SliderCaptcha();
        
        // 按钮面板
        HBox buttonPanel = new HBox(10);
        buttonPanel.setAlignment(Pos.CENTER);
        
        Button refreshButton = new Button("刷新验证码");
        Button closeButton = new Button("关闭");
        
        refreshButton.setStyle("-fx-background-color: #6c757d; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 4;");
        closeButton.setStyle("-fx-background-color: #dc3545; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 4;");
        
        buttonPanel.getChildren().addAll(refreshButton, closeButton);
        
        // 事件处理
        refreshButton.setOnAction(e -> {
            captcha.refresh();
            appendOutput("验证码已刷新");
        });
        
        closeButton.setOnAction(e -> captchaStage.close());
        
        // 验证结果监听
        captcha.setVerificationListener(new SliderCaptcha.CaptchaVerificationListener() {
            @Override
            public void onVerificationSuccess() {
                appendOutput("✅ 滑块验证码验证成功！");
                updateStatus("验证码验证通过");
                
                // 延迟关闭对话框
                javafx.animation.PauseTransition pause = new javafx.animation.PauseTransition(javafx.util.Duration.seconds(1.5));
                pause.setOnFinished(event -> captchaStage.close());
                pause.play();
            }
            
            @Override
            public void onVerificationFailed() {
                appendOutput("❌ 滑块验证码验证失败，请重试");
                updateStatus("验证码验证失败");
            }
        });
        
        dialogRoot.getChildren().addAll(titleLabel, captcha, buttonPanel);
        
        Scene dialogScene = new Scene(dialogRoot);
        captchaStage.setScene(dialogScene);
        captchaStage.showAndWait();
        
        appendOutput("打开滑块验证码对话框");
        updateStatus("显示验证码界面");
    }
    
    private void showAdvancedCaptchaDialog(Stage parentStage) {
        Stage captchaStage = new Stage();
        captchaStage.initModality(Modality.APPLICATION_MODAL);
        captchaStage.initOwner(parentStage);
        captchaStage.setTitle("高级滑块验证码演示");
        captchaStage.setResizable(false);
        
        VBox dialogRoot = new VBox(20);
        dialogRoot.setPadding(new Insets(20));
        dialogRoot.setAlignment(Pos.CENTER);
        dialogRoot.setStyle("-fx-background-color: #ffffff;");
        
        // 标题
        Label titleLabel = new Label("🔒 高级安全验证");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 20));
        titleLabel.setTextFill(Color.DARKBLUE);
        
        // 描述
        Label descLabel = new Label("此验证码包含反机器人检测、时间验证和多重安全特性");
        descLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #6c757d;");
        
        // 创建高级滑块验证码
        AdvancedSliderCaptcha captcha = new AdvancedSliderCaptcha();
        
        // 按钮面板
        HBox buttonPanel = new HBox(10);
        buttonPanel.setAlignment(Pos.CENTER);
        
        Button refreshButton = new Button("🔄 刷新");
        Button closeButton = new Button("❌ 关闭");
        
        refreshButton.setStyle("-fx-background-color: #6c757d; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 4;");
        closeButton.setStyle("-fx-background-color: #dc3545; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 4;");
        
        buttonPanel.getChildren().addAll(refreshButton, closeButton);
        
        // 事件处理
        refreshButton.setOnAction(e -> {
            captcha.refresh();
            appendOutput("🔄 高级验证码已刷新");
        });
        
        closeButton.setOnAction(e -> captchaStage.close());
        
        // 验证结果监听
        captcha.setVerificationListener(new AdvancedSliderCaptcha.CaptchaVerificationListener() {
            @Override
            public void onVerificationSuccess() {
                appendOutput("✅ 高级滑块验证码验证成功！安全级别: 高");
                updateStatus("高级验证码验证通过");
                
                // 延迟关闭对话框
                javafx.animation.PauseTransition pause = new javafx.animation.PauseTransition(javafx.util.Duration.seconds(2));
                pause.setOnFinished(event -> captchaStage.close());
                pause.play();
            }
            
            @Override
            public void onVerificationFailed() {
                appendOutput("❌ 高级验证码验证失败 (尝试 " + captcha.getAttemptCount() + "/3)");
                updateStatus("高级验证码验证失败");
            }
            
            @Override
            public void onMaxAttemptsReached() {
                appendOutput("🚫 验证失败次数过多，已锁定验证码");
                updateStatus("验证码已锁定");
                
                // 5秒后自动关闭
                javafx.animation.PauseTransition pause = new javafx.animation.PauseTransition(javafx.util.Duration.seconds(3));
                pause.setOnFinished(event -> captchaStage.close());
                pause.play();
            }
        });
        
        dialogRoot.getChildren().addAll(titleLabel, descLabel, captcha, buttonPanel);
        
        Scene dialogScene = new Scene(dialogRoot);
        captchaStage.setScene(dialogScene);
        captchaStage.showAndWait();
        
        appendOutput("打开高级滑块验证码对话框");
        updateStatus("显示高级验证码界面");
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

    public static void main(String[] args) {
        // Set system properties for better macOS integration
        System.setProperty("apple.laf.useScreenMenuBar", "true");
        System.setProperty("com.apple.mrj.application.apple.menu.about.name", "Mac Java App");
        System.setProperty("apple.awt.application.name", "Mac Java App");

        launch(args);
    }
}