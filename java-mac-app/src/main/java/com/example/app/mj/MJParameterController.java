package com.example.app.mj;

import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.Node;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.scene.text.Text;
import javafx.scene.text.TextAlignment;

import java.util.*;

/**
 * Controller for MJ parameter customization interface
 */
public class MJParameterController {
    private MJParameterService service;
    private Map<String, Node> parameterControls;
    private TextArea outputArea;
    private Label statusLabel;
    private VBox mainContainer;

    public MJParameterController() {
        this.service = new MJParameterService();
        this.parameterControls = new HashMap<>();
    }

    /**
     * Create the main parameter customization interface
     */
    public VBox createParameterInterface() {
        mainContainer = new VBox(15);
        mainContainer.setPadding(new Insets(20));
        mainContainer.setAlignment(Pos.TOP_CENTER);

        // Title
        Text title = new Text("Midjourney 参数定制器");
        title.setFont(Font.font("System", FontWeight.BOLD, 28));
        title.setFill(Color.DARKBLUE);
        title.setTextAlignment(TextAlignment.CENTER);

        // Description
        Text description = new Text("自定义您的 Midjourney 生成参数");
        description.setFont(Font.font("System", 16));
        description.setFill(Color.GRAY);
        description.setTextAlignment(TextAlignment.CENTER);

        // Create parameter sections
        VBox parameterSections = createParameterSections();

        // Output area
        outputArea = new TextArea();
        outputArea.setEditable(false);
        outputArea.setPrefRowCount(8);
        outputArea.setWrapText(true);
        outputArea.setStyle("-fx-font-family: 'Monaco', 'Consolas', monospace; -fx-font-size: 12px;");

        // Control buttons
        HBox buttonPanel = createButtonPanel();

        // Status bar
        statusLabel = new Label("就绪");
        statusLabel.setStyle("-fx-background-color: #F0F0F0; -fx-padding: 8; -fx-font-size: 12px;");

        mainContainer.getChildren().addAll(
            title, description, parameterSections, outputArea, buttonPanel, statusLabel
        );

        return mainContainer;
    }

    /**
     * Create parameter sections organized by category
     */
    private VBox createParameterSections() {
        VBox sectionsContainer = new VBox(20);
        Map<String, List<String>> categories = service.getParameterCategories();

        for (Map.Entry<String, List<String>> category : categories.entrySet()) {
            String categoryName = category.getKey();
            List<String> parameters = category.getValue();

            // Create category group
            TitledPane categoryPane = new TitledPane();
            categoryPane.setText(categoryName);
            categoryPane.setExpanded(categoryName.equals("Basic")); // Expand Basic by default

            VBox categoryContent = new VBox(10);
            categoryContent.setPadding(new Insets(15));

            for (String paramName : parameters) {
                VBox control = createParameterControl(paramName);
                if (control != null) {
                    parameterControls.put(paramName, control);
                    categoryContent.getChildren().add(control);
                }
            }

            categoryPane.setContent(categoryContent);
            sectionsContainer.getChildren().add(categoryPane);
        }

        return sectionsContainer;
    }

