package com.example.lock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Redis分布式锁实现
 * 使用SET命令的NX、EX参数和Lua脚本确保原子性操作
 */
@Component
public class RedisDistributedLock {
    
    private static final Logger logger = LoggerFactory.getLogger(RedisDistributedLock.class);
    
    private final StringRedisTemplate redisTemplate;
    
    // Lua脚本，用于原子性地释放锁
    private static final String UNLOCK_SCRIPT = 
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('del', KEYS[1]) " +
        "else " +
        "    return 0 " +
        "end";
    
    private final DefaultRedisScript<Long> unlockScript;
    
    public RedisDistributedLock(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.unlockScript = new DefaultRedisScript<>();
        this.unlockScript.setScriptText(UNLOCK_SCRIPT);
        this.unlockScript.setResultType(Long.class);
    }
    
    /**
     * 尝试获取分布式锁
     * 
     * @param lockKey 锁的key
     * @param lockValue 锁的value（通常使用UUID保证唯一性）
     * @param expireTime 锁的过期时间
     * @param timeUnit 时间单位
     * @return 是否成功获取锁
     */
    public boolean tryLock(String lockKey, String lockValue, long expireTime, TimeUnit timeUnit) {
        try {
            // 使用SET命令的NX参数（只在key不存在时设置）和EX参数（设置过期时间）
            Boolean result = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, expireTime, timeUnit);
            
            boolean lockAcquired = Boolean.TRUE.equals(result);
            
            if (lockAcquired) {
                logger.info("成功获取分布式锁: {}, 锁值: {}, 过期时间: {}{}",
                    lockKey, lockValue, expireTime, timeUnit);
            } else {
                logger.debug("获取分布式锁失败: {}", lockKey);
            }
            
            return lockAcquired;
        } catch (Exception e) {
            logger.error("获取分布式锁异常: {}", lockKey, e);
            return false;
        }
    }
    
    /**
     * 释放分布式锁
     * 使用Lua脚本确保只能释放自己持有的锁
     * 
     * @param lockKey 锁的key
     * @param lockValue 锁的value
     * @return 是否成功释放锁
     */
    public boolean releaseLock(String lockKey, String lockValue) {
        try {
            // 使用Lua脚本原子性地检查并删除锁
            Long result = redisTemplate.execute(unlockScript, 
                Collections.singletonList(lockKey), lockValue);
            
            boolean lockReleased = Long.valueOf(1).equals(result);
            
            if (lockReleased) {
                logger.info("成功释放分布式锁: {}, 锁值: {}", lockKey, lockValue);
            } else {
                logger.warn("释放分布式锁失败: {}，可能锁已过期或被其他线程持有", lockKey);
            }
            
            return lockReleased;
        } catch (Exception e) {
            logger.error("释放分布式锁异常: {}", lockKey, e);
            return false;
        }
    }
    
    /**
     * 带重试机制的获取锁方法
     * 
     * @param lockKey 锁的key
     * @param lockValue 锁的value
     * @param expireTime 锁的过期时间
     * @param timeUnit 时间单位
     * @param retryTimes 重试次数
     * @param retryIntervalMs 重试间隔（毫秒）
     * @return 是否成功获取锁
     */
    public boolean tryLockWithRetry(String lockKey, String lockValue, long expireTime, 
                                  TimeUnit timeUnit, int retryTimes, long retryIntervalMs) {
        
        for (int i = 0; i <= retryTimes; i++) {
            if (tryLock(lockKey, lockValue, expireTime, timeUnit)) {
                return true;
            }
            
            if (i < retryTimes) {
                try {
                    Thread.sleep(retryIntervalMs);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    logger.warn("获取锁重试被中断: {}", lockKey);
                    return false;
                }
            }
        }
        
        logger.warn("重试{}次后仍无法获取锁: {}", retryTimes, lockKey);
        return false;
    }
    
    /**
     * 生成唯一的锁值
     * 
     * @return UUID字符串
     */
    public String generateLockValue() {
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
            logger.error("检查锁状态异常: {}", lockKey, e);
            return false;
        }
    }
    
    /**
     * 获取锁的剩余过期时间
     * 
     * @param lockKey 锁的key
     * @return 剩余过期时间（秒），-1表示永不过期，-2表示key不存在
     */
    public long getLockTtl(String lockKey) {
        try {
            return redisTemplate.getExpire(lockKey, TimeUnit.SECONDS);
        } catch (Exception e) {
            logger.error("获取锁过期时间异常: {}", lockKey, e);
            return -2;
        }
    }
}