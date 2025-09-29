package com.example.task;

import com.example.annotation.DistributedLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

/**
 * 定时任务服务
 * 使用分布式锁防止重复执行
 */
@Service
public class ScheduledTaskService {
    
    private static final Logger logger = LoggerFactory.getLogger(ScheduledTaskService.class);
    
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    /**
     * 数据同步任务
     * 每30秒执行一次，使用分布式锁防止重复执行
     */
    @Scheduled(fixedRate = 30000) // 每30秒执行一次
    @DistributedLock(
        key = "data-sync-task",
        expireTime = 25,
        timeUnit = TimeUnit.SECONDS,
        retry = true,
        retryTimes = 2,
        retryInterval = 1000,
        failStrategy = DistributedLock.LockFailStrategy.SKIP
    )
    public void dataSyncTask() {
        String startTime = LocalDateTime.now().format(formatter);
        logger.info("=== 数据同步任务开始执行 [{}] ===", startTime);
        
        try {
            // 模拟数据同步处理
            logger.info("正在同步用户数据...");
            Thread.sleep(2000); // 模拟2秒的处理时间
            
            logger.info("正在同步订单数据...");
            Thread.sleep(3000); // 模拟3秒的处理时间
            
            logger.info("正在更新缓存...");
            Thread.sleep(1000); // 模拟1秒的处理时间
            
            String endTime = LocalDateTime.now().format(formatter);
            logger.info("=== 数据同步任务执行完成 [{}] ===", endTime);
            
        } catch (Exception e) {
            logger.error("数据同步任务执行失败", e);
        }
    }
    
    /**
     * 报表生成任务
     * 每分钟执行一次，使用分布式锁防止重复执行
     */
    @Scheduled(cron = "0 * * * * ?") // 每分钟执行一次
    @DistributedLock(
        key = "report-generation-task",
        expireTime = 50,
        timeUnit = TimeUnit.SECONDS,
        retry = false,
        failStrategy = DistributedLock.LockFailStrategy.SKIP
    )
    public void reportGenerationTask() {
        String startTime = LocalDateTime.now().format(formatter);
        logger.info("=== 报表生成任务开始执行 [{}] ===", startTime);
        
        try {
            // 模拟报表生成处理
            logger.info("正在生成销售报表...");
            Thread.sleep(5000); // 模拟5秒的处理时间
            
            logger.info("正在生成用户统计报表...");
            Thread.sleep(3000); // 模拟3秒的处理时间
            
            logger.info("正在发送报表邮件...");
            Thread.sleep(2000); // 模拟2秒的处理时间
            
            String endTime = LocalDateTime.now().format(formatter);
            logger.info("=== 报表生成任务执行完成 [{}] ===", endTime);
            
        } catch (Exception e) {
            logger.error("报表生成任务执行失败", e);
        }
    }
    
    /**
     * 清理过期数据任务
     * 每小时执行一次，使用分布式锁防止重复执行
     */
    @Scheduled(cron = "0 0 * * * ?") // 每小时执行一次
    @DistributedLock(
        key = "cleanup-expired-data-task",
        expireTime = 30,
        timeUnit = TimeUnit.MINUTES,
        retry = true,
        retryTimes = 1,
        retryInterval = 5000,
        failStrategy = DistributedLock.LockFailStrategy.EXCEPTION
    )
    public void cleanupExpiredDataTask() {
        String startTime = LocalDateTime.now().format(formatter);
        logger.info("=== 清理过期数据任务开始执行 [{}] ===", startTime);
        
        try {
            // 模拟清理过期数据处理
            logger.info("正在清理过期日志...");
            Thread.sleep(10000); // 模拟10秒的处理时间
            
            logger.info("正在清理过期临时文件...");
            Thread.sleep(5000); // 模拟5秒的处理时间
            
            logger.info("正在清理过期缓存数据...");
            Thread.sleep(3000); // 模拟3秒的处理时间
            
            String endTime = LocalDateTime.now().format(formatter);
            logger.info("=== 清理过期数据任务执行完成 [{}] ===", endTime);
            
        } catch (Exception e) {
            logger.error("清理过期数据任务执行失败", e);
        }
    }
    
    /**
     * 系统健康检查任务
     * 每5分钟执行一次，不使用分布式锁（演示普通定时任务）
     */
    @Scheduled(fixedRate = 300000) // 每5分钟执行一次
    public void healthCheckTask() {
        String currentTime = LocalDateTime.now().format(formatter);
        logger.info("=== 系统健康检查 [{}] ===", currentTime);
        
        try {
            // 模拟健康检查
            logger.info("检查数据库连接...");
            logger.info("检查Redis连接...");
            logger.info("检查外部服务连接...");
            logger.info("系统运行正常");
            
        } catch (Exception e) {
            logger.error("系统健康检查失败", e);
        }
    }
}