    /**
     * Create individual parameter control based on parameter type
     */
    private VBox createParameterControl(String paramName) {
        VBox controlContainer = new VBox(5);
        controlContainer.setPadding(new Insets(5));

        // Parameter label
        Label label = new Label(getParameterDisplayName(paramName) + ":");
        label.setFont(Font.font("System", FontWeight.BOLD, 14));
        label.setStyle("-fx-text-fill: #333333;");

        // Parameter description
        String description = service.getParameterDescription(paramName);
        Label descLabel = new Label(description);
        descLabel.setFont(Font.font("System", 11));
        descLabel.setStyle("-fx-text-fill: #666666;");
        descLabel.setWrapText(true);

        Node inputControl = null;

        if (paramName.equals("prompt")) {
            // Text area for prompt
            TextArea textArea = new TextArea();
            textArea.setPrefRowCount(3);
            textArea.setWrapText(true);
            textArea.setPromptText("输入您的提示词...");
            inputControl = textArea;
        } else if (paramName.equals("negativePrompt")) {
            // Text field for negative prompt
            TextField textField = new TextField();
            textField.setPromptText("输入您不想要的内容...");
            inputControl = textField;
        } else if (paramName.equals("seed")) {
            // Text field for seed
            TextField textField = new TextField();
            textField.setPromptText("输入随机种子...");
            inputControl = textField;
        } else if (paramName.equals("stop")) {
            // Slider for stop percentage
            HBox sliderContainer = new HBox(10);
            Slider slider = new Slider(10, 100, 100);
            slider.setShowTickLabels(true);
            slider.setShowTickMarks(true);
            slider.setMajorTickUnit(20);
            slider.setMinorTickCount(4);
            
            Label valueLabel = new Label("100");
            slider.valueProperty().addListener((obs, oldVal, newVal) -> {
                valueLabel.setText(String.valueOf(newVal.intValue()));
            });
            
            sliderContainer.getChildren().addAll(slider, valueLabel);
            inputControl = sliderContainer;
        } else if (paramName.equals("tile") || paramName.equals("video")) {
            // Checkbox for boolean parameters
            CheckBox checkBox = new CheckBox();
            inputControl = checkBox;
        } else {
            // ComboBox for other parameters
            List<String> options = service.getParameterOptions(paramName);
            if (!options.isEmpty()) {
                ComboBox<String> comboBox = new ComboBox<>(FXCollections.observableArrayList(options));
                comboBox.setValue(options.get(0));
                inputControl = comboBox;
            } else {
                // Text field for custom values
                TextField textField = new TextField();
                textField.setPromptText("输入值...");
                inputControl = textField;
            }
        }

        controlContainer.getChildren().addAll(label, descLabel, inputControl);
        return controlContainer;
    }

    /**
     * Create button panel with action buttons
     */
    private HBox createButtonPanel() {
        HBox buttonPanel = new HBox(15);
        buttonPanel.setAlignment(Pos.CENTER);

        Button generateButton = new Button("生成提示词");
        generateButton.setStyle("-fx-background-color: #007AFF; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;");
        generateButton.setOnAction(e -> generatePrompt());

        Button validateButton = new Button("验证参数");
        validateButton.setStyle("-fx-background-color: #34C759; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;");
        validateButton.setOnAction(e -> validateParameters());

        Button resetButton = new Button("重置参数");
        resetButton.setStyle("-fx-background-color: #FF9500; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;");
        resetButton.setOnAction(e -> resetParameters());

        Button clearButton = new Button("清空输出");
        clearButton.setStyle("-fx-background-color: #FF3B30; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;");
        clearButton.setOnAction(e -> clearOutput());

        buttonPanel.getChildren().addAll(generateButton, validateButton, resetButton, clearButton);
        return buttonPanel;
    }

    /**
     * Generate the final prompt
     */
    private void generatePrompt() {
        try {
            Map<String, String> parameters = collectParameters();
            String prompt = service.buildPrompt(parameters);
            
            outputArea.clear();
            outputArea.appendText("=== 生成的 Midjourney 提示词 ===\n");
            outputArea.appendText(prompt + "\n\n");
            outputArea.appendText("=== 参数详情 ===\n");
            
            for (Map.Entry<String, String> entry : parameters.entrySet()) {
                if (entry.getValue() != null && !entry.getValue().trim().isEmpty()) {
                    outputArea.appendText(entry.getKey() + ": " + entry.getValue() + "\n");
                }
            }
            
            updateStatus("提示词生成成功");
        } catch (Exception e) {
            outputArea.appendText("错误: " + e.getMessage() + "\n");
            updateStatus("生成失败: " + e.getMessage());
        }
    }

