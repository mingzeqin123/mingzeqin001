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
import java.util.Locale;

/**
 * A simple JavaFX application for macOS
 * This application demonstrates a modern GUI with file operations and system integration
 */
public class MacJavaApp extends Application {

    private TextArea outputArea;
    private Label statusLabel;
    private I18nManager i18n;
    private Label titleLabel;
    private Label descLabel;
    private Button helloButton;
    private Button fileButton;
    private Button systemInfoButton;
    private Button clearButton;
    private MenuBar menuBar;

    @Override
    public void start(Stage primaryStage) {
        // Initialize i18n manager
        i18n = I18nManager.getInstance();
        
        // Create menu bar
        createMenuBar(primaryStage);
        
        // Set window title
        primaryStage.setTitle(i18n.getMessage("app.title"));

        // Create the main layout
        VBox root = new VBox(10);
        root.setPadding(new Insets(20));
        root.setAlignment(Pos.TOP_CENTER);

        // Add menu bar
        VBox mainContainer = new VBox();
        mainContainer.getChildren().addAll(menuBar, root);

        // Initialize UI components
        initializeComponents();
        
        // Add components to root
        HBox buttonPanel = new HBox(10);
        buttonPanel.setAlignment(Pos.CENTER);
        buttonPanel.getChildren().addAll(helloButton, fileButton, systemInfoButton, clearButton);
        
        root.getChildren().addAll(titleLabel, descLabel, buttonPanel, outputArea, statusLabel);

        // Create scene
        Scene scene = new Scene(mainContainer, 600, 550);
        primaryStage.setScene(scene);
        primaryStage.setResizable(true);
        primaryStage.show();

        // Initial welcome message
        appendOutput(i18n.getMessage("app.startup.success"));
        appendOutput(i18n.getMessage("app.current.time", 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))));
        updateStatus(i18n.getMessage("status.started"));
    }
    
    private void createMenuBar(Stage primaryStage) {
        menuBar = new MenuBar();
        
        // Language menu
        Menu languageMenu = new Menu("Language / 语言");
        
        for (Locale locale : i18n.getSupportedLocales()) {
            MenuItem menuItem = new MenuItem(i18n.getLocaleDisplayName(locale));
            menuItem.setOnAction(e -> changeLanguage(locale, primaryStage));
            languageMenu.getItems().add(menuItem);
        }
        
        menuBar.getMenus().add(languageMenu);
    }
    
    private void initializeComponents() {
        // Title
        titleLabel = new Label(i18n.getMessage("app.welcome"));
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 24));
        titleLabel.setTextFill(Color.DARKBLUE);

        // Description
        descLabel = new Label(i18n.getMessage("app.description"));
        descLabel.setFont(Font.font("System", 14));
        descLabel.setTextFill(Color.GRAY);

        // Buttons
        helloButton = new Button(i18n.getMessage("button.greeting"));
        fileButton = new Button(i18n.getMessage("button.selectFile"));
        systemInfoButton = new Button(i18n.getMessage("button.systemInfo"));
        clearButton = new Button(i18n.getMessage("button.clear"));

        // Style buttons
        String buttonStyle = "-fx-background-color: #007AFF; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;";
        helloButton.setStyle(buttonStyle);
        fileButton.setStyle(buttonStyle);
        systemInfoButton.setStyle(buttonStyle);
        clearButton.setStyle("-fx-background-color: #FF3B30; -fx-text-fill: white; -fx-font-size: 14px; -fx-padding: 10 20 10 20; -fx-background-radius: 5;");

        // Output area
        outputArea = new TextArea();
        outputArea.setEditable(false);
        outputArea.setPrefRowCount(15);
        outputArea.setWrapText(true);
        outputArea.setStyle("-fx-font-family: 'Monaco', 'Consolas', monospace; -fx-font-size: 12px;");

        // Status bar
        statusLabel = new Label(i18n.getMessage("status.ready"));
        statusLabel.setStyle("-fx-background-color: #F0F0F0; -fx-padding: 5; -fx-font-size: 12px;");

        // Event handlers
        helloButton.setOnAction(e -> showGreeting());
        fileButton.setOnAction(e -> selectFile((Stage) helloButton.getScene().getWindow()));
        systemInfoButton.setOnAction(e -> showSystemInfo());
        clearButton.setOnAction(e -> clearOutput());
    }
    
    private void changeLanguage(Locale locale, Stage primaryStage) {
        i18n.setLocale(locale);
        refreshUI(primaryStage);
    }
    
    private void refreshUI(Stage primaryStage) {
        // Update window title
        primaryStage.setTitle(i18n.getMessage("app.title"));
        
        // Update all text components
        titleLabel.setText(i18n.getMessage("app.welcome"));
        descLabel.setText(i18n.getMessage("app.description"));
        helloButton.setText(i18n.getMessage("button.greeting"));
        fileButton.setText(i18n.getMessage("button.selectFile"));
        systemInfoButton.setText(i18n.getMessage("button.systemInfo"));
        clearButton.setText(i18n.getMessage("button.clear"));
        
        // Update status if it shows ready
        if (statusLabel.getText().contains("Ready") || statusLabel.getText().contains("就绪")) {
            statusLabel.setText(i18n.getMessage("status.ready"));
        }
        
        appendOutput("Language changed to: " + i18n.getCurrentLocale().getDisplayName());
    }

    private void showGreeting() {
        StringBuilder greeting = new StringBuilder();
        greeting.append(i18n.getMessage("greeting.hello")).append("\n");
        greeting.append(i18n.getMessage("greeting.features")).append("\n");
        greeting.append(i18n.getMessage("greeting.feature1")).append("\n");
        greeting.append(i18n.getMessage("greeting.feature2")).append("\n");
        greeting.append(i18n.getMessage("greeting.feature3")).append("\n");
        greeting.append(i18n.getMessage("greeting.feature4"));
        
        appendOutput(greeting.toString());
        updateStatus(i18n.getMessage("status.greeting"));
    }

    private void selectFile(Stage stage) {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle(i18n.getMessage("file.chooser.title"));
        fileChooser.getExtensionFilters().addAll(
                new FileChooser.ExtensionFilter(i18n.getMessage("file.chooser.allFiles"), "*.*"),
                new FileChooser.ExtensionFilter(i18n.getMessage("file.chooser.textFiles"), "*.txt"),
                new FileChooser.ExtensionFilter(i18n.getMessage("file.chooser.imageFiles"), "*.png", "*.jpg", "*.gif")
        );

        File selectedFile = fileChooser.showOpenDialog(stage);
        if (selectedFile != null) {
            appendOutput(i18n.getMessage("file.selected", selectedFile.getAbsolutePath()));
            appendOutput(i18n.getMessage("file.size", selectedFile.length()));
            String readableText = selectedFile.canRead() ? i18n.getMessage("file.yes") : i18n.getMessage("file.no");
            appendOutput(i18n.getMessage("file.readable", readableText));
            updateStatus(i18n.getMessage("status.fileSelected", selectedFile.getName()));
        } else {
            updateStatus(i18n.getMessage("status.fileCancelled"));
        }
    }

    private void showSystemInfo() {
        appendOutput("=== " + i18n.getMessage("system.info.title") + " ===");
        appendOutput(i18n.getMessage("system.os", System.getProperty("os.name")));
        appendOutput(i18n.getMessage("system.version", System.getProperty("os.version")));
        appendOutput(i18n.getMessage("system.arch", System.getProperty("os.arch")));
        appendOutput(i18n.getMessage("system.java.version", System.getProperty("java.version")));
        appendOutput(i18n.getMessage("system.java.vendor", System.getProperty("java.vendor")));
        appendOutput(i18n.getMessage("system.user.name", System.getProperty("user.name")));
        appendOutput(i18n.getMessage("system.user.home", System.getProperty("user.home")));
        appendOutput(i18n.getMessage("system.user.dir", System.getProperty("user.dir")));
        appendOutput(i18n.getMessage("system.processors", Runtime.getRuntime().availableProcessors()));
        appendOutput(i18n.getMessage("system.memory.max", Runtime.getRuntime().maxMemory() / 1024 / 1024));
        appendOutput(i18n.getMessage("system.memory.used", (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024 / 1024));
        updateStatus(i18n.getMessage("status.systemInfo"));
    }

    private void clearOutput() {
        outputArea.clear();
        updateStatus(i18n.getMessage("status.outputCleared"));
    }

    private void appendOutput(String text) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        outputArea.appendText("[" + timestamp + "] " + text + "\n");
    }

    private void updateStatus(String status) {
        statusLabel.setText(status);
    }

    public static void main(String[] args) {
        // Set system properties for better macOS integration
        System.setProperty("apple.laf.useScreenMenuBar", "true");
        System.setProperty("com.apple.mrj.application.apple.menu.about.name", "Mac Java App");
        System.setProperty("apple.awt.application.name", "Mac Java App");

        launch(args);
    }
}