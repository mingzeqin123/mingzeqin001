package com.example.lock;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Redis分布式锁实现
 * 使用Lua脚本保证加锁和释放锁的原子性
 */
@Slf4j
@Component
public class RedisDistributedLock {

    private final RedisTemplate<String, Object> redisTemplate;
    
    // 加锁Lua脚本
    private static final String LOCK_SCRIPT = 
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('del', KEYS[1]) " +
        "else " +
        "    return 0 " +
        "end";
    
    // 释放锁Lua脚本
    private static final String UNLOCK_SCRIPT = 
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('del', KEYS[1]) " +
        "else " +
        "    return 0 " +
        "end";

    public RedisDistributedLock(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * 尝试获取分布式锁
     * 
     * @param lockKey 锁的key
     * @param requestId 请求标识，用于释放锁时验证
     * @param expireTime 锁的过期时间
     * @param timeUnit 时间单位
     * @return 是否获取成功
     */
    public boolean tryLock(String lockKey, String requestId, long expireTime, TimeUnit timeUnit) {
        try {
            Boolean result = redisTemplate.opsForValue().setIfAbsent(lockKey, requestId, expireTime, timeUnit);
            if (Boolean.TRUE.equals(result)) {
                log.debug("获取分布式锁成功，lockKey: {}, requestId: {}", lockKey, requestId);
                return true;
            } else {
                log.debug("获取分布式锁失败，lockKey: {}, requestId: {}", lockKey, requestId);
                return false;
            }
        } catch (Exception e) {
            log.error("获取分布式锁异常，lockKey: {}, requestId: {}", lockKey, requestId, e);
            return false;
        }
    }

    /**
     * 尝试获取分布式锁（带重试机制）
     * 
     * @param lockKey 锁的key
     * @param requestId 请求标识
     * @param expireTime 锁的过期时间
     * @param timeUnit 时间单位
     * @param retryTimes 重试次数
     * @param retryInterval 重试间隔（毫秒）
     * @return 是否获取成功
     */
    public boolean tryLockWithRetry(String lockKey, String requestId, long expireTime, TimeUnit timeUnit, 
                                   int retryTimes, long retryInterval) {
        for (int i = 0; i <= retryTimes; i++) {
            if (tryLock(lockKey, requestId, expireTime, timeUnit)) {
                return true;
            }
            
            if (i < retryTimes) {
                try {
                    Thread.sleep(retryInterval);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.warn("重试获取锁时被中断，lockKey: {}", lockKey);
                    return false;
                }
            }
        }
        return false;
    }

    /**
     * 释放分布式锁
     * 
     * @param lockKey 锁的key
     * @param requestId 请求标识
     * @return 是否释放成功
     */
    public boolean releaseLock(String lockKey, String requestId) {
        try {
            DefaultRedisScript<Long> script = new DefaultRedisScript<>();
            script.setScriptText(UNLOCK_SCRIPT);
            script.setResultType(Long.class);
            
            Long result = redisTemplate.execute(script, Collections.singletonList(lockKey), requestId);
            
            if (result != null && result == 1L) {
                log.debug("释放分布式锁成功，lockKey: {}, requestId: {}", lockKey, requestId);
                return true;
            } else {
                log.warn("释放分布式锁失败，锁可能已被其他线程释放，lockKey: {}, requestId: {}", lockKey, requestId);
                return false;
            }
        } catch (Exception e) {
            log.error("释放分布式锁异常，lockKey: {}, requestId: {}", lockKey, requestId, e);
            return false;
        }
    }

    /**
     * 生成唯一的请求标识
     * 
     * @return 请求标识
     */
    public String generateRequestId() {
        return UUID.randomUUID().toString();
    }

    /**
     * 检查锁是否存在
     * 
     * @param lockKey 锁的key
     * @return 锁是否存在
     */
    public boolean isLocked(String lockKey) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(lockKey));
        } catch (Exception e) {
            log.error("检查锁状态异常，lockKey: {}", lockKey, e);
            return false;
        }
    }

    /**
     * 获取锁的剩余过期时间
     * 
     * @param lockKey 锁的key
     * @return 剩余过期时间（秒），-1表示永不过期，-2表示key不存在
     */
    public long getLockExpireTime(String lockKey) {
        try {
            return redisTemplate.getExpire(lockKey, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("获取锁过期时间异常，lockKey: {}", lockKey, e);
            return -2;
        }
    }
}