package com.example.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import com.example.app.service.MidJourneyService;

import java.awt.Desktop;
import java.net.URI;

/**
 * MidJourney参数构建应用程序主类
 * 启动Spring Boot Web服务器
 */
@SpringBootApplication
public class MidJourneyApplication {
    
    public static void main(String[] args) {
        // 设置系统属性
        System.setProperty("java.awt.headless", "false");
        System.setProperty("spring.main.web-application-type", "servlet");
        
        // 启动Spring Boot应用程序
        ConfigurableApplicationContext context = SpringApplication.run(MidJourneyApplication.class, args);
        
        // 打印启动信息
        printStartupInfo();
        
        // 自动打开浏览器（可选）
        openBrowser();
    }
    
    /**
     * 打印启动信息
     */
    private static void printStartupInfo() {
        System.out.println("\n" + "=".repeat(50));
        System.out.println("🎨 MidJourney 参数构建器已启动!");
        System.out.println("=".repeat(50));
        System.out.println("📱 Web服务器: http://localhost:8080");
        System.out.println("🔧 API接口: http://localhost:8080/api/midjourney");
        System.out.println("🌐 前端页面: http://localhost:8080/index.html");
        System.out.println("📚 使用说明:");
        System.out.println("   1. 在浏览器中打开上述地址");
        System.out.println("   2. 选择预设或自定义参数");
        System.out.println("   3. 点击'构建命令'生成MidJourney命令");
        System.out.println("   4. 复制命令到Discord使用");
        System.out.println("=".repeat(50) + "\n");
    }
    
    /**
     * 自动打开浏览器
     */
    private static void openBrowser() {
        try {
            if (Desktop.isDesktopSupported()) {
                Desktop desktop = Desktop.getDesktop();
                if (desktop.isSupported(Desktop.Action.BROWSE)) {
                    desktop.browse(new URI("http://localhost:8080"));
                    System.out.println("🚀 已自动打开浏览器");
                }
            }
        } catch (Exception e) {
            System.out.println("💡 请手动在浏览器中打开: http://localhost:8080");
        }
    }
    
    /**
     * 注册MidJourneyService Bean
     */
    @Bean
    public MidJourneyService midJourneyService() {
        return new MidJourneyService();
    }
}