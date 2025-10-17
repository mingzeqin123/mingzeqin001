package com.example.app;

import com.example.app.config.WeChatPayConfig;
import com.example.app.controller.PaymentController;
import com.example.app.model.PaymentResponse;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.embed.swing.SwingFXUtils;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

import java.awt.image.BufferedImage;
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
    private PaymentController paymentController;
    private ImageView qrCodeImageView;
    private TextField amountField;
    private TextField descriptionField;
    private Button payButton;
    private Button queryButton;
    private Label paymentStatusLabel;

    @Override
    public void start(Stage primaryStage) {
        primaryStage.setTitle("Mac Java Application v1.0 - 微信支付集成");

        // 初始化支付控制器
        initializePaymentController();

        // Create the main layout with tabs
        TabPane tabPane = new TabPane();
        
        // 基本功能标签页
        Tab basicTab = createBasicTab(primaryStage);
        
        // 微信支付标签页
        Tab paymentTab = createPaymentTab();
        
        tabPane.getTabs().addAll(basicTab, paymentTab);

        // Create scene
        Scene scene = new Scene(tabPane, 800, 700);
        primaryStage.setScene(scene);
        primaryStage.setResizable(true);
        primaryStage.show();

        // Initial welcome message
        appendOutput("应用程序启动成功！");
        appendOutput("当前时间: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        appendOutput("微信支付功能已集成！");
        updateStatus("应用程序已启动");
    }
    
    /**
     * 初始化支付控制器
     */
    private void initializePaymentController() {
        try {
            // 创建微信支付配置
            WeChatPayConfig config = new WeChatPayConfig();
            
            // 这里可以从配置文件或环境变量中读取配置
            // config.setMerchantId("YOUR_MERCHANT_ID");
            // config.setAppId("YOUR_APP_ID");
            // ... 其他配置
            
            paymentController = new PaymentController(config);
            
            appendOutput("微信支付控制器初始化成功");
        } catch (Exception e) {
            appendOutput("微信支付控制器初始化失败: " + e.getMessage());
        }
    }
    
    /**
     * 创建基本功能标签页
     */
    private Tab createBasicTab(Stage primaryStage) {
        Tab tab = new Tab("基本功能");
        tab.setClosable(false);
        
        VBox root = new VBox(10);
        root.setPadding(new Insets(20));
        root.setAlignment(Pos.TOP_CENTER);

        // Title
        Label titleLabel = new Label("欢迎使用 Mac Java 应用程序");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 24));
        titleLabel.setTextFill(Color.DARKBLUE);

        // Description
        Label descLabel = new Label("这是一个为macOS设计的Java应用程序示例，现已集成微信支付功能");
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
        
        tab.setContent(root);
        return tab;
    }
    
    /**
     * 创建微信支付标签页
     */
    private Tab createPaymentTab() {
        Tab tab = new Tab("微信支付");
        tab.setClosable(false);
        
        VBox root = new VBox(15);
        root.setPadding(new Insets(20));
        root.setAlignment(Pos.TOP_CENTER);

        // Title
        Label titleLabel = new Label("微信扫码支付");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 20));
        titleLabel.setTextFill(Color.DARKGREEN);

        // 支付表单
        GridPane formGrid = new GridPane();
        formGrid.setHgap(10);
        formGrid.setVgap(10);
        formGrid.setAlignment(Pos.CENTER);

        // 商品描述
        Label descLabel = new Label("商品描述:");
        descriptionField = new TextField();
        descriptionField.setPromptText("请输入商品描述");
        descriptionField.setPrefWidth(200);
        formGrid.add(descLabel, 0, 0);
        formGrid.add(descriptionField, 1, 0);

        // 支付金额
        Label amountLabel = new Label("支付金额(元):");
        amountField = new TextField();
        amountField.setPromptText("请输入支付金额");
        amountField.setPrefWidth(200);
        formGrid.add(amountLabel, 0, 1);
        formGrid.add(amountField, 1, 1);

        // 按钮面板
        HBox buttonPanel = new HBox(10);
        buttonPanel.setAlignment(Pos.CENTER);

        payButton = new Button("创建支付订单");
        queryButton = new Button("查询支付状态");
        Button cancelButton = new Button("取消订单");

        String payButtonStyle = "-fx-background-color: #09BB07; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;";
        String queryButtonStyle = "-fx-background-color: #007AFF; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;";
        String cancelButtonStyle = "-fx-background-color: #FF3B30; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;";

        payButton.setStyle(payButtonStyle);
        queryButton.setStyle(queryButtonStyle);
        cancelButton.setStyle(cancelButtonStyle);

        buttonPanel.getChildren().addAll(payButton, queryButton, cancelButton);

        // 二维码显示区域
        VBox qrCodePanel = new VBox(10);
        qrCodePanel.setAlignment(Pos.CENTER);

        Label qrLabel = new Label("支付二维码:");
        qrLabel.setFont(Font.font("System", FontWeight.BOLD, 14));

        qrCodeImageView = new ImageView();
        qrCodeImageView.setFitWidth(200);
        qrCodeImageView.setFitHeight(200);
        qrCodeImageView.setPreserveRatio(true);
        qrCodeImageView.setStyle("-fx-border-color: #CCCCCC; -fx-border-width: 1;");

        qrCodePanel.getChildren().addAll(qrLabel, qrCodeImageView);

        // 支付状态显示
        paymentStatusLabel = new Label("等待创建支付订单...");
        paymentStatusLabel.setFont(Font.font("System", 12));
        paymentStatusLabel.setTextFill(Color.GRAY);
        paymentStatusLabel.setStyle("-fx-background-color: #F0F0F0; -fx-padding: 10; -fx-background-radius: 5;");

        // 事件处理
        payButton.setOnAction(e -> createPaymentOrder());
        queryButton.setOnAction(e -> queryPaymentStatus());
        cancelButton.setOnAction(e -> cancelPaymentOrder());

        // 添加组件到根容器
        root.getChildren().addAll(titleLabel, formGrid, buttonPanel, qrCodePanel, paymentStatusLabel);
        
        tab.setContent(root);
        return tab;
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
    
    // 微信支付相关方法
    private String currentOrderNo = null;
    
    /**
     * 创建支付订单
     */
    private void createPaymentOrder() {
        try {
            String description = descriptionField.getText().trim();
            String amountText = amountField.getText().trim();
            
            if (description.isEmpty()) {
                showAlert("错误", "请输入商品描述");
                return;
            }
            
            if (amountText.isEmpty()) {
                showAlert("错误", "请输入支付金额");
                return;
            }
            
            double amount;
            try {
                amount = Double.parseDouble(amountText);
                if (amount <= 0) {
                    showAlert("错误", "支付金额必须大于0");
                    return;
                }
            } catch (NumberFormatException e) {
                showAlert("错误", "请输入有效的金额");
                return;
            }
            
            payButton.setDisable(true);
            updatePaymentStatus("正在创建支付订单...", Color.ORANGE);
            
            // 创建支付订单
            PaymentResponse response = paymentController.createPayment(description, amount, new PaymentController.PaymentStatusCallback() {
                @Override
                public void onPaymentSuccess(PaymentResponse response) {
                    Platform.runLater(() -> {
                        updatePaymentStatus("支付成功！订单号: " + response.getTransactionId(), Color.GREEN);
                        appendOutput("支付成功: " + response.getOutTradeNo());
                        clearQRCode();
                        payButton.setDisable(false);
                    });
                }
                
                @Override
                public void onPaymentFailed(PaymentResponse response) {
                    Platform.runLater(() -> {
                        updatePaymentStatus("支付失败: " + response.getTradeStateDesc(), Color.RED);
                        appendOutput("支付失败: " + response.getOutTradeNo() + " - " + response.getTradeStateDesc());
                        clearQRCode();
                        payButton.setDisable(false);
                    });
                }
                
                @Override
                public void onPaymentTimeout() {
                    Platform.runLater(() -> {
                        updatePaymentStatus("支付超时，订单已自动关闭", Color.RED);
                        appendOutput("支付超时: " + currentOrderNo);
                        clearQRCode();
                        payButton.setDisable(false);
                    });
                }
                
                @Override
                public void onError(String errorMessage) {
                    Platform.runLater(() -> {
                        updatePaymentStatus("支付异常: " + errorMessage, Color.RED);
                        appendOutput("支付异常: " + errorMessage);
                        payButton.setDisable(false);
                    });
                }
            });
            
            if (response.isSuccess()) {
                currentOrderNo = response.getOutTradeNo();
                updatePaymentStatus("订单创建成功，请扫码支付", Color.BLUE);
                appendOutput("支付订单创建成功: " + currentOrderNo);
                
                // 生成并显示二维码
                displayQRCode(response.getCodeUrl());
                
            } else {
                updatePaymentStatus("订单创建失败: " + response.getMessage(), Color.RED);
                appendOutput("支付订单创建失败: " + response.getMessage());
                payButton.setDisable(false);
            }
            
        } catch (Exception e) {
            updatePaymentStatus("创建订单异常: " + e.getMessage(), Color.RED);
            appendOutput("创建支付订单异常: " + e.getMessage());
            payButton.setDisable(false);
        }
    }
    
    /**
     * 查询支付状态
     */
    private void queryPaymentStatus() {
        if (currentOrderNo == null || currentOrderNo.isEmpty()) {
            showAlert("提示", "请先创建支付订单");
            return;
        }
        
        try {
            PaymentResponse response = paymentController.queryPaymentStatus(currentOrderNo);
            
            if (response.isPaid()) {
                updatePaymentStatus("支付成功！", Color.GREEN);
                appendOutput("支付状态查询: 已支付 - " + response.getTransactionId());
            } else if ("NOTPAY".equals(response.getTradeState())) {
                updatePaymentStatus("等待支付中...", Color.ORANGE);
                appendOutput("支付状态查询: 等待支付");
            } else {
                updatePaymentStatus("支付状态: " + response.getTradeStateDesc(), Color.GRAY);
                appendOutput("支付状态查询: " + response.getTradeStateDesc());
            }
            
        } catch (Exception e) {
            updatePaymentStatus("查询异常: " + e.getMessage(), Color.RED);
            appendOutput("查询支付状态异常: " + e.getMessage());
        }
    }
    
    /**
     * 取消支付订单
     */
    private void cancelPaymentOrder() {
        if (currentOrderNo == null || currentOrderNo.isEmpty()) {
            showAlert("提示", "没有可取消的订单");
            return;
        }
        
        try {
            boolean success = paymentController.cancelPayment(currentOrderNo);
            
            if (success) {
                updatePaymentStatus("订单已取消", Color.GRAY);
                appendOutput("订单取消成功: " + currentOrderNo);
                clearQRCode();
                currentOrderNo = null;
                payButton.setDisable(false);
            } else {
                updatePaymentStatus("订单取消失败", Color.RED);
                appendOutput("订单取消失败: " + currentOrderNo);
            }
            
        } catch (Exception e) {
            updatePaymentStatus("取消异常: " + e.getMessage(), Color.RED);
            appendOutput("取消订单异常: " + e.getMessage());
        }
    }
    
    /**
     * 显示二维码
     */
    private void displayQRCode(String codeUrl) {
        try {
            BufferedImage qrImage = paymentController.generatePaymentQRCode(codeUrl, 200);
            Image fxImage = SwingFXUtils.toFXImage(qrImage, null);
            qrCodeImageView.setImage(fxImage);
            appendOutput("二维码生成成功，请使用微信扫码支付");
        } catch (Exception e) {
            appendOutput("二维码生成失败: " + e.getMessage());
        }
    }
    
    /**
     * 清空二维码
     */
    private void clearQRCode() {
        qrCodeImageView.setImage(null);
    }
    
    /**
     * 更新支付状态显示
     */
    private void updatePaymentStatus(String status, Color color) {
        paymentStatusLabel.setText(status);
        paymentStatusLabel.setTextFill(color);
    }
    
    /**
     * 显示提示对话框
     */
    private void showAlert(String title, String message) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    @Override
    public void stop() throws Exception {
        // 关闭支付控制器
        if (paymentController != null) {
            paymentController.shutdown();
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