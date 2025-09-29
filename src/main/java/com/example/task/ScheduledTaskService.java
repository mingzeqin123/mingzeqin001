package com.example.task;

import com.example.annotation.DistributedLock;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 定时任务服务示例
 * 演示如何使用分布式锁防止定时任务重复执行
 */
@Slf4j
@Service
public class ScheduledTaskService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 示例1：简单的定时任务，使用默认锁key
     * 每10秒执行一次
     */
    @Scheduled(fixedRate = 10000)
    @DistributedLock(expireTime = 15, timeUnit = java.util.concurrent.TimeUnit.SECONDS)
    public void simpleScheduledTask() {
        log.info("执行简单定时任务，时间: {}", LocalDateTime.now().format(FORMATTER));
        
        // 模拟业务处理
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        log.info("简单定时任务执行完成，时间: {}", LocalDateTime.now().format(FORMATTER));
    }

    /**
     * 示例2：带参数的定时任务，使用SpEL表达式生成锁key
     * 每30秒执行一次
     */
    @Scheduled(fixedRate = 30000)
    @DistributedLock(
        key = "dataSyncTask:#{#taskType}",
        expireTime = 60,
        timeUnit = java.util.concurrent.TimeUnit.SECONDS,
        retryTimes = 2,
        retryInterval = 1000
    )
    public void dataSyncTask() {
        String taskType = "userData";
        log.info("执行数据同步任务，类型: {}, 时间: {}", taskType, LocalDateTime.now().format(FORMATTER));
        
        // 模拟数据同步处理
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        log.info("数据同步任务执行完成，类型: {}, 时间: {}", taskType, LocalDateTime.now().format(FORMATTER));
    }

    /**
     * 示例3：Cron表达式定时任务
     * 每天凌晨2点执行
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @DistributedLock(
        key = "dailyReportTask",
        expireTime = 30,
        timeUnit = java.util.concurrent.TimeUnit.MINUTES,
        throwException = true,
        message = "日报生成任务正在执行中，请稍后再试"
    )
    public void dailyReportTask() {
        log.info("执行日报生成任务，时间: {}", LocalDateTime.now().format(FORMATTER));
        
        // 模拟生成日报
        try {
            Thread.sleep(10000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        log.info("日报生成任务执行完成，时间: {}", LocalDateTime.now().format(FORMATTER));
    }

    /**
     * 示例4：带重试机制的定时任务
     * 每5分钟执行一次
     */
    @Scheduled(fixedRate = 300000)
    @DistributedLock(
        key = "retryTask",
        expireTime = 10,
        timeUnit = java.util.concurrent.TimeUnit.MINUTES,
        retryTimes = 3,
        retryInterval = 2000
    )
    public void retryTask() {
        log.info("执行重试任务，时间: {}", LocalDateTime.now().format(FORMATTER));
        
        // 模拟可能失败的业务处理
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        log.info("重试任务执行完成，时间: {}", LocalDateTime.now().format(FORMATTER));
    }

    /**
     * 示例5：手动触发的任务（非定时任务）
     * 可以通过HTTP接口调用
     */
    @DistributedLock(
        key = "manualTask:#{#taskId}",
        expireTime = 5,
        timeUnit = java.util.concurrent.TimeUnit.MINUTES
    )
    public void manualTask(String taskId) {
        log.info("执行手动任务，任务ID: {}, 时间: {}", taskId, LocalDateTime.now().format(FORMATTER));
        
        // 模拟手动任务处理
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        log.info("手动任务执行完成，任务ID: {}, 时间: {}", taskId, LocalDateTime.now().format(FORMATTER));
    }
}