package com.example.app.payment.service;

import com.example.app.payment.WeChatPayConfig;
import com.example.app.payment.WeChatPayUtils;
import com.example.app.payment.model.PaymentResult;
import com.example.app.payment.model.UnifiedOrderRequest;
import com.example.app.payment.model.UnifiedOrderResponse;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * 微信支付服务类
 * 提供扫码支付等核心功能
 */
public class WeChatPayService {
    
    private static final Logger logger = LoggerFactory.getLogger(WeChatPayService.class);
    
    private final WeChatPayConfig config;
    private final CloseableHttpClient httpClient;
    
    public WeChatPayService(WeChatPayConfig config) {
        this.config = config;
        this.httpClient = HttpClients.createDefault();
    }
    
    /**
     * 创建扫码支付订单
     * @param body 商品描述
     * @param outTradeNo 商户订单号
     * @param totalFee 支付金额（分）
     * @param spbillCreateIp 用户IP
     * @param productId 商品ID
     * @param attach 附加数据
     * @return 支付结果
     */
    public PaymentResult createNativePayOrder(String body, String outTradeNo, int totalFee, 
                                            String spbillCreateIp, String productId, String attach) {
        try {
            // 创建统一下单请求
            UnifiedOrderRequest request = new UnifiedOrderRequest();
            request.setAppid(config.getAppId());
            request.setMchId(config.getMchId());
            request.setNonceStr(WeChatPayUtils.generateNonceStr());
            request.setBody(body);
            request.setOutTradeNo(outTradeNo);
            request.setTotalFee(totalFee);
            request.setSpbillCreateIp(spbillCreateIp);
            request.setNotifyUrl(config.getNotifyUrl());
            request.setTradeType("NATIVE");
            request.setProductId(productId);
            request.setAttach(attach);
            
            // 生成签名
            Map<String, String> params = request.toMap();
            String sign = WeChatPayUtils.generateMD5Sign(params, config.getApiKey());
            request.setSign(sign);
            
            logger.info("创建扫码支付订单: {}", request);
            
            // 发送请求
            UnifiedOrderResponse response = sendUnifiedOrderRequest(request);
            
            if (response == null) {
                return PaymentResult.failure("网络请求失败");
            }
            
            if (!response.isSuccess()) {
                return PaymentResult.failure(response.getErrCode(), response.getErrorMessage());
            }
            
            // 验证签名
            Map<String, String> responseParams = response.toMap();
            if (!WeChatPayUtils.verifyMD5Sign(responseParams, config.getApiKey(), response.getSign())) {
                logger.warn("响应签名验证失败");
                return PaymentResult.failure("签名验证失败");
            }
            
            return PaymentResult.success(response.getCodeUrl(), outTradeNo, totalFee);
            
        } catch (Exception e) {
            logger.error("创建扫码支付订单失败", e);
            return PaymentResult.failure("创建支付订单失败: " + e.getMessage());
        }
    }
    
    /**
     * 创建扫码支付订单（简化版本）
     * @param body 商品描述
     * @param totalFee 支付金额（分）
     * @param productId 商品ID
     * @return 支付结果
     */
    public PaymentResult createNativePayOrder(String body, int totalFee, String productId) {
        String outTradeNo = WeChatPayUtils.generateOutTradeNo();
        String spbillCreateIp = "127.0.0.1"; // 默认IP，实际使用时应该获取真实IP
        return createNativePayOrder(body, outTradeNo, totalFee, spbillCreateIp, productId, null);
    }
    
    /**
     * 发送统一下单请求
     * @param request 请求参数
     * @return 响应结果
     */
    private UnifiedOrderResponse sendUnifiedOrderRequest(UnifiedOrderRequest request) {
        try {
            // 构建XML请求体
            Map<String, String> params = request.toMap();
            String xmlRequest = WeChatPayUtils.mapToXml(params);
            
            logger.debug("发送微信支付请求: {}", xmlRequest);
            
            // 创建HTTP请求
            HttpPost httpPost = new HttpPost(WeChatPayConfig.UNIFIED_ORDER_URL);
            httpPost.setHeader("Content-Type", "application/xml; charset=UTF-8");
            httpPost.setEntity(new StringEntity(xmlRequest, ContentType.APPLICATION_XML.withCharset(StandardCharsets.UTF_8)));
            
            // 发送请求
            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                int statusCode = response.getCode();
                if (statusCode != 200) {
                    logger.error("微信支付API请求失败，状态码: {}", statusCode);
                    return null;
                }
                
                // 读取响应
                String responseBody = new String(response.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8);
                logger.debug("微信支付响应: {}", responseBody);
                
                // 解析响应
                Map<String, String> responseParams = WeChatPayUtils.xmlToMap(responseBody);
                return UnifiedOrderResponse.fromMap(responseParams);
            }
            
        } catch (IOException e) {
            logger.error("发送微信支付请求失败", e);
            return null;
        }
    }
    
    /**
     * 查询订单状态
     * @param outTradeNo 商户订单号
     * @return 订单状态
     */
    public String queryOrderStatus(String outTradeNo) {
        try {
            // 构建查询参数
            Map<String, String> params = new java.util.HashMap<>();
            params.put("appid", config.getAppId());
            params.put("mch_id", config.getMchId());
            params.put("out_trade_no", outTradeNo);
            params.put("nonce_str", WeChatPayUtils.generateNonceStr());
            
            // 生成签名
            String sign = WeChatPayUtils.generateMD5Sign(params, config.getApiKey());
            params.put("sign", sign);
            
            // 发送查询请求
            String xmlRequest = WeChatPayUtils.mapToXml(params);
            HttpPost httpPost = new HttpPost(WeChatPayConfig.ORDER_QUERY_URL);
            httpPost.setHeader("Content-Type", "application/xml; charset=UTF-8");
            httpPost.setEntity(new StringEntity(xmlRequest, ContentType.APPLICATION_XML.withCharset(StandardCharsets.UTF_8)));
            
            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                if (response.getCode() == 200) {
                    String responseBody = new String(response.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8);
                    Map<String, String> responseParams = WeChatPayUtils.xmlToMap(responseBody);
                    
                    if ("SUCCESS".equals(responseParams.get("return_code")) && 
                        "SUCCESS".equals(responseParams.get("result_code"))) {
                        return responseParams.get("trade_state");
                    }
                }
            }
            
        } catch (Exception e) {
            logger.error("查询订单状态失败", e);
        }
        
        return "UNKNOWN";
    }
    
    /**
     * 关闭资源
     */
    public void close() {
        try {
            if (httpClient != null) {
                httpClient.close();
            }
        } catch (IOException e) {
            logger.error("关闭HTTP客户端失败", e);
        }
    }
}