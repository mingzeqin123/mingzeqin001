package com.example.app.sms;

import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.stage.Stage;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

/**
 * SMS频率控制测试应用
 * 用于演示和测试SMS发送频率控制功能
 */
public class SmsTestApp extends Application {

    private SmsService smsService;
    private TextField phoneNumberField;
    private TextArea contentArea;
    private TextArea logArea;
    private TableView<SmsStatistics> statisticsTable;
    private Label statusLabel;

    @Override
    public void start(Stage primaryStage) {
        smsService = new SmsService();
        
        primaryStage.setTitle("SMS频率控制测试系统");
        
        // 创建主布局
        BorderPane root = new BorderPane();
        root.setPadding(new Insets(10));
        
        // 顶部标题
        VBox titleBox = createTitleSection();
        root.setTop(titleBox);
        
        // 中心内容区域
        TabPane tabPane = createTabPane();
        root.setCenter(tabPane);
        
        // 底部状态栏
        statusLabel = new Label("系统就绪");
        statusLabel.setStyle("-fx-background-color: #F0F0F0; -fx-padding: 5; -fx-font-size: 12px;");
        root.setBottom(statusLabel);
        
        // 创建场景
        Scene scene = new Scene(root, 800, 600);
        primaryStage.setScene(scene);
        primaryStage.setResizable(true);
        primaryStage.show();
        
        // 初始化日志
        appendLog("SMS频率控制系统启动成功");
        appendLog("系统规则：");
        appendLog("1. 同一手机号10分钟内只能发送一条短信");
        appendLog("2. 同一手机号每天最多发送10条短信");
        updateStatus("系统已启动");
    }
    
