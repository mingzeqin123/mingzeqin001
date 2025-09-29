package com.example.lock;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * 分布式锁管理器
 * 提供更高级的锁管理功能
 */
@Slf4j
@Component
public class DistributedLockManager {

    @Autowired
    private RedisDistributedLock redisDistributedLock;

    /**
     * 执行带锁的操作
     * 
     * @param lockKey 锁的key
     * @param expireTime 锁的过期时间
     * @param timeUnit 时间单位
     * @param operation 要执行的操作
     * @param <T> 返回值类型
     * @return 操作结果
     */
    public <T> T executeWithLock(String lockKey, long expireTime, TimeUnit timeUnit, Supplier<T> operation) {
        String requestId = redisDistributedLock.generateRequestId();
        
        try {
            if (redisDistributedLock.tryLock(lockKey, requestId, expireTime, timeUnit)) {
                log.debug("获取锁成功，开始执行操作，lockKey: {}", lockKey);
                return operation.get();
            } else {
                log.warn("获取锁失败，操作被跳过，lockKey: {}", lockKey);
                return null;
            }
        } finally {
            redisDistributedLock.releaseLock(lockKey, requestId);
        }
    }

    /**
     * 执行带锁的操作（带重试）
     * 
     * @param lockKey 锁的key
     * @param expireTime 锁的过期时间
     * @param timeUnit 时间单位
     * @param retryTimes 重试次数
     * @param retryInterval 重试间隔（毫秒）
     * @param operation 要执行的操作
     * @param <T> 返回值类型
     * @return 操作结果
     */
    public <T> T executeWithLockRetry(String lockKey, long expireTime, TimeUnit timeUnit, 
                                     int retryTimes, long retryInterval, Supplier<T> operation) {
        String requestId = redisDistributedLock.generateRequestId();
        
        try {
            if (redisDistributedLock.tryLockWithRetry(lockKey, requestId, expireTime, timeUnit, retryTimes, retryInterval)) {
                log.debug("获取锁成功，开始执行操作，lockKey: {}", lockKey);
                return operation.get();
            } else {
                log.warn("获取锁失败，操作被跳过，lockKey: {}", lockKey);
                return null;
            }
        } finally {
            redisDistributedLock.releaseLock(lockKey, requestId);
        }
    }

    /**
     * 执行带锁的无返回值操作
     * 
     * @param lockKey 锁的key
     * @param expireTime 锁的过期时间
     * @param timeUnit 时间单位
     * @param operation 要执行的操作
     * @return 是否执行成功
     */
    public boolean executeWithLock(String lockKey, long expireTime, TimeUnit timeUnit, Runnable operation) {
        String requestId = redisDistributedLock.generateRequestId();
        
        try {
            if (redisDistributedLock.tryLock(lockKey, requestId, expireTime, timeUnit)) {
                log.debug("获取锁成功，开始执行操作，lockKey: {}", lockKey);
                operation.run();
                return true;
            } else {
                log.warn("获取锁失败，操作被跳过，lockKey: {}", lockKey);
                return false;
            }
        } catch (Exception e) {
            log.error("执行带锁操作异常，lockKey: {}", lockKey, e);
            return false;
        } finally {
            redisDistributedLock.releaseLock(lockKey, requestId);
        }
    }

    /**
     * 执行带锁的无返回值操作（带重试）
     * 
     * @param lockKey 锁的key
     * @param expireTime 锁的过期时间
     * @param timeUnit 时间单位
     * @param retryTimes 重试次数
     * @param retryInterval 重试间隔（毫秒）
     * @param operation 要执行的操作
     * @return 是否执行成功
     */
    public boolean executeWithLockRetry(String lockKey, long expireTime, TimeUnit timeUnit, 
                                       int retryTimes, long retryInterval, Runnable operation) {
        String requestId = redisDistributedLock.generateRequestId();
        
        try {
            if (redisDistributedLock.tryLockWithRetry(lockKey, requestId, expireTime, timeUnit, retryTimes, retryInterval)) {
                log.debug("获取锁成功，开始执行操作，lockKey: {}", lockKey);
                operation.run();
                return true;
            } else {
                log.warn("获取锁失败，操作被跳过，lockKey: {}", lockKey);
                return false;
            }
        } catch (Exception e) {
            log.error("执行带锁操作异常，lockKey: {}", lockKey, e);
            return false;
        } finally {
            redisDistributedLock.releaseLock(lockKey, requestId);
        }
    }
}