    /**
     * Validate current parameters
     */
    private void validateParameters() {
        Map<String, String> parameters = collectParameters();
        List<String> errors = service.validateParameters(parameters);
        
        outputArea.clear();
        if (errors.isEmpty()) {
            outputArea.appendText("✓ 所有参数验证通过！\n");
            updateStatus("参数验证成功");
        } else {
            outputArea.appendText("✗ 发现以下错误:\n");
            for (String error : errors) {
                outputArea.appendText("• " + error + "\n");
            }
            updateStatus("参数验证失败");
        }
    }

    /**
     * Reset all parameters to default values
     */
    private void resetParameters() {
        Map<String, String> defaults = service.getDefaultParameters();
        
        for (Map.Entry<String, Node> entry : parameterControls.entrySet()) {
            String paramName = entry.getKey();
            Node control = entry.getValue();
            
            if (paramName.equals("prompt")) {
                if (control instanceof TextArea) {
                    ((TextArea) control).clear();
                }
            } else if (paramName.equals("negativePrompt") || paramName.equals("seed")) {
                if (control instanceof TextField) {
                    ((TextField) control).clear();
                }
            } else if (paramName.equals("stop")) {
                if (control instanceof HBox) {
                    HBox container = (HBox) control;
                    Slider slider = (Slider) container.getChildren().get(0);
                    slider.setValue(100);
                }
            } else if (paramName.equals("tile") || paramName.equals("video")) {
                if (control instanceof CheckBox) {
                    ((CheckBox) control).setSelected(false);
                }
            } else {
                String defaultValue = defaults.get(paramName);
                if (defaultValue != null) {
                    if (control instanceof ComboBox) {
                        ((ComboBox<String>) control).setValue(defaultValue);
                    } else if (control instanceof TextField) {
                        ((TextField) control).setText(defaultValue);
                    }
                }
            }
        }
        
        updateStatus("参数已重置");
    }

    /**
     * Clear output area
     */
    private void clearOutput() {
        outputArea.clear();
        updateStatus("输出已清空");
    }

    /**
     * Collect parameter values from controls
     */
    private Map<String, String> collectParameters() {
        Map<String, String> parameters = new HashMap<>();
        
        for (Map.Entry<String, Node> entry : parameterControls.entrySet()) {
            String paramName = entry.getKey();
            Node control = entry.getValue();
            
            String value = null;
            
            if (control instanceof TextArea) {
                value = ((TextArea) control).getText();
            } else if (control instanceof TextField) {
                value = ((TextField) control).getText();
            } else if (control instanceof ComboBox) {
                value = ((ComboBox<String>) control).getValue();
            } else if (control instanceof CheckBox) {
                value = ((CheckBox) control).isSelected() ? "true" : null;
            } else if (control instanceof HBox) {
                HBox container = (HBox) control;
                Slider slider = (Slider) container.getChildren().get(0);
                value = String.valueOf(slider.getValue());
            }
            
            if (value != null && !value.trim().isEmpty()) {
                parameters.put(paramName, value.trim());
            }
        }
        
        return parameters;
    }

    /**
     * Get display name for parameter
     */
    private String getParameterDisplayName(String paramName) {
        switch (paramName) {
            case "prompt": return "提示词";
            case "aspectRatio": return "宽高比";
            case "style": return "风格";
            case "quality": return "质量";
            case "chaos": return "随机性";
            case "stylize": return "风格化";
            case "version": return "版本";
            case "seed": return "随机种子";
            case "stop": return "停止百分比";
            case "tile": return "平铺模式";
            case "imageWeight": return "图像权重";
            case "negativePrompt": return "负面提示";
            case "weird": return "怪异度";
            case "repeat": return "重复次数";
            case "video": return "生成视频";
            default: return paramName;
        }
    }

    /**
     * Update status label
     */
    private void updateStatus(String status) {
        Platform.runLater(() -> statusLabel.setText("状态: " + status));
    }
}