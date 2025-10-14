package com.example.app;

import com.example.app.sse.*;
import javafx.application.Application;
import javafx.application.Platform;
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
import org.springframework.context.ConfigurableApplicationContext;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * A simple JavaFX application for macOS
 * This application demonstrates a modern GUI with file operations and system integration
 */
public class MacJavaApp extends Application {

    private TextArea outputArea;
    private Label statusLabel;
    
    // SSE相关组件
    private ConfigurableApplicationContext sseServerContext;
    private SseClient sseClient;
    private SseMessageProcessor messageProcessor;
    private TextField serverUrlField;
    private TextField clientIdField;
    private TextField messageField;
    private ComboBox<String> eventTypeCombo;
    private Button connectButton;
    private Button disconnectButton;
    private Button sendMessageButton;
    private Button startServerButton;
    private Button stopServerButton;
    private Label connectionStatusLabel;

    @Override
    public void start(Stage primaryStage) {
        primaryStage.setTitle("Mac Java Application v1.0 - SSE消息处理");

        // 初始化SSE组件
        initializeSseComponents();

        // Create the main layout
        VBox root = new VBox(10);
        root.setPadding(new Insets(20));
        root.setAlignment(Pos.TOP_CENTER);

        // Title
        Label titleLabel = new Label("Mac Java 应用程序 - SSE消息处理");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 24));
        titleLabel.setTextFill(Color.DARKBLUE);

        // Description
        Label descLabel = new Label("集成Server-Sent Events消息处理功能的Java应用程序");
        descLabel.setFont(Font.font("System", 14));
        descLabel.setTextFill(Color.GRAY);

        // Create tabs
        TabPane tabPane = new TabPane();
        
        // 基本功能标签页
        Tab basicTab = new Tab("基本功能");
        basicTab.setClosable(false);
        basicTab.setContent(createBasicFunctionPanel(primaryStage));
        
        // SSE功能标签页
        Tab sseTab = new Tab("SSE消息处理");
        sseTab.setClosable(false);
        sseTab.setContent(createSseFunctionPanel());
        
        tabPane.getTabs().addAll(basicTab, sseTab);

        // Output area
        outputArea = new TextArea();
        outputArea.setEditable(false);
        outputArea.setPrefRowCount(12);
        outputArea.setWrapText(true);
        outputArea.setStyle("-fx-font-family: 'Monaco', 'Consolas', monospace; -fx-font-size: 12px;");

        // Status bar
        statusLabel = new Label("就绪");
        statusLabel.setStyle("-fx-background-color: #F0F0F0; -fx-padding: 5; -fx-font-size: 12px;");

        // Add components to root
        root.getChildren().addAll(titleLabel, descLabel, tabPane, outputArea, statusLabel);

        // Create scene
        Scene scene = new Scene(root, 800, 700);
        primaryStage.setScene(scene);
        primaryStage.setResizable(true);
        primaryStage.show();

        // 设置关闭事件
        primaryStage.setOnCloseRequest(e -> {
            cleanup();
            Platform.exit();
        });

        // Initial welcome message
        appendOutput("应用程序启动成功！");
        appendOutput("当前时间: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        appendOutput("SSE消息处理功能已就绪");
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

    private void appendOutput(String text) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        outputArea.appendText("[" + timestamp + "] " + text + "\n");
    }

    private void updateStatus(String status) {
        statusLabel.setText("状态: " + status);
    }

    /**
     * 初始化SSE组件
     */
    private void initializeSseComponents() {
        messageProcessor = new SseMessageProcessor();
        messageProcessor.setupDefaultHandlers();
        messageProcessor.setupDefaultFilters();
        messageProcessor.setupDefaultTransformers();
        
        // 注册自定义消息处理器
        messageProcessor.registerHandler("*", message -> {
            Platform.runLater(() -> {
                appendOutput("收到SSE消息: " + message.getEvent() + " - " + message.getData());
            });
        });
        
        sseClient = new SseClient();
        sseClient.onConnectionStatus(status -> {
            Platform.runLater(() -> {
                connectionStatusLabel.setText("连接状态: " + status);
                updateStatus("SSE " + status);
            });
        });
        
        sseClient.onEvent("*", message -> {
            messageProcessor.submitMessage(message);
        });
        
        sseClient.onError(error -> {
            Platform.runLater(() -> {
                appendOutput("SSE错误: " + error.getMessage());
            });
        });
    }
    
    /**
     * 创建基本功能面板
     */
    private VBox createBasicFunctionPanel(Stage primaryStage) {
        VBox panel = new VBox(10);
        panel.setPadding(new Insets(10));
        
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

        // Event handlers
        helloButton.setOnAction(e -> showGreeting());
        fileButton.setOnAction(e -> selectFile(primaryStage));
        systemInfoButton.setOnAction(e -> showSystemInfo());
        clearButton.setOnAction(e -> clearOutput());
        
        panel.getChildren().add(buttonPanel);
        return panel;
    }
    
    /**
     * 创建SSE功能面板
     */
    private VBox createSseFunctionPanel() {
        VBox panel = new VBox(10);
        panel.setPadding(new Insets(10));
        
        // 服务器控制区域
        VBox serverSection = new VBox(5);
        serverSection.setStyle("-fx-border-color: #CCCCCC; -fx-border-width: 1; -fx-padding: 10; -fx-background-color: #F9F9F9;");
        
        Label serverLabel = new Label("SSE服务器控制");
        serverLabel.setFont(Font.font("System", FontWeight.BOLD, 16));
        
        HBox serverButtonPanel = new HBox(10);
        startServerButton = new Button("启动服务器");
        stopServerButton = new Button("停止服务器");
        stopServerButton.setDisable(true);
        
        String serverButtonStyle = "-fx-background-color: #34C759; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 5;";
        String stopButtonStyle = "-fx-background-color: #FF3B30; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 5;";
        
        startServerButton.setStyle(serverButtonStyle);
        stopServerButton.setStyle(stopButtonStyle);
        
        serverButtonPanel.getChildren().addAll(startServerButton, stopServerButton);
        serverSection.getChildren().addAll(serverLabel, serverButtonPanel);
        
        // 客户端连接区域
        VBox clientSection = new VBox(5);
        clientSection.setStyle("-fx-border-color: #CCCCCC; -fx-border-width: 1; -fx-padding: 10; -fx-background-color: #F9F9F9;");
        
        Label clientLabel = new Label("SSE客户端连接");
        clientLabel.setFont(Font.font("System", FontWeight.BOLD, 16));
        
        GridPane connectionGrid = new GridPane();
        connectionGrid.setHgap(10);
        connectionGrid.setVgap(5);
        
        connectionGrid.add(new Label("服务器URL:"), 0, 0);
        serverUrlField = new TextField("http://localhost:8080");
        serverUrlField.setPrefWidth(200);
        connectionGrid.add(serverUrlField, 1, 0);
        
        connectionGrid.add(new Label("客户端ID:"), 0, 1);
        clientIdField = new TextField("client-" + System.currentTimeMillis());
        clientIdField.setPrefWidth(200);
        connectionGrid.add(clientIdField, 1, 1);
        
        HBox connectionButtonPanel = new HBox(10);
        connectButton = new Button("连接");
        disconnectButton = new Button("断开连接");
        disconnectButton.setDisable(true);
        
        String connectButtonStyle = "-fx-background-color: #007AFF; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 5;";
        connectButton.setStyle(connectButtonStyle);
        disconnectButton.setStyle(stopButtonStyle);
        
        connectionButtonPanel.getChildren().addAll(connectButton, disconnectButton);
        
        connectionStatusLabel = new Label("连接状态: 未连接");
        connectionStatusLabel.setStyle("-fx-font-weight: bold;");
        
        clientSection.getChildren().addAll(clientLabel, connectionGrid, connectionButtonPanel, connectionStatusLabel);
        
        // 消息发送区域
        VBox messageSection = new VBox(5);
        messageSection.setStyle("-fx-border-color: #CCCCCC; -fx-border-width: 1; -fx-padding: 10; -fx-background-color: #F9F9F9;");
        
        Label messageLabel = new Label("发送消息");
        messageLabel.setFont(Font.font("System", FontWeight.BOLD, 16));
        
        GridPane messageGrid = new GridPane();
        messageGrid.setHgap(10);
        messageGrid.setVgap(5);
        
        messageGrid.add(new Label("事件类型:"), 0, 0);
        eventTypeCombo = new ComboBox<>();
        eventTypeCombo.getItems().addAll("notification", "log", "error", "heartbeat", "custom");
        eventTypeCombo.setValue("notification");
        eventTypeCombo.setEditable(true);
        messageGrid.add(eventTypeCombo, 1, 0);
        
        messageGrid.add(new Label("消息内容:"), 0, 1);
        messageField = new TextField("Hello from JavaFX!");
        messageField.setPrefWidth(300);
        messageGrid.add(messageField, 1, 1);
        
        sendMessageButton = new Button("发送消息");
        sendMessageButton.setStyle(connectButtonStyle);
        sendMessageButton.setDisable(true);
        
        messageSection.getChildren().addAll(messageLabel, messageGrid, sendMessageButton);
        
        // 事件处理器
        startServerButton.setOnAction(e -> startSseServer());
        stopServerButton.setOnAction(e -> stopSseServer());
        connectButton.setOnAction(e -> connectToSseServer());
        disconnectButton.setOnAction(e -> disconnectFromSseServer());
        sendMessageButton.setOnAction(e -> sendSseMessage());
        
        panel.getChildren().addAll(serverSection, clientSection, messageSection);
        return panel;
    }
    
    /**
     * 启动SSE服务器
     */
    private void startSseServer() {
        CompletableFuture.runAsync(() -> {
            try {
                sseServerContext = SseServerApplication.startServer(8080);
                Platform.runLater(() -> {
                    appendOutput("SSE服务器已启动在端口 8080");
                    startServerButton.setDisable(true);
                    stopServerButton.setDisable(false);
                    updateStatus("SSE服务器运行中");
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    appendOutput("启动SSE服务器失败: " + e.getMessage());
                    updateStatus("服务器启动失败");
                });
            }
        });
    }
    
    /**
     * 停止SSE服务器
     */
    private void stopSseServer() {
        CompletableFuture.runAsync(() -> {
            try {
                if (sseServerContext != null) {
                    SseServerApplication.stopServer();
                    sseServerContext = null;
                }
                Platform.runLater(() -> {
                    appendOutput("SSE服务器已停止");
                    startServerButton.setDisable(false);
                    stopServerButton.setDisable(true);
                    updateStatus("SSE服务器已停止");
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    appendOutput("停止SSE服务器失败: " + e.getMessage());
                });
            }
        });
    }
    
    /**
     * 连接到SSE服务器
     */
    private void connectToSseServer() {
        String serverUrl = serverUrlField.getText().trim();
        String clientId = clientIdField.getText().trim();
        
        if (serverUrl.isEmpty() || clientId.isEmpty()) {
            appendOutput("请输入服务器URL和客户端ID");
            return;
        }
        
        sseClient.connect(serverUrl, clientId)
            .thenRun(() -> {
                Platform.runLater(() -> {
                    appendOutput("已连接到SSE服务器: " + serverUrl);
                    connectButton.setDisable(true);
                    disconnectButton.setDisable(false);
                    sendMessageButton.setDisable(false);
                    serverUrlField.setDisable(true);
                    clientIdField.setDisable(true);
                });
            })
            .exceptionally(throwable -> {
                Platform.runLater(() -> {
                    appendOutput("连接SSE服务器失败: " + throwable.getMessage());
                    updateStatus("连接失败");
                });
                return null;
            });
    }
    
    /**
     * 断开SSE服务器连接
     */
    private void disconnectFromSseServer() {
        sseClient.disconnect();
        appendOutput("已断开SSE服务器连接");
        connectButton.setDisable(false);
        disconnectButton.setDisable(true);
        sendMessageButton.setDisable(true);
        serverUrlField.setDisable(false);
        clientIdField.setDisable(false);
        connectionStatusLabel.setText("连接状态: 未连接");
    }
    
    /**
     * 发送SSE消息
     */
    private void sendSseMessage() {
        String eventType = eventTypeCombo.getValue();
        String messageContent = messageField.getText().trim();
        
        if (eventType.isEmpty() || messageContent.isEmpty()) {
            appendOutput("请输入事件类型和消息内容");
            return;
        }
        
        // 创建消息对象
        Map<String, Object> messageData = new HashMap<>();
        messageData.put("content", messageContent);
        messageData.put("sender", "JavaFX Client");
        messageData.put("timestamp", LocalDateTime.now().toString());
        
        SseMessage message = new SseMessage(eventType, messageData);
        
        // 发送到服务器进行广播
        String endpoint = "/api/sse/broadcast";
        sseClient.sendHttpRequest(endpoint, "POST", 
            "{\"event\":\"" + eventType + "\",\"data\":" + 
            "{\"content\":\"" + messageContent + "\",\"sender\":\"JavaFX Client\"}}")
            .thenAccept(response -> {
                Platform.runLater(() -> {
                    appendOutput("消息发送成功: " + response);
                    messageField.clear();
                });
            })
            .exceptionally(throwable -> {
                Platform.runLater(() -> {
                    appendOutput("发送消息失败: " + throwable.getMessage());
                });
                return null;
            });
    }
    
    /**
     * 清理资源
     */
    private void cleanup() {
        if (sseClient != null) {
            sseClient.close();
        }
        if (messageProcessor != null) {
            messageProcessor.shutdown();
        }
        if (sseServerContext != null) {
            SseServerApplication.stopServer();
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