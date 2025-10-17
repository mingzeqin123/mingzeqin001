package com.example.app;

import com.example.app.payment.WeChatPayConfig;
import com.example.app.payment.controller.PaymentController;
import com.example.app.payment.model.PaymentResult;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.HashMap;
import java.util.Map;

/**
 * A simple JavaFX application for macOS
 * This application demonstrates a modern GUI with file operations and system integration
 */
public class MacJavaApp extends Application {

    private TextArea outputArea;
    private Label statusLabel;
    private PaymentController paymentController;
    private ObjectMapper objectMapper;

    @Override
    public void start(Stage primaryStage) {
        primaryStage.setTitle("Mac Java Application v1.0 - 微信支付集成版");

        // 初始化支付控制器
        initializePaymentController();

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
        Button wechatPayButton = new Button("微信扫码支付");
        Button clearButton = new Button("清空输出");

        // Style buttons
        String buttonStyle = "-fx-background-color: #007AFF; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;";
        String payButtonStyle = "-fx-background-color: #07C160; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;";
        helloButton.setStyle(buttonStyle);
        fileButton.setStyle(buttonStyle);
        systemInfoButton.setStyle(buttonStyle);
        wechatPayButton.setStyle(payButtonStyle);
        clearButton.setStyle("-fx-background-color: #FF3B30; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;");

        buttonPanel.getChildren().addAll(helloButton, fileButton, systemInfoButton, wechatPayButton, clearButton);

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
        wechatPayButton.setOnAction(e -> showWeChatPayDialog(primaryStage));
        clearButton.setOnAction(e -> clearOutput());

        // Add components to root
        root.getChildren().addAll(titleLabel, descLabel, buttonPanel, outputArea, statusLabel);

        // Create scene
        Scene scene = new Scene(root, 600, 500);
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
     * 初始化支付控制器
     */
    private void initializePaymentController() {
        try {
            // 创建微信支付配置（实际使用时应该从配置文件读取）
            WeChatPayConfig config = new WeChatPayConfig();
            config.setAppId("your_app_id");  // 替换为实际的AppID
            config.setMchId("your_mch_id");  // 替换为实际的商户号
            config.setApiKey("your_api_key"); // 替换为实际的API密钥
            config.setNotifyUrl("http://your-domain.com/notify"); // 替换为实际的通知地址
            
            paymentController = new PaymentController(config);
            objectMapper = new ObjectMapper();
            
            appendOutput("微信支付控制器初始化成功");
        } catch (Exception e) {
            appendOutput("微信支付控制器初始化失败: " + e.getMessage());
        }
    }
    
    /**
     * 显示微信支付对话框
     */
    private void showWeChatPayDialog(Stage parentStage) {
        // 创建支付对话框
        Stage payDialog = new Stage();
        payDialog.setTitle("微信扫码支付");
        payDialog.initOwner(parentStage);
        
        VBox dialogContent = new VBox(15);
        dialogContent.setPadding(new Insets(20));
        dialogContent.setAlignment(Pos.CENTER);
        
        // 商品信息输入
        Label titleLabel = new Label("创建微信扫码支付订单");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 16));
        titleLabel.setTextFill(Color.DARKGREEN);
        
        TextField productNameField = new TextField();
        productNameField.setPromptText("请输入商品名称");
        productNameField.setText("测试商品");
        
        TextField amountField = new TextField();
        amountField.setPromptText("请输入支付金额（元）");
        amountField.setText("0.01");
        
        TextField productIdField = new TextField();
        productIdField.setPromptText("请输入商品ID");
        productIdField.setText("test_product_001");
        
        // 按钮
        HBox buttonBox = new HBox(10);
        buttonBox.setAlignment(Pos.CENTER);
        
        Button createOrderButton = new Button("创建支付订单");
        createOrderButton.setStyle("-fx-background-color: #07C160; -fx-text-fill: white; -fx-padding: 8 16 8 16;");
        
        Button cancelButton = new Button("取消");
        cancelButton.setStyle("-fx-background-color: #FF3B30; -fx-text-fill: white; -fx-padding: 8 16 8 16;");
        
