package com.example.app.controller;

import com.example.app.config.WeChatPayConfig;
import com.example.app.model.PaymentResponse;
import com.example.app.service.WeChatPayServiceSimple;
import com.example.app.util.WeChatPayUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.awt.image.BufferedImage;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 支付控制器
 * 处理支付相关的业务逻辑
 */
public class PaymentController {
    
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    
    private final WeChatPayServiceSimple weChatPayService;
    private final ObjectMapper objectMapper;
    private final ScheduledExecutorService scheduler;
    
    // 支付状态回调接口
    public interface PaymentStatusCallback {
        void onPaymentSuccess(PaymentResponse response);
        void onPaymentFailed(PaymentResponse response);
        void onPaymentTimeout();
        void onError(String errorMessage);
    }
    
    public PaymentController() {
        // 使用默认配置初始化
        WeChatPayConfig config = new WeChatPayConfig();
        this.weChatPayService = new WeChatPayServiceSimple(config);
        this.objectMapper = new ObjectMapper();
        this.scheduler = Executors.newScheduledThreadPool(2);
    }
    
    public PaymentController(WeChatPayConfig config) {
        this.weChatPayService = new WeChatPayServiceSimple(config);
        this.objectMapper = new ObjectMapper();
        this.scheduler = Executors.newScheduledThreadPool(2);
    }
    
    /**
     * 创建扫码支付订单
     * @param description 商品描述
     * @param amount 支付金额（元）
     * @param callback 支付状态回调
     * @return 支付响应
     */
    public PaymentResponse createPayment(String description, double amount, PaymentStatusCallback callback) {
        try {
            logger.info("创建支付订单: description={}, amount={}", description, amount);
            
            // 验证参数
            if (WeChatPayUtil.isEmpty(description)) {
                throw new IllegalArgumentException("商品描述不能为空");
            }
            if (amount <= 0) {
                throw new IllegalArgumentException("支付金额必须大于0");
            }
            
            // 生成订单号
            String outTradeNo = WeChatPayUtil.generateOutTradeNo("PAY");
            
            // 转换金额（元转分）
            int totalAmount = WeChatPayUtil.formatAmount(amount);
            
            // 创建支付订单
            PaymentResponse response = weChatPayService.createNativePayment(description, totalAmount, outTradeNo);
            
            if (response.isSuccess()) {
                // 启动支付状态监控
                startPaymentMonitoring(outTradeNo, callback);
                logger.info("支付订单创建成功: outTradeNo={}, codeUrl={}", outTradeNo, response.getCodeUrl());
            } else {
                logger.error("支付订单创建失败: code={}, message={}", response.getCode(), response.getMessage());
            }
            
            return response;
            
        } catch (Exception e) {
            logger.error("创建支付订单异常", e);
            
            PaymentResponse errorResponse = new PaymentResponse();
            errorResponse.setCode("SYSTEM_ERROR");
            errorResponse.setMessage("创建支付订单失败: " + e.getMessage());
            
            if (callback != null) {
                callback.onError(e.getMessage());
            }
            
            return errorResponse;
        }
    }
    
    /**
     * 查询支付状态
     * @param outTradeNo 商户订单号
     * @return 支付响应
     */
    public PaymentResponse queryPaymentStatus(String outTradeNo) {
        try {
            logger.info("查询支付状态: outTradeNo={}", outTradeNo);
            
            if (WeChatPayUtil.isEmpty(outTradeNo)) {
                throw new IllegalArgumentException("订单号不能为空");
            }
            
            return weChatPayService.queryPayment(outTradeNo);
            
        } catch (Exception e) {
            logger.error("查询支付状态异常", e);
            
            PaymentResponse errorResponse = new PaymentResponse();
            errorResponse.setCode("SYSTEM_ERROR");
            errorResponse.setMessage("查询支付状态失败: " + e.getMessage());
            
            return errorResponse;
        }
    }
    
    /**
     * 取消支付订单
     * @param outTradeNo 商户订单号
     * @return 是否成功
     */
    public boolean cancelPayment(String outTradeNo) {
        try {
            logger.info("取消支付订单: outTradeNo={}", outTradeNo);
            
            if (WeChatPayUtil.isEmpty(outTradeNo)) {
                throw new IllegalArgumentException("订单号不能为空");
            }
            
            return weChatPayService.closePayment(outTradeNo);
            
        } catch (Exception e) {
            logger.error("取消支付订单异常", e);
            return false;
        }
    }
    
