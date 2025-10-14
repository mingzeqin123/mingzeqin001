package com.example.app.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.concurrent.*;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.regex.Pattern;

/**
 * SSE消息处理器
 * 提供消息过滤、转换、路由等功能
 */
public class SseMessageProcessor {
    
    private static final Logger logger = LoggerFactory.getLogger(SseMessageProcessor.class);
    
    private final ExecutorService executorService;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, MessageHandler> handlers;
    private final ConcurrentHashMap<String, MessageFilter> filters;
    private final ConcurrentHashMap<String, MessageTransformer> transformers;
    private final BlockingQueue<SseMessage> messageQueue;
    private final CompletableFuture<Void> processingTask;
    
    private volatile boolean running = true;
    
    public SseMessageProcessor() {
        this.executorService = Executors.newFixedThreadPool(4);
        this.objectMapper = new ObjectMapper();
        this.handlers = new ConcurrentHashMap<>();
        this.filters = new ConcurrentHashMap<>();
        this.transformers = new ConcurrentHashMap<>();
        this.messageQueue = new LinkedBlockingQueue<>();
        
        // 启动消息处理循环
        this.processingTask = CompletableFuture.runAsync(this::processMessages, executorService);
    }
    
    /**
     * 消息处理器接口
     */
    @FunctionalInterface
    public interface MessageHandler {
        void handle(SseMessage message) throws Exception;
    }
    
    /**
     * 消息过滤器接口
     */
    @FunctionalInterface
    public interface MessageFilter {
        boolean accept(SseMessage message);
    }
    
    /**
     * 消息转换器接口
     */
    @FunctionalInterface
    public interface MessageTransformer {
        SseMessage transform(SseMessage message) throws Exception;
    }
    
