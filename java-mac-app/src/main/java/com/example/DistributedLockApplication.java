package com.example;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 分布式锁演示应用主启动类
 */
@SpringBootApplication
@EnableScheduling  // 启用定时任务
public class DistributedLockApplication {
    
    private static final Logger logger = LoggerFactory.getLogger(DistributedLockApplication.class);
    
    public static void main(String[] args) {
        logger.info("======================================");
        logger.info("分布式锁演示应用启动中...");
        logger.info("======================================");
        
        SpringApplication.run(DistributedLockApplication.class, args);
        
        logger.info("======================================");
        logger.info("分布式锁演示应用启动完成！");
        logger.info("======================================");
        logger.info("功能说明：");
        logger.info("1. 数据同步任务 - 每30秒执行一次，使用分布式锁防止重复执行");
        logger.info("2. 报表生成任务 - 每分钟执行一次，使用分布式锁防止重复执行");
        logger.info("3. 清理过期数据任务 - 每小时执行一次，使用分布式锁防止重复执行");
        logger.info("4. 系统健康检查任务 - 每5分钟执行一次，不使用分布式锁");
        logger.info("======================================");
        logger.info("请确保Redis服务已启动（默认: localhost:6379）");
        logger.info("======================================");
    }
}