    /**
     * 生成支付二维码图片
     * @param codeUrl 二维码链接
     * @param size 二维码尺寸
     * @return 二维码图片
     */
    public BufferedImage generatePaymentQRCode(String codeUrl, int size) {
        try {
            logger.info("生成支付二维码: codeUrl={}, size={}", codeUrl, size);
            
            if (WeChatPayUtil.isEmpty(codeUrl)) {
                throw new IllegalArgumentException("二维码链接不能为空");
            }
            
            return WeChatPayUtil.generateQRCode(codeUrl, size, size);
            
        } catch (Exception e) {
            logger.error("生成支付二维码异常", e);
            throw new RuntimeException("生成支付二维码失败", e);
        }
    }
    
    /**
     * 生成支付二维码字节数组
     * @param codeUrl 二维码链接
     * @param size 二维码尺寸
     * @return 二维码图片字节数组
     */
    public byte[] generatePaymentQRCodeBytes(String codeUrl, int size) {
        try {
            return weChatPayService.generateQRCode(codeUrl, size, size);
        } catch (Exception e) {
            logger.error("生成支付二维码字节数组异常", e);
            throw new RuntimeException("生成支付二维码失败", e);
        }
    }
    
    /**
     * 启动支付状态监控
     * @param outTradeNo 商户订单号
     * @param callback 回调接口
     */
    private void startPaymentMonitoring(String outTradeNo, PaymentStatusCallback callback) {
        if (callback == null) {
            return;
        }
        
        CompletableFuture.runAsync(() -> {
            int maxRetries = 60; // 最多查询60次，每次间隔5秒，总计5分钟
            int retryCount = 0;
            
            while (retryCount < maxRetries) {
                try {
                    // 等待5秒后查询
                    Thread.sleep(5000);
                    
                    PaymentResponse response = queryPaymentStatus(outTradeNo);
                    
                    if (response.isPaid()) {
                        // 支付成功
                        logger.info("支付成功: outTradeNo={}", outTradeNo);
                        callback.onPaymentSuccess(response);
                        return;
                    } else if ("CLOSED".equals(response.getTradeState()) || 
                              "REVOKED".equals(response.getTradeState()) ||
                              "PAYERROR".equals(response.getTradeState())) {
                        // 支付失败
                        logger.info("支付失败: outTradeNo={}, tradeState={}", outTradeNo, response.getTradeState());
                        callback.onPaymentFailed(response);
                        return;
                    }
                    
                    retryCount++;
                    
                } catch (Exception e) {
                    logger.error("支付状态监控异常: outTradeNo={}", outTradeNo, e);
                    retryCount++;
                }
            }
            
            // 超时未支付
            logger.info("支付超时: outTradeNo={}", outTradeNo);
            callback.onPaymentTimeout();
            
            // 尝试关闭订单
            try {
                cancelPayment(outTradeNo);
            } catch (Exception e) {
                logger.error("关闭超时订单失败: outTradeNo={}", outTradeNo, e);
            }
            
        }, scheduler);
    }
    
    /**
     * 处理支付通知
     * @param notificationBody 通知内容
     * @param signature 签名
     * @param timestamp 时间戳
     * @param nonce 随机字符串
     * @return 处理结果
     */
    public String handlePaymentNotification(String notificationBody, String signature, String timestamp, String nonce) {
        try {
            logger.info("处理支付通知: timestamp={}, nonce={}", timestamp, nonce);
            
            // 验证签名
            if (!weChatPayService.verifyNotification(signature, timestamp, nonce, notificationBody)) {
                logger.error("支付通知签名验证失败");
                return "{\"code\":\"FAIL\",\"message\":\"签名验证失败\"}";
            }
            
            // 处理通知
            return weChatPayService.handlePaymentNotification(notificationBody);
            
        } catch (Exception e) {
            logger.error("处理支付通知异常", e);
            return "{\"code\":\"FAIL\",\"message\":\"处理失败\"}";
        }
    }
    
    /**
     * 检查服务是否可用
     * @return 是否可用
     */
    public boolean isServiceAvailable() {
        return weChatPayService.isServiceAvailable();
    }
    
    /**
     * 获取配置信息
     * @return 配置对象
     */
    public WeChatPayConfig getConfig() {
        return weChatPayService.getConfig();
    }
    
    /**
     * 关闭控制器，释放资源
     */
    public void shutdown() {
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                scheduler.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }
}