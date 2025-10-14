package com.example.app.sse.example;

import com.example.app.sse.client.SSEClientProcessor;
import com.example.app.sse.model.MessageType;
import com.example.app.sse.model.SSEMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Scanner;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * SSE使用示例
 * 演示如何使用SSE客户端和服务器
 */
public class SSEExample {
    
    private static final Logger logger = LoggerFactory.getLogger(SSEExample.class);
    
    public static void main(String[] args) {
        // 服务器URL
        String serverUrl = "http://localhost:8080";
        
        // 创建客户端
        String clientId = "example_client_" + System.currentTimeMillis();
        String sessionId = "example_session_" + System.currentTimeMillis();
        
        SSEClientProcessor client = new SSEClientProcessor(serverUrl, clientId, sessionId);
        
        // 设置消息处理器
        client.setMessageHandler(message -> {
            System.out.println("收到消息:");
            System.out.println("  事件: " + message.getEvent());
            System.out.println("  数据: " + message.getData());
            System.out.println("  时间: " + message.getTimestamp());
            System.out.println("  ID: " + message.getId());
            System.out.println("---");
        });
        
        // 设置错误处理器
        client.setErrorHandler(error -> {
            System.err.println("错误: " + error);
        });
        
        // 设置连接状态处理器
        client.setConnectionHandler(status -> {
            System.out.println("连接状态: " + status);
        });
        
        // 启动客户端
        System.out.println("启动SSE客户端...");
        System.out.println("客户端ID: " + clientId);
        System.out.println("会话ID: " + sessionId);
        System.out.println("服务器: " + serverUrl);
        System.out.println("按 Enter 键退出...");
        
        client.connect();
        
        // 等待用户输入退出
        Scanner scanner = new Scanner(System.in);
        scanner.nextLine();
        
        // 关闭客户端
        System.out.println("正在关闭客户端...");
        client.close();
        
        System.out.println("客户端已关闭");
    }
    
    /**
     * 演示不同类型的消息处理
     */
    public static void demonstrateMessageHandling() {
        SSEClientProcessor client = new SSEClientProcessor("http://localhost:8080", "demo_client", "demo_session");
        
        client.setMessageHandler(message -> {
            MessageType messageType = MessageType.fromEventType(message.getEvent());
            
            switch (messageType) {
                case SYSTEM_INFO:
                    System.out.println("系统信息: " + message.getData());
                    break;
                    
                case USER_NOTIFICATION:
                    System.out.println("用户通知: " + message.getData());
                    break;
                    
                case DATA_UPDATE:
                    System.out.println("数据更新: " + message.getData());
                    break;
                    
                case PROGRESS_UPDATE:
                    System.out.println("进度更新: " + message.getData());
                    break;
                    
                case HEARTBEAT:
                    // 心跳消息通常不需要处理
                    break;
                    
                default:
                    System.out.println("其他消息: " + message.getEvent() + " - " + message.getData());
                    break;
            }
        });
        
        client.connect();
    }
    
    /**
     * 演示批量消息处理
     */
    public static void demonstrateBatchProcessing() {
        SSEClientProcessor client = new SSEClientProcessor("http://localhost:8080", "batch_client", "batch_session");
        
        client.setMessageHandler(message -> {
            // 模拟批量处理
            try {
                Thread.sleep(100); // 模拟处理时间
                System.out.println("批量处理消息: " + message.getEvent());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        
        client.connect();
    }
    
    /**
     * 演示错误处理和重连
     */
    public static void demonstrateErrorHandling() {
        SSEClientProcessor client = new SSEClientProcessor("http://localhost:8080", "error_client", "error_session");
        
        client.setErrorHandler(error -> {
            System.err.println("连接错误: " + error);
            System.out.println("尝试重新连接...");
            
            // 延迟重连
            new Thread(() -> {
                try {
                    Thread.sleep(5000); // 等待5秒
                    client.connect();
                } catch (Exception e) {
                    System.err.println("重连失败: " + e.getMessage());
                }
            }).start();
        });
        
        client.connect();
    }
}