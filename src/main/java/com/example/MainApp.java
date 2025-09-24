package com.example;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

/**
 * 主应用程序类
 * 创建一个简单的GUI应用程序，展示Mac安装器的功能
 */
public class MainApp extends JFrame {
    
    private JLabel statusLabel;
    private JTextArea logArea;
    private int counter = 0;
    
    public MainApp() {
        initializeUI();
    }
    
    private void initializeUI() {
        setTitle("Mac Installer App - Java应用程序");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(600, 400);
        setLocationRelativeTo(null);
        
        // 设置系统外观
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeel());
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // 创建主面板
        JPanel mainPanel = new JPanel(new BorderLayout());
        mainPanel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
        
        // 标题
        JLabel titleLabel = new JLabel("欢迎使用Mac安装器应用程序", JLabel.CENTER);
        titleLabel.setFont(new Font("Arial", Font.BOLD, 18));
        titleLabel.setBorder(BorderFactory.createEmptyBorder(0, 0, 20, 0));
        
        // 状态标签
        statusLabel = new JLabel("应用程序已成功启动！", JLabel.CENTER);
        statusLabel.setFont(new Font("Arial", Font.PLAIN, 14));
        statusLabel.setForeground(Color.BLUE);
        
        // 按钮面板
        JPanel buttonPanel = new JPanel(new FlowLayout());
        
        JButton clickButton = new JButton("点击计数");
        clickButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                counter++;
                statusLabel.setText("按钮被点击了 " + counter + " 次");
                logArea.append("按钮点击 #" + counter + " - " + 
                    java.time.LocalDateTime.now() + "\n");
            }
        });
        
        JButton infoButton = new JButton("系统信息");
        infoButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                showSystemInfo();
            }
        });
        
        JButton clearButton = new JButton("清空日志");
        clearButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                logArea.setText("");
                counter = 0;
                statusLabel.setText("日志已清空，计数器重置");
            }
        });
        
        buttonPanel.add(clickButton);
        buttonPanel.add(infoButton);
        buttonPanel.add(clearButton);
        
        // 日志区域
        logArea = new JTextArea(10, 40);
        logArea.setEditable(false);
        logArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        logArea.setBorder(BorderFactory.createTitledBorder("操作日志"));
        JScrollPane scrollPane = new JScrollPane(logArea);
        
        // 添加组件到主面板
        mainPanel.add(titleLabel, BorderLayout.NORTH);
        mainPanel.add(statusLabel, BorderLayout.CENTER);
        mainPanel.add(buttonPanel, BorderLayout.SOUTH);
        mainPanel.add(scrollPane, BorderLayout.CENTER);
        
        add(mainPanel);
        
        // 初始化日志
        logArea.append("应用程序启动时间: " + java.time.LocalDateTime.now() + "\n");
        logArea.append("Java版本: " + System.getProperty("java.version") + "\n");
        logArea.append("操作系统: " + System.getProperty("os.name") + " " + 
            System.getProperty("os.version") + "\n");
        logArea.append("用户目录: " + System.getProperty("user.home") + "\n");
        logArea.append("----------------------------------------\n");
    }
    
    private void showSystemInfo() {
        StringBuilder info = new StringBuilder();
        info.append("\n=== 系统信息 ===\n");
        info.append("Java版本: ").append(System.getProperty("java.version")).append("\n");
        info.append("Java供应商: ").append(System.getProperty("java.vendor")).append("\n");
        info.append("Java主目录: ").append(System.getProperty("java.home")).append("\n");
        info.append("操作系统: ").append(System.getProperty("os.name")).append("\n");
        info.append("操作系统版本: ").append(System.getProperty("os.version")).append("\n");
        info.append("操作系统架构: ").append(System.getProperty("os.arch")).append("\n");
        info.append("用户名称: ").append(System.getProperty("user.name")).append("\n");
        info.append("用户目录: ").append(System.getProperty("user.home")).append("\n");
        info.append("工作目录: ").append(System.getProperty("user.dir")).append("\n");
        info.append("可用处理器数: ").append(Runtime.getRuntime().availableProcessors()).append("\n");
        info.append("总内存: ").append(Runtime.getRuntime().totalMemory() / 1024 / 1024).append(" MB\n");
        info.append("可用内存: ").append(Runtime.getRuntime().freeMemory() / 1024 / 1024).append(" MB\n");
        info.append("================\n");
        
        logArea.append(info.toString());
        
        // 显示对话框
        JOptionPane.showMessageDialog(this, 
            "系统信息已添加到日志中", 
            "系统信息", 
            JOptionPane.INFORMATION_MESSAGE);
    }
    
    public static void main(String[] args) {
        // 设置Mac特定的系统属性
        System.setProperty("apple.laf.useScreenMenuBar", "true");
        System.setProperty("com.apple.mrj.application.apple.menu.about.name", "Mac Installer App");
        
        SwingUtilities.invokeLater(new Runnable() {
            @Override
            public void run() {
                try {
                    new MainApp().setVisible(true);
                } catch (Exception e) {
                    e.printStackTrace();
                    JOptionPane.showMessageDialog(null, 
                        "应用程序启动失败: " + e.getMessage(), 
                        "错误", 
                        JOptionPane.ERROR_MESSAGE);
                }
            }
        });
    }
}