        buttonBox.getChildren().addAll(createOrderButton, cancelButton);
        
        // 结果显示区域
        TextArea resultArea = new TextArea();
        resultArea.setEditable(false);
        resultArea.setPrefRowCount(8);
        resultArea.setWrapText(true);
        resultArea.setStyle("-fx-font-family: 'Monaco', 'Consolas', monospace; -fx-font-size: 12px;");
        
        // 事件处理
        createOrderButton.setOnAction(e -> {
            try {
                String productName = productNameField.getText().trim();
                String amountText = amountField.getText().trim();
                String productId = productIdField.getText().trim();
                
                if (productName.isEmpty() || amountText.isEmpty() || productId.isEmpty()) {
                    resultArea.setText("请填写完整的商品信息！");
                    return;
                }
                
                double amount = Double.parseDouble(amountText);
                if (amount <= 0) {
                    resultArea.setText("支付金额必须大于0！");
                    return;
                }
                
                // 转换为分
                int totalFee = (int) Math.round(amount * 100);
                
                // 创建支付订单
                Map<String, Object> requestData = new HashMap<>();
                requestData.put("body", productName);
                requestData.put("totalFee", totalFee);
                requestData.put("productId", productId);
                requestData.put("attach", "测试订单");
                
                String response = paymentController.createNativePayOrder(requestData);
                Map<String, Object> result = objectMapper.readValue(response, Map.class);
                
                // 显示结果
                StringBuilder resultText = new StringBuilder();
                resultText.append("=== 支付订单创建结果 ===\n");
                resultText.append("成功: ").append(result.get("success")).append("\n");
                resultText.append("消息: ").append(result.get("message")).append("\n");
                
                if ((Boolean) result.get("success")) {
                    resultText.append("二维码链接: ").append(result.get("codeUrl")).append("\n");
                    resultText.append("商户订单号: ").append(result.get("outTradeNo")).append("\n");
                    resultText.append("支付金额: ").append(result.get("totalFee")).append(" 分\n");
                    resultText.append("交易类型: ").append(result.get("tradeType")).append("\n");
                    resultText.append("\n请使用微信扫描二维码完成支付！");
                } else {
                    resultText.append("错误代码: ").append(result.get("errorCode")).append("\n");
                    resultText.append("错误信息: ").append(result.get("errorMessage"));
                }
                
                resultArea.setText(resultText.toString());
                
                // 同时输出到主窗口
                appendOutput("创建支付订单: " + productName + " - " + amount + "元");
                if ((Boolean) result.get("success")) {
                    appendOutput("订单创建成功，二维码: " + result.get("codeUrl"));
                } else {
                    appendOutput("订单创建失败: " + result.get("message"));
                }
                
            } catch (Exception ex) {
                resultArea.setText("创建支付订单时发生错误: " + ex.getMessage());
                appendOutput("支付订单创建失败: " + ex.getMessage());
            }
        });
        
        cancelButton.setOnAction(e -> payDialog.close());
        
        // 布局
        dialogContent.getChildren().addAll(
            titleLabel,
            new Label("商品名称:"),
            productNameField,
            new Label("支付金额（元）:"),
            amountField,
            new Label("商品ID:"),
            productIdField,
            buttonBox,
            new Label("结果:"),
            resultArea
        );
        
        Scene dialogScene = new Scene(dialogContent, 500, 600);
        payDialog.setScene(dialogScene);
        payDialog.setResizable(false);
        payDialog.show();
    }

    @Override
    public void stop() throws Exception {
        // 关闭支付控制器
        if (paymentController != null) {
            paymentController.close();
        }
        super.stop();
    }

    public static void main(String[] args) {
        // Set system properties for better macOS integration
        System.setProperty("apple.laf.useScreenMenuBar", "true");
        System.setProperty("com.apple.mrj.application.apple.menu.about.name", "Mac Java App");
        System.setProperty("apple.awt.application.name", "Mac Java App");

        launch(args);
    }
}