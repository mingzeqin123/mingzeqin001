package com.example.aspect;

import com.example.annotation.DistributedLock;
import com.example.lock.RedisDistributedLock;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * 分布式锁切面
 * 拦截带有@DistributedLock注解的方法，自动加锁和释放锁
 */
@Aspect
@Component
public class DistributedLockAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(DistributedLockAspect.class);
    
    private final RedisDistributedLock distributedLock;
    
    public DistributedLockAspect(RedisDistributedLock distributedLock) {
        this.distributedLock = distributedLock;
    }
    
    @Around("@annotation(distributedLock)")
    public Object around(ProceedingJoinPoint joinPoint, DistributedLock distributedLock) throws Throwable {
        String lockKey = getLockKey(joinPoint, distributedLock);
        String lockValue = this.distributedLock.generateLockValue();
        
        logger.info("尝试获取分布式锁: {}", lockKey);
        
        boolean lockAcquired = false;
        
        try {
            // 根据配置选择获取锁的方式
            if (distributedLock.retry()) {
                lockAcquired = this.distributedLock.tryLockWithRetry(
                    lockKey, lockValue, 
                    distributedLock.expireTime(), distributedLock.timeUnit(),
                    distributedLock.retryTimes(), distributedLock.retryInterval()
                );
            } else {
                lockAcquired = this.distributedLock.tryLock(
                    lockKey, lockValue, 
                    distributedLock.expireTime(), distributedLock.timeUnit()
                );
            }
            
            if (!lockAcquired) {
                return handleLockFailure(distributedLock, lockKey);
            }
            
            logger.info("成功获取分布式锁，开始执行业务方法: {}", lockKey);
            
            // 执行目标方法
            return joinPoint.proceed();
            
        } finally {
            // 确保锁被释放
            if (lockAcquired) {
                boolean released = this.distributedLock.releaseLock(lockKey, lockValue);
                if (released) {
                    logger.info("分布式锁释放成功: {}", lockKey);
                } else {
                    logger.warn("分布式锁释放失败: {}", lockKey);
                }
            }
        }
    }
    
    /**
     * 生成锁的key
     */
    private String getLockKey(ProceedingJoinPoint joinPoint, DistributedLock distributedLock) {
        String key = distributedLock.key();
        
        if (key.isEmpty()) {
            // 默认使用类名+方法名作为key
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            return "lock:" + signature.getDeclaringTypeName() + "." + signature.getName();
        }
        
        // 这里可以扩展支持SpEL表达式解析
        return "lock:" + key;
    }
    
    /**
     * 处理获取锁失败的情况
     */
    private Object handleLockFailure(DistributedLock distributedLock, String lockKey) throws Exception {
        logger.warn("获取分布式锁失败: {}", lockKey);
        
        switch (distributedLock.failStrategy()) {
            case EXCEPTION:
                throw new RuntimeException("获取分布式锁失败: " + lockKey);
            case SKIP:
            default:
                logger.info("跳过方法执行: {}", lockKey);
                return null;
        }
    }
}