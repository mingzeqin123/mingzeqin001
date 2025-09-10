package com.example.app;

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
        Button clearButton = new Button("清空输出");

        // Style buttons
        String buttonStyle = "-fx-background-color: #007AFF; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;";
        helloButton.setStyle(buttonStyle);
        fileButton.setStyle(buttonStyle);
        systemInfoButton.setStyle(buttonStyle);
        clearButton.setStyle("-fx-background-color: #FF3B30; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;");

        buttonPanel.getChildren().addAll(helloButton, fileButton, systemInfoButton, clearButton);

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
        clearButton.setOnAction(e -> clearOutput());

        // Add components to root
        root.getChildren().addAll(titleLabel, descLabel, buttonPanel, outputArea, statusLabel);

        // Create scene
        Scene scene = new Scene(root, 600, 500);
        primaryStage.setScene(scene);
        primaryStage.setResizable(true);
        
        // 添加关闭处理器确保资源清理
        primaryStage.setOnCloseRequest(e -> {
            flushPendingOutput(); // 确保所有待处理的输出都被刷新
        });
        
        primaryStage.show();

        // Initial welcome message
        appendOutput("应用程序启动成功！");
        appendOutput("当前时间: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        flushPendingOutput(); // 确保初始消息立即显示
        updateStatus("应用程序已启动");
    }

    private void showGreeting() {
        String greeting = "你好！欢迎使用这个Java应用程序！\n" +
                         "这个程序演示了:\n" +
                         "• JavaFX GUI界面\n" +
                         "• 文件选择功能\n" +
                         "• 系统信息显示\n" +
                         "• macOS集成";
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

    private void clearOutput() {
        outputArea.clear();
        updateStatus("输出已清空");
    }

    // 优化的输出追加方法 - 减少UI更新频率
    private StringBuilder pendingOutput = new StringBuilder();
    private long lastOutputUpdate = 0;
    
    private void appendOutput(String text) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        String formattedText = "[" + timestamp + "] " + text + "\n";
        
        // 批量更新UI以提高性能
        pendingOutput.append(formattedText);
        long currentTime = System.currentTimeMillis();
        
        if (currentTime - lastOutputUpdate > 100) { // 每100ms最多更新一次
            flushPendingOutput();
            lastOutputUpdate = currentTime;
        }
    }
    
    private void flushPendingOutput() {
        if (pendingOutput.length() > 0) {
            outputArea.appendText(pendingOutput.toString());
            pendingOutput.setLength(0);
        }
    }

    // 缓存状态以避免重复更新
    private String lastStatus = "";
    
    private void updateStatus(String status) {
        String fullStatus = "状态: " + status;
        if (!fullStatus.equals(lastStatus)) {
            statusLabel.setText(fullStatus);
            lastStatus = fullStatus;
        }
    }

    public static void main(String[] args) {
        // Set system properties for better macOS integration
        System.setProperty("apple.laf.useScreenMenuBar", "true");
        System.setProperty("com.apple.mrj.application.apple.menu.about.name", "Mac Java App");
        System.setProperty("apple.awt.application.name", "Mac Java App");

        launch(args);
    }
}