    private VBox createTitleSection() {
        VBox titleBox = new VBox(5);
        titleBox.setAlignment(Pos.CENTER);
        
        Label titleLabel = new Label("SMS频率控制测试系统");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 20));
        titleLabel.setTextFill(Color.DARKBLUE);
        
        Label descLabel = new Label("测试短信发送频率控制：10分钟间隔限制 + 每日10条限制");
        descLabel.setFont(Font.font("System", 12));
        descLabel.setTextFill(Color.GRAY);
        
        titleBox.getChildren().addAll(titleLabel, descLabel);
        return titleBox;
    }
    
    private TabPane createTabPane() {
        TabPane tabPane = new TabPane();
        
        // 发送短信标签页
        Tab sendTab = new Tab("发送短信");
        sendTab.setClosable(false);
        sendTab.setContent(createSendSmsPane());
        
        // 统计信息标签页
        Tab statsTab = new Tab("统计信息");
        statsTab.setClosable(false);
        statsTab.setContent(createStatisticsPane());
        
        // 系统日志标签页
        Tab logTab = new Tab("系统日志");
        logTab.setClosable(false);
        logTab.setContent(createLogPane());
        
        tabPane.getTabs().addAll(sendTab, statsTab, logTab);
        return tabPane;
    }
    
    private VBox createSendSmsPane() {
        VBox pane = new VBox(10);
        pane.setPadding(new Insets(20));
        
        // 手机号输入
        Label phoneLabel = new Label("手机号:");
        phoneLabel.setFont(Font.font("System", FontWeight.BOLD, 14));
        
        phoneNumberField = new TextField();
        phoneNumberField.setPromptText("请输入11位手机号，例如：13800138000");
        phoneNumberField.setPrefWidth(300);
        
        // 短信内容输入
        Label contentLabel = new Label("短信内容:");
        contentLabel.setFont(Font.font("System", FontWeight.BOLD, 14));
        
        contentArea = new TextArea();
        contentArea.setPromptText("请输入短信内容（最多500字符）");
        contentArea.setPrefRowCount(4);
        contentArea.setWrapText(true);
        
        // 字符计数标签
        Label charCountLabel = new Label("0/500");
        charCountLabel.setStyle("-fx-text-fill: gray;");
        contentArea.textProperty().addListener((obs, oldText, newText) -> {
            int length = newText != null ? newText.length() : 0;
            charCountLabel.setText(length + "/500");
            if (length > 500) {
                charCountLabel.setStyle("-fx-text-fill: red;");
            } else {
                charCountLabel.setStyle("-fx-text-fill: gray;");
            }
        });
        
        // 按钮区域
        HBox buttonBox = new HBox(10);
        buttonBox.setAlignment(Pos.CENTER_LEFT);
        
        Button sendButton = new Button("发送短信");
        Button checkButton = new Button("检查状态");
        Button batchTestButton = new Button("批量测试");
        Button clearButton = new Button("清空记录");
        
        String buttonStyle = "-fx-background-color: #007AFF; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 4;";
        sendButton.setStyle(buttonStyle);
        checkButton.setStyle(buttonStyle);
        batchTestButton.setStyle(buttonStyle);
        clearButton.setStyle("-fx-background-color: #FF3B30; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 4;");
        
        buttonBox.getChildren().addAll(sendButton, checkButton, batchTestButton, clearButton);
        
        // 事件处理
        sendButton.setOnAction(e -> sendSms());
        checkButton.setOnAction(e -> checkSmsStatus());
        batchTestButton.setOnAction(e -> batchTest());
        clearButton.setOnAction(e -> clearRecords());
        
        // 快速测试按钮
        Label quickTestLabel = new Label("快速测试:");
        quickTestLabel.setFont(Font.font("System", FontWeight.BOLD, 14));
        
        HBox quickTestBox = new HBox(10);
        quickTestBox.setAlignment(Pos.CENTER_LEFT);
        
        Button fillTestDataButton = new Button("填充测试数据");
        Button testFrequencyButton = new Button("测试频率限制");
        Button testDailyLimitButton = new Button("测试每日限制");
        
        String quickButtonStyle = "-fx-background-color: #34C759; -fx-text-fill: white; -fx-font-size: 11px; -fx-padding: 6 12 6 12; -fx-background-radius: 4;";
        fillTestDataButton.setStyle(quickButtonStyle);
        testFrequencyButton.setStyle(quickButtonStyle);
        testDailyLimitButton.setStyle(quickButtonStyle);
        
        quickTestBox.getChildren().addAll(fillTestDataButton, testFrequencyButton, testDailyLimitButton);
        
        // 快速测试事件处理
        fillTestDataButton.setOnAction(e -> fillTestData());
        testFrequencyButton.setOnAction(e -> testFrequencyLimit());
        testDailyLimitButton.setOnAction(e -> testDailyLimit());
        
        pane.getChildren().addAll(
            phoneLabel, phoneNumberField,
            contentLabel, contentArea, charCountLabel,
            buttonBox,
            new Separator(),
            quickTestLabel, quickTestBox
        );
        
        return pane;
    }
    
    private VBox createStatisticsPane() {
        VBox pane = new VBox(10);
        pane.setPadding(new Insets(20));
        
        Label titleLabel = new Label("发送统计信息");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 16));
        
        Button refreshButton = new Button("刷新统计");
        refreshButton.setStyle("-fx-background-color: #007AFF; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 4;");
        refreshButton.setOnAction(e -> refreshStatistics());
        
        // 创建统计表格
        statisticsTable = new TableView<>();
        
        TableColumn<SmsStatistics, String> phoneColumn = new TableColumn<>("手机号");
        phoneColumn.setCellValueFactory(data -> new javafx.beans.property.SimpleStringProperty(data.getValue().getPhoneNumber()));
        phoneColumn.setPrefWidth(120);
        
        TableColumn<SmsStatistics, String> todayColumn = new TableColumn<>("今日发送");
        todayColumn.setCellValueFactory(data -> new javafx.beans.property.SimpleStringProperty(
            data.getValue().getTodayCount() + "/10"));
        todayColumn.setPrefWidth(80);
        
        TableColumn<SmsStatistics, String> totalColumn = new TableColumn<>("总计发送");
        totalColumn.setCellValueFactory(data -> new javafx.beans.property.SimpleStringProperty(
            String.valueOf(data.getValue().getTotalCount())));
        totalColumn.setPrefWidth(80);
        
        TableColumn<SmsStatistics, String> lastSendColumn = new TableColumn<>("最后发送时间");
        lastSendColumn.setCellValueFactory(data -> new javafx.beans.property.SimpleStringProperty(
            data.getValue().getFormattedLastSendTime()));
        lastSendColumn.setPrefWidth(150);
        
        TableColumn<SmsStatistics, String> statusColumn = new TableColumn<>("状态");
        statusColumn.setCellValueFactory(data -> {
            SmsStatistics stats = data.getValue();
            String status = stats.canSendToday() ? 
                "可发送 (剩余" + stats.getRemainingTodayCount() + "条)" : "已达每日限制";
            return new javafx.beans.property.SimpleStringProperty(status);
        });
        statusColumn.setPrefWidth(150);
        
        statisticsTable.getColumns().addAll(phoneColumn, todayColumn, totalColumn, lastSendColumn, statusColumn);
        
        HBox headerBox = new HBox(10);
        headerBox.setAlignment(Pos.CENTER_LEFT);
        headerBox.getChildren().addAll(titleLabel, refreshButton);
        
        pane.getChildren().addAll(headerBox, statisticsTable);
        
        return pane;
    }
    
    private VBox createLogPane() {
        VBox pane = new VBox(10);
        pane.setPadding(new Insets(20));
        
        Label titleLabel = new Label("系统日志");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 16));
        
        Button clearLogButton = new Button("清空日志");
        clearLogButton.setStyle("-fx-background-color: #FF3B30; -fx-text-fill: white; -fx-font-size: 12px; -fx-padding: 8 16 8 16; -fx-background-radius: 4;");
        clearLogButton.setOnAction(e -> logArea.clear());
        
        logArea = new TextArea();
        logArea.setEditable(false);
        logArea.setWrapText(true);
        logArea.setStyle("-fx-font-family: 'Monaco', 'Consolas', monospace; -fx-font-size: 11px;");
        
        HBox headerBox = new HBox(10);
        headerBox.setAlignment(Pos.CENTER_LEFT);
        headerBox.getChildren().addAll(titleLabel, clearLogButton);
        
        pane.getChildren().addAll(headerBox, logArea);
        
        return pane;
    }
    
    private void sendSms() {
        String phoneNumber = phoneNumberField.getText().trim();
        String content = contentArea.getText().trim();
        
        if (phoneNumber.isEmpty()) {
            showAlert("错误", "请输入手机号");
            return;
        }
        
        if (content.isEmpty()) {
            showAlert("错误", "请输入短信内容");
            return;
        }
        
        appendLog("尝试发送短信到 " + phoneNumber);
        
        SmsSendResult result = smsService.sendSms(phoneNumber, content);
        
        if (result.isSuccess()) {
            appendLog("✓ 发送成功: " + result.getMessage() + " (ID: " + result.getMessageId() + ")");
            showAlert("成功", "短信发送成功！\n消息ID: " + result.getMessageId());
            updateStatus("短信发送成功");
        } else {
            appendLog("✗ 发送失败: " + result.getMessage());
            showAlert("失败", result.getMessage());
            updateStatus("短信发送失败");
        }
        
        refreshStatistics();
    }
    
    private void checkSmsStatus() {
        String phoneNumber = phoneNumberField.getText().trim();
        
        if (phoneNumber.isEmpty()) {
            showAlert("错误", "请输入手机号");
            return;
        }
        
        SmsValidationResult validation = smsService.canSendSms(phoneNumber);
        SmsStatistics stats = smsService.getStatistics(phoneNumber);
        
        String message = "手机号: " + phoneNumber + "\n" +
                        "状态: " + validation.getMessage() + "\n" +
                        "今日已发送: " + stats.getTodayCount() + "/10 条\n" +
                        "总计发送: " + stats.getTotalCount() + " 条\n" +
                        "最后发送: " + stats.getFormattedLastSendTime();
        
        showAlert("状态检查", message);
        appendLog("状态检查 - " + phoneNumber + ": " + validation.getMessage());
    }
    
    private void batchTest() {
        List<String> phoneNumbers = Arrays.asList(
            "13800138001", "13800138002", "13800138003", 
            "13800138004", "13800138005"
        );
        
        String content = "这是批量测试短信内容";
        
        appendLog("开始批量测试，发送到 " + phoneNumbers.size() + " 个手机号");
        
        SmsBatchSendResult result = smsService.batchSendSms(phoneNumbers, content);
        
        appendLog("批量发送完成: " + result.toString());
        
        if (!result.getErrorMessages().isEmpty()) {
            appendLog("错误详情:");
            for (String error : result.getErrorMessages()) {
                appendLog("  " + error);
            }
        }
        
        showAlert("批量测试结果", result.toString());
        refreshStatistics();
    }
    
    private void clearRecords() {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("确认操作");
        alert.setHeaderText("清空所有记录");
        alert.setContentText("确定要清空所有短信发送记录吗？此操作不可撤销。");
        
        alert.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                smsService.clearAllRecords();
                appendLog("已清空所有发送记录");
                refreshStatistics();
                updateStatus("记录已清空");
            }
        });
    }
    
    private void fillTestData() {
        phoneNumberField.setText("13800138000");
        contentArea.setText("这是一条测试短信，用于验证频率控制功能。");
        appendLog("已填充测试数据");
    }
    
    private void testFrequencyLimit() {
        String phoneNumber = "13900139000";
        String content = "频率限制测试短信";
        
        appendLog("开始测试10分钟频率限制...");
        
        // 第一次发送
        SmsSendResult result1 = smsService.sendSms(phoneNumber, content + " - 第1次");
        appendLog("第1次发送: " + (result1.isSuccess() ? "成功" : "失败 - " + result1.getMessage()));
        
        // 立即第二次发送（应该失败）
        SmsSendResult result2 = smsService.sendSms(phoneNumber, content + " - 第2次");
        appendLog("第2次发送: " + (result2.isSuccess() ? "成功" : "失败 - " + result2.getMessage()));
        
        refreshStatistics();
        updateStatus("频率限制测试完成");
    }
    
    private void testDailyLimit() {
        String phoneNumber = "13700137000";
        String content = "每日限制测试短信";
        
        appendLog("开始测试每日10条限制...");
        
        int successCount = 0;
        int failureCount = 0;
        
        for (int i = 1; i <= 12; i++) {
            SmsSendResult result = smsService.sendSms(phoneNumber, content + " - 第" + i + "条");
            if (result.isSuccess()) {
                successCount++;
                appendLog("第" + i + "条: 发送成功");
            } else {
                failureCount++;
                appendLog("第" + i + "条: 发送失败 - " + result.getMessage());
            }
            
            // 模拟时间间隔，避免频率限制
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        appendLog("每日限制测试完成: 成功 " + successCount + " 条, 失败 " + failureCount + " 条");
        refreshStatistics();
        updateStatus("每日限制测试完成");
    }
    
    private void refreshStatistics() {
        List<SmsStatistics> stats = smsService.getAllStatistics();
        statisticsTable.getItems().clear();
        statisticsTable.getItems().addAll(stats);
    }
    
    private void appendLog(String message) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        logArea.appendText("[" + timestamp + "] " + message + "\n");
    }
    
    private void updateStatus(String status) {
        statusLabel.setText("状态: " + status);
    }
    
    private void showAlert(String title, String message) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    public static void main(String[] args) {
        launch(args);
    }
}