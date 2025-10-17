package com.example.app.payment.controller;

import com.example.app.payment.WeChatPayConfig;
import com.example.app.payment.model.PaymentResult;
import com.example.app.payment.service.WeChatPayService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * 支付控制器
 * 提供支付相关的API接口
 */
public class PaymentController {
    
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    
    private final WeChatPayService payService;
    private final ObjectMapper objectMapper;
    
    public PaymentController(WeChatPayConfig config) {
        this.payService = new WeChatPayService(config);
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * 创建扫码支付订单
     * @param requestData 请求数据
     * @return JSON响应
     */
    public String createNativePayOrder(Map<String, Object> requestData) {
        try {
            // 提取参数
            String body = (String) requestData.get("body");
            Integer totalFee = (Integer) requestData.get("totalFee");
            String productId = (String) requestData.get("productId");
            String attach = (String) requestData.get("attach");
            
            // 参数验证
            if (body == null || body.trim().isEmpty()) {
                return createErrorResponse("商品描述不能为空");
            }
            if (totalFee == null || totalFee <= 0) {
                return createErrorResponse("支付金额必须大于0");
            }
            if (productId == null || productId.trim().isEmpty()) {
                return createErrorResponse("商品ID不能为空");
            }
            
            // 创建支付订单
            PaymentResult result = payService.createNativePayOrder(body, totalFee, productId);
            
            // 构建响应
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("message", result.getMessage());
            
            if (result.isSuccess()) {
                response.put("codeUrl", result.getCodeUrl());
                response.put("outTradeNo", result.getOutTradeNo());
                response.put("totalFee", result.getTotalFee());
                response.put("tradeType", "NATIVE");
            } else {
                response.put("errorCode", result.getErrorCode());
                response.put("errorMessage", result.getErrorMessage());
            }
            
            return objectMapper.writeValueAsString(response);
            
        } catch (Exception e) {
            logger.error("创建扫码支付订单失败", e);
            return createErrorResponse("系统错误: " + e.getMessage());
        }
    }
    
    /**
     * 查询订单状态
     * @param outTradeNo 商户订单号
     * @return JSON响应
     */
    public String queryOrderStatus(String outTradeNo) {
        try {
            if (outTradeNo == null || outTradeNo.trim().isEmpty()) {
                return createErrorResponse("商户订单号不能为空");
            }
            
            String tradeState = payService.queryOrderStatus(outTradeNo);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("outTradeNo", outTradeNo);
            response.put("tradeState", tradeState);
            
            // 根据交易状态设置描述
            String stateDesc = getTradeStateDescription(tradeState);
            response.put("stateDescription", stateDesc);
            
            return objectMapper.writeValueAsString(response);
            
        } catch (Exception e) {
            logger.error("查询订单状态失败", e);
            return createErrorResponse("查询失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取交易状态描述
     * @param tradeState 交易状态
     * @return 状态描述
     */
    private String getTradeStateDescription(String tradeState) {
        switch (tradeState) {
            case "SUCCESS":
                return "支付成功";
            case "REFUND":
                return "转入退款";
            case "NOTPAY":
                return "未支付";
            case "CLOSED":
                return "已关闭";
            case "REVOKED":
                return "已撤销";
            case "USERPAYING":
                return "用户支付中";
            case "PAYERROR":
                return "支付失败";
            default:
                return "未知状态";
        }
    }
    
    /**
     * 创建错误响应
     * @param message 错误消息
     * @return JSON错误响应
     */
    private String createErrorResponse(String message) {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", message);
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return "{\"success\":false,\"message\":\"系统错误\"}";
        }
    }
    
    /**
     * 关闭资源
     */
    public void close() {
        if (payService != null) {
            payService.close();
        }
    }
}