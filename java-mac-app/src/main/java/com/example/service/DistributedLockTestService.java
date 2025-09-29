package com.example.service;

import com.example.annotation.DistributedLock;
import com.example.lock.RedisDistributedLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 分布式锁测试服务
 * 提供手动测试分布式锁功能的方法
 */
@Service
public class DistributedLockTestService {
    
    private static final Logger logger = LoggerFactory.getLogger(DistributedLockTestService.class);
    
    private final RedisDistributedLock distributedLock;
    
    public DistributedLockTestService(RedisDistributedLock distributedLock) {
        this.distributedLock = distributedLock;
    }
    
    /**
     * 使用注解的分布式锁测试方法
     */
    @DistributedLock(
        key = "test-method-lock",
        expireTime = 10,
        timeUnit = TimeUnit.SECONDS,
        retry = true,
        retryTimes = 3,
        retryInterval = 1000,
        failStrategy = DistributedLock.LockFailStrategy.SKIP
    )
    public void testMethodWithLock() {
        logger.info("开始执行带锁的测试方法...");
        
        try {
            // 模拟业务处理
            Thread.sleep(5000);
            logger.info("带锁的测试方法执行完成");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("方法执行被中断", e);
        }
    }
    
    /**
     * 手动使用分布式锁的测试方法
     */
    public void testManualLock() {
        String lockKey = "manual-test-lock";
        String lockValue = distributedLock.generateLockValue();
        
        logger.info("手动测试分布式锁开始...");
        
        try {
            // 尝试获取锁
            boolean lockAcquired = distributedLock.tryLock(lockKey, lockValue, 10, TimeUnit.SECONDS);
            
            if (lockAcquired) {
                logger.info("成功获取锁，开始执行业务逻辑...");
                
                // 模拟业务处理
                Thread.sleep(3000);
                
                logger.info("业务逻辑执行完成");
            } else {
                logger.warn("获取锁失败，跳过执行");
            }
            
        } catch (Exception e) {
            logger.error("手动锁测试异常", e);
        } finally {
            // 释放锁
            distributedLock.releaseLock(lockKey, lockValue);
        }
    }
    
    /**
     * 测试锁的状态查询
     */
    public void testLockStatus() {
        String lockKey = "status-test-lock";
        String lockValue = distributedLock.generateLockValue();
        
        logger.info("测试锁状态查询...");
        
        // 检查锁是否存在（应该返回false）
        boolean isLocked = distributedLock.isLocked(lockKey);
        logger.info("锁是否存在: {}", isLocked);
        
        // 获取锁
        boolean lockAcquired = distributedLock.tryLock(lockKey, lockValue, 30, TimeUnit.SECONDS);
        logger.info("获取锁结果: {}", lockAcquired);
        
        if (lockAcquired) {
            // 再次检查锁状态
            isLocked = distributedLock.isLocked(lockKey);
            logger.info("获取锁后状态: {}", isLocked);
            
            // 查看锁的TTL
            long ttl = distributedLock.getLockTtl(lockKey);
            logger.info("锁的剩余过期时间: {} 秒", ttl);
            
            // 释放锁
            distributedLock.releaseLock(lockKey, lockValue);
            
            // 检查释放后的状态
            isLocked = distributedLock.isLocked(lockKey);
            logger.info("释放锁后状态: {}", isLocked);
        }
    }
    
    /**
     * 测试锁的重试机制
     */
    public void testLockRetry() {
        String lockKey = "retry-test-lock";
        String lockValue1 = distributedLock.generateLockValue();
        String lockValue2 = distributedLock.generateLockValue();
        
        logger.info("测试锁的重试机制...");
        
        // 第一个线程获取锁
        boolean lock1 = distributedLock.tryLock(lockKey, lockValue1, 5, TimeUnit.SECONDS);
        logger.info("第一个锁获取结果: {}", lock1);
        
        if (lock1) {
            // 第二个线程尝试获取锁（带重试）
            new Thread(() -> {
                logger.info("第二个线程开始尝试获取锁...");
                boolean lock2 = distributedLock.tryLockWithRetry(
                    lockKey, lockValue2, 10, TimeUnit.SECONDS, 3, 1000);
                logger.info("第二个锁获取结果: {}", lock2);
                
                if (lock2) {
                    try {
                        Thread.sleep(2000);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    distributedLock.releaseLock(lockKey, lockValue2);
                }
            }).start();
            
            try {
                // 第一个线程持有锁3秒后释放
                Thread.sleep(3000);
                distributedLock.releaseLock(lockKey, lockValue1);
                logger.info("第一个锁已释放");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}