package com.example.app.sse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * SSE应用程序主类
 * Spring Boot应用程序入口点
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class SSEApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(SSEApplication.class, args);
    }
}