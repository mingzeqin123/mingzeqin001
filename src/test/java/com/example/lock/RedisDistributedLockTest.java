package com.example.lock;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Redis分布式锁测试类
 */
@SpringBootTest
@ActiveProfiles("test")
public class RedisDistributedLockTest {

    @Autowired
    private RedisDistributedLock redisDistributedLock;

    @Test
    public void testBasicLockAndUnlock() {
        String lockKey = "test:lock:basic";
        String requestId = redisDistributedLock.generateRequestId();

        // 测试获取锁
        assertTrue(redisDistributedLock.tryLock(lockKey, requestId, 10, TimeUnit.SECONDS));
        
        // 测试重复获取锁失败
        String anotherRequestId = redisDistributedLock.generateRequestId();
        assertFalse(redisDistributedLock.tryLock(lockKey, anotherRequestId, 10, TimeUnit.SECONDS));
        
        // 测试释放锁
        assertTrue(redisDistributedLock.releaseLock(lockKey, requestId));
        
        // 测试释放后可以重新获取锁
        assertTrue(redisDistributedLock.tryLock(lockKey, anotherRequestId, 10, TimeUnit.SECONDS));
        assertTrue(redisDistributedLock.releaseLock(lockKey, anotherRequestId));
    }

    @Test
    public void testLockWithRetry() {
        String lockKey = "test:lock:retry";
        String requestId = redisDistributedLock.generateRequestId();

        // 测试带重试的获取锁
        assertTrue(redisDistributedLock.tryLockWithRetry(lockKey, requestId, 10, TimeUnit.SECONDS, 3, 100));
        assertTrue(redisDistributedLock.releaseLock(lockKey, requestId));
    }

    @Test
    public void testConcurrentLock() throws InterruptedException {
        String lockKey = "test:lock:concurrent";
        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    String requestId = redisDistributedLock.generateRequestId();
                    if (redisDistributedLock.tryLock(lockKey, requestId, 5, TimeUnit.SECONDS)) {
                        successCount.incrementAndGet();
                        Thread.sleep(100); // 模拟业务处理
                        redisDistributedLock.releaseLock(lockKey, requestId);
                    } else {
                        failCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    failCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // 只有一个线程能获取到锁
        assertEquals(1, successCount.get());
        assertEquals(threadCount - 1, failCount.get());
    }

    @Test
    public void testLockExpiration() throws InterruptedException {
        String lockKey = "test:lock:expiration";
        String requestId = redisDistributedLock.generateRequestId();

        // 获取锁，设置很短的过期时间
        assertTrue(redisDistributedLock.tryLock(lockKey, requestId, 1, TimeUnit.SECONDS));
        
        // 等待锁过期
        Thread.sleep(1500);
        
        // 锁应该已经过期，可以重新获取
        String newRequestId = redisDistributedLock.generateRequestId();
        assertTrue(redisDistributedLock.tryLock(lockKey, newRequestId, 10, TimeUnit.SECONDS));
        assertTrue(redisDistributedLock.releaseLock(lockKey, newRequestId));
    }

    @Test
    public void testIsLocked() {
        String lockKey = "test:lock:status";
        String requestId = redisDistributedLock.generateRequestId();

        // 初始状态应该没有锁
        assertFalse(redisDistributedLock.isLocked(lockKey));

        // 获取锁后应该有锁
        assertTrue(redisDistributedLock.tryLock(lockKey, requestId, 10, TimeUnit.SECONDS));
        assertTrue(redisDistributedLock.isLocked(lockKey));

        // 释放锁后应该没有锁
        assertTrue(redisDistributedLock.releaseLock(lockKey, requestId));
        assertFalse(redisDistributedLock.isLocked(lockKey));
    }
}