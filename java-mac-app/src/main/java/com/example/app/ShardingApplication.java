package com.example.app;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

/**
 * Sharding JDBC 分表演示应用程序
 */
@Slf4j
@SpringBootApplication
public class ShardingApplication {

    public static void main(String[] args) {
        log.info("启动 Sharding JDBC 分表演示应用程序...");
        SpringApplication.run(ShardingApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("==========================================");
        log.info("Sharding JDBC 分表演示应用程序启动成功！");
        log.info("访问地址: http://localhost:8080");
        log.info("==========================================");
    }
}