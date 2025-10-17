package com.example.app.service;

import com.example.app.config.WeChatPayConfig;
import com.example.app.model.PaymentResponse;
import com.example.app.util.WeChatPayUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 微信支付服务类（简化版）
 * 提供微信扫码支付的核心功能演示
 */
public class WeChatPayServiceSimple {
    
    private static final Logger logger = LoggerFactory.getLogger(WeChatPayServiceSimple.class);
    
    private final WeChatPayConfig config;
    private final ObjectMapper objectMapper;
    
    public WeChatPayServiceSimple(WeChatPayConfig config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
        logger.info("微信支付服务初始化成功（演示模式）");
    }
    
    /**
     * 创建扫码支付订单（演示版）
     * @param description 商品描述
     * @param totalAmount 支付金额（分）
     * @param outTradeNo 商户订单号
     * @return 支付响应
     */
    public PaymentResponse createNativePayment(String description, int totalAmount, String outTradeNo) {
        try {
            logger.info("创建扫码支付订单: outTradeNo={}, amount={}, description={}", 
                       outTradeNo, totalAmount, description);
            
            // 模拟创建支付订单
            PaymentResponse response = new PaymentResponse();
            
            // 生成模拟的二维码链接
            String mockCodeUrl = "weixin://wxpay/bizpayurl?pr=" + generateMockPayCode(outTradeNo);
            response.setCodeUrl(mockCodeUrl);
            response.setOutTradeNo(outTradeNo);
            
            logger.info("扫码支付订单创建成功（演示）: codeUrl={}", mockCodeUrl);
            
            return response;
            
        } catch (Exception e) {
            logger.error("创建扫码支付订单失败", e);
            
            PaymentResponse errorResponse = new PaymentResponse();
            errorResponse.setCode("SYSTEM_ERROR");
            errorResponse.setMessage("创建支付订单失败: " + e.getMessage());
            
            return errorResponse;
        }
    }
    
    /**
     * 查询订单状态（演示版）
     * @param outTradeNo 商户订单号
     * @return 支付响应
     */
    public PaymentResponse queryPayment(String outTradeNo) {
        try {
            logger.info("查询订单状态: outTradeNo={}", outTradeNo);
            
            // 模拟查询结果
            PaymentResponse response = new PaymentResponse();
            response.setOutTradeNo(outTradeNo);
            response.setTransactionId("4200001234567890123456789");
            response.setTradeState("NOTPAY"); // 模拟未支付状态
            response.setTradeStateDesc("用户还未支付");
            
            // 设置金额信息
            PaymentResponse.Amount amount = new PaymentResponse.Amount();
            amount.setTotal(100); // 1元
            amount.setCurrency("CNY");
            response.setAmount(amount);
            
            logger.info("订单查询成功（演示）: tradeState={}", response.getTradeState());
            
            return response;
            
        } catch (Exception e) {
            logger.error("查询订单状态失败", e);
            
            PaymentResponse errorResponse = new PaymentResponse();
            errorResponse.setCode("SYSTEM_ERROR");
            errorResponse.setMessage("查询订单失败: " + e.getMessage());
            
            return errorResponse;
        }
    }
    
    /**
     * 关闭订单（演示版）
     * @param outTradeNo 商户订单号
     * @return 是否成功
     */
    public boolean closePayment(String outTradeNo) {
        try {
            logger.info("关闭订单: outTradeNo={}", outTradeNo);
            
            // 模拟关闭订单
            logger.info("订单关闭成功（演示）: outTradeNo={}", outTradeNo);
            return true;
            
        } catch (Exception e) {
            logger.error("关闭订单失败", e);
            return false;
        }
    }
    
    /**
     * 生成支付二维码
     * @param codeUrl 二维码链接
     * @param width 宽度
     * @param height 高度
     * @return 二维码图片字节数组
     */
    public byte[] generateQRCode(String codeUrl, int width, int height) {
        try {
            return WeChatPayUtil.generateQRCodeBytes(codeUrl, width, height, "PNG");
        } catch (Exception e) {
            logger.error("生成二维码失败", e);
            throw new RuntimeException("生成二维码失败", e);
        }
    }
    
    /**
     * 验证支付通知签名（演示版）
     * @param signature 签名
     * @param timestamp 时间戳
     * @param nonce 随机字符串
     * @param body 请求体
     * @return 验证结果
     */
    public boolean verifyNotification(String signature, String timestamp, String nonce, String body) {
        try {
            logger.info("验证支付通知签名（演示）: timestamp={}, nonce={}", timestamp, nonce);
            // 演示模式总是返回true
            return true;
            
        } catch (Exception e) {
            logger.error("验证支付通知签名失败", e);
            return false;
        }
    }
    
    /**
     * 处理支付通知（演示版）
     * @param notificationBody 通知内容
     * @return 处理结果
     */
    public String handlePaymentNotification(String notificationBody) {
        try {
            logger.info("处理支付通知（演示）: {}", notificationBody);
            
            // 返回成功响应
            return "{\"code\":\"SUCCESS\",\"message\":\"成功\"}";
            
        } catch (Exception e) {
            logger.error("处理支付通知失败", e);
            return "{\"code\":\"FAIL\",\"message\":\"失败\"}";
        }
    }
    
    /**
     * 生成模拟支付码
     * @param outTradeNo 订单号
     * @return 支付码
     */
    private String generateMockPayCode(String outTradeNo) {
        return WeChatPayUtil.md5(outTradeNo + System.currentTimeMillis()).substring(0, 16);
    }
    
    /**
     * 获取配置信息
     * @return 配置对象
     */
    public WeChatPayConfig getConfig() {
        return config;
    }
    
    /**
     * 检查服务是否可用
     * @return 是否可用
     */
    public boolean isServiceAvailable() {
        return config != null && config.isValid();
    }
}