    /**
     * 提交消息进行处理
     */
    public void submitMessage(SseMessage message) {
        if (message == null) {
            return;
        }
        
        try {
            messageQueue.offer(message, 1, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.warn("提交消息被中断", e);
        }
    }
    
    /**
     * 注册消息处理器
     */
    public void registerHandler(String eventType, MessageHandler handler) {
        handlers.put(eventType, handler);
        logger.info("注册消息处理器: eventType={}", eventType);
    }
    
    /**
     * 注册消息过滤器
     */
    public void registerFilter(String name, MessageFilter filter) {
        filters.put(name, filter);
        logger.info("注册消息过滤器: name={}", name);
    }
    
    /**
     * 注册消息转换器
     */
    public void registerTransformer(String name, MessageTransformer transformer) {
        transformers.put(name, transformer);
        logger.info("注册消息转换器: name={}", name);
    }
    
    /**
     * 移除处理器
     */
    public void removeHandler(String eventType) {
        handlers.remove(eventType);
    }
    
    /**
     * 移除过滤器
     */
    public void removeFilter(String name) {
        filters.remove(name);
    }
    
    /**
     * 移除转换器
     */
    public void removeTransformer(String name) {
        transformers.remove(name);
    }
    
    /**
     * 消息处理主循环
     */
    private void processMessages() {
        logger.info("消息处理器启动");
        
        while (running) {
            try {
                SseMessage message = messageQueue.poll(1, TimeUnit.SECONDS);
                if (message != null) {
                    processMessage(message);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                logger.error("处理消息时发生错误", e);
            }
        }
        
        logger.info("消息处理器停止");
    }
    
    /**
     * 处理单个消息
     */
    private void processMessage(SseMessage message) {
        try {
            // 1. 应用过滤器
            if (!applyFilters(message)) {
                logger.debug("消息被过滤器拒绝: {}", message);
                return;
            }
            
            // 2. 应用转换器
            SseMessage transformedMessage = applyTransformers(message);
            
            // 3. 路由到处理器
            routeToHandlers(transformedMessage);
            
        } catch (Exception e) {
            logger.error("处理消息失败: {}", message, e);
        }
    }
    
    /**
     * 应用过滤器
     */
    private boolean applyFilters(SseMessage message) {
        for (MessageFilter filter : filters.values()) {
            try {
                if (!filter.accept(message)) {
                    return false;
                }
            } catch (Exception e) {
                logger.error("过滤器执行失败", e);
                return false;
            }
        }
        return true;
    }
    
    /**
     * 应用转换器
     */
    private SseMessage applyTransformers(SseMessage message) throws Exception {
        SseMessage result = message;
        for (MessageTransformer transformer : transformers.values()) {
            result = transformer.transform(result);
            if (result == null) {
                throw new IllegalStateException("转换器返回了null消息");
            }
        }
        return result;
    }
    
    /**
     * 路由到处理器
     */
    private void routeToHandlers(SseMessage message) {
        String eventType = message.getEvent();
        
        // 精确匹配
        MessageHandler exactHandler = handlers.get(eventType);
        if (exactHandler != null) {
            executeHandler(exactHandler, message, eventType);
        }
        
        // 通配符匹配
        MessageHandler wildcardHandler = handlers.get("*");
        if (wildcardHandler != null) {
            executeHandler(wildcardHandler, message, "*");
        }
        
        // 模式匹配
        for (String pattern : handlers.keySet()) {
            if (pattern.contains("*") || pattern.contains("?")) {
                if (matchesPattern(eventType, pattern)) {
                    executeHandler(handlers.get(pattern), message, pattern);
                }
            }
        }
    }
    
    /**
     * 执行处理器
     */
    private void executeHandler(MessageHandler handler, SseMessage message, String handlerName) {
        executorService.submit(() -> {
            try {
                handler.handle(message);
                logger.debug("消息处理完成: handler={}, message={}", handlerName, message);
            } catch (Exception e) {
                logger.error("处理器执行失败: handler={}, message={}", handlerName, message, e);
            }
        });
    }
    
    /**
     * 模式匹配
     */
    private boolean matchesPattern(String text, String pattern) {
        String regex = pattern
                .replace("*", ".*")
                .replace("?", ".");
        return Pattern.matches(regex, text);
    }
    
    /**
     * 创建预定义的处理器
     */
    public void setupDefaultHandlers() {
        // 日志处理器
        registerHandler("log", message -> {
            logger.info("日志消息: {}", message.getData());
        });
        
        // 错误处理器
        registerHandler("error", message -> {
            logger.error("错误消息: {}", message.getData());
        });
        
        // 心跳处理器
        registerHandler("heartbeat", message -> {
            logger.debug("收到心跳: {}", message.getTimestamp());
        });
        
        // 通知处理器
        registerHandler("notification", message -> {
            logger.info("收到通知: {}", message.getData());
        });
    }
    
    /**
     * 创建预定义的过滤器
     */
    public void setupDefaultFilters() {
        // 时间过滤器 - 只处理最近的消息
        registerFilter("recent", message -> {
            if (message.getTimestamp() == null) {
                return true;
            }
            return message.getTimestamp().isAfter(LocalDateTime.now().minusMinutes(5));
        });
        
        // 非空数据过滤器
        registerFilter("nonEmpty", message -> {
            Object data = message.getData();
            if (data == null) {
                return false;
            }
            if (data instanceof String) {
                return !((String) data).trim().isEmpty();
            }
            return true;
        });
    }
    
    /**
     * 创建预定义的转换器
     */
    public void setupDefaultTransformers() {
        // 数据清理转换器
        registerTransformer("sanitize", message -> {
            Object data = message.getData();
            if (data instanceof String) {
                String cleanData = ((String) data).trim().replaceAll("\\s+", " ");
                message.setData(cleanData);
            }
            return message;
        });
        
        // 时间戳添加转换器
        registerTransformer("addTimestamp", message -> {
            if (message.getTimestamp() == null) {
                message.setTimestamp(LocalDateTime.now());
            }
            return message;
        });
    }
    
    /**
     * 获取处理统计信息
     */
    public ProcessingStats getStats() {
        return new ProcessingStats(
            messageQueue.size(),
            handlers.size(),
            filters.size(),
            transformers.size(),
            running
        );
    }
    
    /**
     * 处理统计信息
     */
    public static class ProcessingStats {
        private final int queueSize;
        private final int handlerCount;
        private final int filterCount;
        private final int transformerCount;
        private final boolean running;
        
        public ProcessingStats(int queueSize, int handlerCount, int filterCount, 
                             int transformerCount, boolean running) {
            this.queueSize = queueSize;
            this.handlerCount = handlerCount;
            this.filterCount = filterCount;
            this.transformerCount = transformerCount;
            this.running = running;
        }
        
        // Getters
        public int getQueueSize() { return queueSize; }
        public int getHandlerCount() { return handlerCount; }
        public int getFilterCount() { return filterCount; }
        public int getTransformerCount() { return transformerCount; }
        public boolean isRunning() { return running; }
        
        @Override
        public String toString() {
            return String.format("ProcessingStats{队列大小=%d, 处理器=%d, 过滤器=%d, 转换器=%d, 运行中=%s}",
                queueSize, handlerCount, filterCount, transformerCount, running);
        }
    }
    
    /**
     * 停止处理器
     */
    public void shutdown() {
        running = false;
        
        try {
            processingTask.get(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            logger.warn("等待处理任务完成时出错", e);
        }
        
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
        
        logger.info("消息处理器已关闭");
    }
}