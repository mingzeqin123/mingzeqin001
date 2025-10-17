package com.example.app;

import com.example.app.payment.WeChatPayConfig;
import com.example.app.payment.WeChatPayUtils;
import com.example.app.payment.model.PaymentResult;
import com.example.app.payment.service.WeChatPayService;
import com.example.app.payment.controller.PaymentController;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

/**
 * 微信支付功能测试类
 */
public class WeChatPayTest {
    
    public static void main(String[] args) {
        System.out.println("=== 微信支付功能测试 ===");
        
        // 测试工具类
        testWeChatPayUtils();
        
        // 测试支付服务
        testWeChatPayService();
        
        // 测试支付控制器
        testPaymentController();
        
        System.out.println("=== 测试完成 ===");
    }
    
    /**
     * 测试微信支付工具类
     */
    private static void testWeChatPayUtils() {
        System.out.println("\n--- 测试微信支付工具类 ---");
        
        // 测试生成随机字符串
        String nonceStr = WeChatPayUtils.generateNonceStr();
        System.out.println("生成随机字符串: " + nonceStr);
        
        // 测试生成时间戳
        String timestamp = WeChatPayUtils.generateTimestamp();
        System.out.println("生成时间戳: " + timestamp);
        
        // 测试生成商户订单号
        String outTradeNo = WeChatPayUtils.generateOutTradeNo();
        System.out.println("生成商户订单号: " + outTradeNo);
        
        // 测试金额转换
        int totalFee = WeChatPayUtils.yuanToFen(0.01);
        System.out.println("金额转换(0.01元 -> " + totalFee + "分)");
        
        double yuan = WeChatPayUtils.fenToYuan(100);
        System.out.println("金额转换(100分 -> " + yuan + "元)");
        
        // 测试参数排序
        Map<String, String> params = new HashMap<>();
        params.put("appid", "wx1234567890");
        params.put("mch_id", "1234567890");
        params.put("nonce_str", "abc123");
        params.put("body", "测试商品");
        
        String sortedParams = WeChatPayUtils.sortAndConcatParams(params);
        System.out.println("参数排序结果: " + sortedParams);
        
        // 测试签名生成
        String apiKey = "test_api_key_1234567890";
        String sign = WeChatPayUtils.generateMD5Sign(params, apiKey);
        System.out.println("生成的签名: " + sign);
        
        // 测试签名验证
        boolean isValid = WeChatPayUtils.verifyMD5Sign(params, apiKey, sign);
        System.out.println("签名验证结果: " + isValid);
        
        System.out.println("工具类测试完成 ✓");
    }
    
    /**
     * 测试微信支付服务
     */
    private static void testWeChatPayService() {
        System.out.println("\n--- 测试微信支付服务 ---");
        
        // 创建配置
        WeChatPayConfig config = new WeChatPayConfig();
        config.setAppId("wx1234567890abcdef");
        config.setMchId("1234567890");
        config.setApiKey("test_api_key_1234567890");
        config.setNotifyUrl("http://test.example.com/notify");
        
        System.out.println("支付配置: " + config);
        
        // 创建服务
        WeChatPayService payService = new WeChatPayService(config);
        
        // 测试创建支付订单（这里会失败，因为没有真实的微信支付环境）
        try {
            PaymentResult result = payService.createNativePayOrder("测试商品", 1, "test_001");
            System.out.println("创建支付订单结果: " + result);
        } catch (Exception e) {
            System.out.println("创建支付订单失败（预期）: " + e.getMessage());
        }
        
        // 测试查询订单状态
        try {
            String tradeState = payService.queryOrderStatus("test_order_123");
            System.out.println("查询订单状态: " + tradeState);
        } catch (Exception e) {
            System.out.println("查询订单状态失败（预期）: " + e.getMessage());
        }
        
        // 关闭服务
        payService.close();
        
        System.out.println("支付服务测试完成 ✓");
    }
    
    /**
     * 测试支付控制器
     */
    private static void testPaymentController() {
        System.out.println("\n--- 测试支付控制器 ---");
        
        // 创建配置
        WeChatPayConfig config = new WeChatPayConfig();
        config.setAppId("wx1234567890abcdef");
        config.setMchId("1234567890");
        config.setApiKey("test_api_key_1234567890");
        config.setNotifyUrl("http://test.example.com/notify");
        
        // 创建控制器
        PaymentController controller = new PaymentController(config);
        
        // 测试创建支付订单
        Map<String, Object> requestData = new HashMap<>();
        requestData.put("body", "测试商品");
        requestData.put("totalFee", 1); // 1分
        requestData.put("productId", "test_001");
        requestData.put("attach", "测试订单");
        
        try {
            String response = controller.createNativePayOrder(requestData);
            System.out.println("创建支付订单响应: " + response);
            
            // 解析响应
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> result = mapper.readValue(response, Map.class);
            System.out.println("解析后的结果: " + result);
            
        } catch (Exception e) {
            System.out.println("创建支付订单失败（预期）: " + e.getMessage());
        }
        
        // 测试查询订单状态
        try {
            String response = controller.queryOrderStatus("test_order_123");
            System.out.println("查询订单状态响应: " + response);
        } catch (Exception e) {
            System.out.println("查询订单状态失败（预期）: " + e.getMessage());
        }
        
        // 关闭控制器
        controller.close();
        
        System.out.println("支付控制器测试完成 ✓");
    }
}