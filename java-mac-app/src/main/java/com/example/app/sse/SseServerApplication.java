package com.example.app.sse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * SSE服务器应用程序
 * 基于Spring Boot的SSE服务器
 */
@SpringBootApplication
public class SseServerApplication {
    
    private static ConfigurableApplicationContext applicationContext;
    
    public static void main(String[] args) {
        // 设置服务器端口
        System.setProperty("server.port", "8080");
        
        applicationContext = SpringApplication.run(SseServerApplication.class, args);
    }
    
    /**
     * 静态方法启动服务器
     */
    public static ConfigurableApplicationContext startServer() {
        return startServer(8080);
    }
    
    /**
     * 静态方法启动服务器（指定端口）
     */
    public static ConfigurableApplicationContext startServer(int port) {
        System.setProperty("server.port", String.valueOf(port));
        applicationContext = SpringApplication.run(SseServerApplication.class);
        return applicationContext;
    }
    
    /**
     * 静态方法停止服务器
     */
    public static void stopServer() {
        if (applicationContext != null) {
            SpringApplication.exit(applicationContext, () -> 0);
            applicationContext = null;
        }
    }
    
    /**
     * 获取应用程序上下文
     */
    public static ConfigurableApplicationContext getApplicationContext() {
        return applicationContext;
    }
    
    /**
     * CORS配置
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(false)
                        .maxAge(3600);
            }
        };
    }
}