package com.example.aspect;

import com.example.annotation.DistributedLock;
import com.example.lock.DistributedLockManager;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * 分布式锁AOP切面
 * 拦截带有@DistributedLock注解的方法
 */
@Slf4j
@Aspect
@Component
public class DistributedLockAspect {

    @Autowired
    private DistributedLockManager distributedLockManager;

    private final ExpressionParser parser = new SpelExpressionParser();
    private final DefaultParameterNameDiscoverer nameDiscoverer = new DefaultParameterNameDiscoverer();

    @Around("@annotation(distributedLock)")
    public Object around(ProceedingJoinPoint joinPoint, DistributedLock distributedLock) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        
        // 生成锁的key
        String lockKey = generateLockKey(joinPoint, distributedLock, method);
        
        log.debug("尝试获取分布式锁，lockKey: {}, method: {}", lockKey, method.getName());
        
        // 执行带锁的操作
        if (distributedLock.retryTimes() > 0) {
            // 带重试的执行
            return distributedLockManager.executeWithLockRetry(
                lockKey,
                distributedLock.expireTime(),
                distributedLock.timeUnit(),
                distributedLock.retryTimes(),
                distributedLock.retryInterval(),
                () -> {
                    try {
                        return joinPoint.proceed();
                    } catch (Throwable throwable) {
                        throw new RuntimeException(throwable);
                    }
                }
            );
        } else {
            // 不带重试的执行
            Object result = distributedLockManager.executeWithLock(
                lockKey,
                distributedLock.expireTime(),
                distributedLock.timeUnit(),
                () -> {
                    try {
                        return joinPoint.proceed();
                    } catch (Throwable throwable) {
                        throw new RuntimeException(throwable);
                    }
                }
            );
            
            // 如果获取锁失败且需要抛出异常
            if (result == null && distributedLock.throwException()) {
                throw new RuntimeException(distributedLock.message());
            }
            
            return result;
        }
    }

    /**
     * 生成锁的key
     * 支持SpEL表达式
     */
    private String generateLockKey(ProceedingJoinPoint joinPoint, DistributedLock distributedLock, Method method) {
        String key = distributedLock.key();
        
        // 如果key为空，使用默认的key（类名+方法名）
        if (key.isEmpty()) {
            return method.getDeclaringClass().getSimpleName() + ":" + method.getName();
        }
        
        // 如果key包含SpEL表达式，进行解析
        if (key.contains("#")) {
            try {
                return parseSpEL(key, joinPoint, method);
            } catch (Exception e) {
                log.warn("解析SpEL表达式失败，使用原始key: {}", key, e);
                return key;
            }
        }
        
        return key;
    }

    /**
     * 解析SpEL表达式
     */
    private String parseSpEL(String key, ProceedingJoinPoint joinPoint, Method method) {
        // 获取方法参数名
        String[] paramNames = nameDiscoverer.getParameterNames(method);
        Object[] args = joinPoint.getArgs();
        
        // 创建SpEL上下文
        EvaluationContext context = new StandardEvaluationContext();
        for (int i = 0; i < paramNames.length; i++) {
            context.setVariable(paramNames[i], args[i]);
        }
        
        // 解析表达式
        Expression expression = parser.parseExpression(key);
        return expression.getValue(context, String.class);
    }
}