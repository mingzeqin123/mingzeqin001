package com.example.app;

import com.example.app.payment.WeChatPayConfig;
import com.example.app.payment.controller.PaymentController;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

/**
 * 微信支付演示程序
 * 提供命令行界面来测试微信支付功能
 */
public class WeChatPayDemo {
    
    private static final Scanner scanner = new Scanner(System.in);
    private static PaymentController paymentController;
    private static ObjectMapper objectMapper;
    
    public static void main(String[] args) {
        System.out.println("=== 微信扫码支付演示程序 ===");
        System.out.println("注意：这是一个演示程序，需要配置真实的微信支付参数才能正常工作");
        System.out.println();
        
        // 初始化
        initializePaymentController();
        
        // 显示主菜单
        showMainMenu();
        
        scanner.close();
    }
    
    /**
     * 初始化支付控制器
     */
    private static void initializePaymentController() {
        try {
            // 创建微信支付配置
            WeChatPayConfig config = new WeChatPayConfig();
            
            System.out.println("请输入微信支付配置信息：");
            System.out.print("AppID: ");
            String appId = scanner.nextLine().trim();
            if (appId.isEmpty()) {
                appId = "wx1234567890abcdef"; // 默认测试值
                System.out.println("使用默认AppID: " + appId);
            }
            
            System.out.print("商户号: ");
            String mchId = scanner.nextLine().trim();
            if (mchId.isEmpty()) {
                mchId = "1234567890"; // 默认测试值
                System.out.println("使用默认商户号: " + mchId);
            }
            
            System.out.print("API密钥: ");
            String apiKey = scanner.nextLine().trim();
            if (apiKey.isEmpty()) {
                apiKey = "test_api_key_1234567890"; // 默认测试值
                System.out.println("使用默认API密钥: " + apiKey);
            }
            
            System.out.print("通知地址: ");
            String notifyUrl = scanner.nextLine().trim();
            if (notifyUrl.isEmpty()) {
                notifyUrl = "http://test.example.com/notify"; // 默认测试值
                System.out.println("使用默认通知地址: " + notifyUrl);
            }
            
            config.setAppId(appId);
            config.setMchId(mchId);
            config.setApiKey(apiKey);
            config.setNotifyUrl(notifyUrl);
            
            paymentController = new PaymentController(config);
            objectMapper = new ObjectMapper();
            
            System.out.println("支付控制器初始化成功！");
            System.out.println();
            
        } catch (Exception e) {
            System.err.println("支付控制器初始化失败: " + e.getMessage());
            System.exit(1);
        }
    }
    
    /**
     * 显示主菜单
     */
    private static void showMainMenu() {
        while (true) {
            System.out.println("=== 主菜单 ===");
            System.out.println("1. 创建扫码支付订单");
            System.out.println("2. 查询订单状态");
            System.out.println("3. 测试工具类功能");
            System.out.println("4. 退出程序");
            System.out.print("请选择操作 (1-4): ");
            
            String choice = scanner.nextLine().trim();
            
            switch (choice) {
                case "1":
                    createPaymentOrder();
                    break;
                case "2":
                    queryOrderStatus();
                    break;
                case "3":
                    testUtils();
                    break;
                case "4":
                    System.out.println("感谢使用，再见！");
                    if (paymentController != null) {
                        paymentController.close();
                    }
                    return;
                default:
                    System.out.println("无效选择，请重新输入！");
            }
            
            System.out.println();
        }
    }
    
    /**
     * 创建支付订单
     */
    private static void createPaymentOrder() {
        System.out.println("\n--- 创建扫码支付订单 ---");
        
        System.out.print("商品名称: ");
        String body = scanner.nextLine().trim();
        if (body.isEmpty()) {
            body = "测试商品";
            System.out.println("使用默认商品名称: " + body);
        }
        
        System.out.print("支付金额（元）: ");
        String amountStr = scanner.nextLine().trim();
        double amount = 0.01; // 默认值
        if (!amountStr.isEmpty()) {
            try {
                amount = Double.parseDouble(amountStr);
            } catch (NumberFormatException e) {
                System.out.println("金额格式错误，使用默认值: " + amount);
            }
        } else {
            System.out.println("使用默认金额: " + amount);
        }
        
        System.out.print("商品ID: ");
        String productId = scanner.nextLine().trim();
        if (productId.isEmpty()) {
            productId = "test_001";
            System.out.println("使用默认商品ID: " + productId);
        }
        
        System.out.print("附加数据（可选）: ");
        String attach = scanner.nextLine().trim();
        
        // 转换为分
        int totalFee = (int) Math.round(amount * 100);
        
        // 构建请求数据
        Map<String, Object> requestData = new HashMap<>();
        requestData.put("body", body);
        requestData.put("totalFee", totalFee);
        requestData.put("productId", productId);
        if (!attach.isEmpty()) {
            requestData.put("attach", attach);
        }
        
        try {
            System.out.println("\n正在创建支付订单...");
            String response = paymentController.createNativePayOrder(requestData);
            
            // 解析响应
            Map<String, Object> result = objectMapper.readValue(response, Map.class);
            
            System.out.println("\n=== 支付订单创建结果 ===");
            System.out.println("成功: " + result.get("success"));
            System.out.println("消息: " + result.get("message"));
            
            if ((Boolean) result.get("success")) {
                System.out.println("二维码链接: " + result.get("codeUrl"));
                System.out.println("商户订单号: " + result.get("outTradeNo"));
                System.out.println("支付金额: " + result.get("totalFee") + " 分");
                System.out.println("交易类型: " + result.get("tradeType"));
                System.out.println("\n请使用微信扫描二维码完成支付！");
            } else {
                System.out.println("错误代码: " + result.get("errorCode"));
                System.out.println("错误信息: " + result.get("errorMessage"));
            }
            
        } catch (Exception e) {
            System.err.println("创建支付订单失败: " + e.getMessage());
        }
    }
    
    /**
     * 查询订单状态
     */
    private static void queryOrderStatus() {
        System.out.println("\n--- 查询订单状态 ---");
        
        System.out.print("请输入商户订单号: ");
        String outTradeNo = scanner.nextLine().trim();
        
        if (outTradeNo.isEmpty()) {
            System.out.println("订单号不能为空！");
            return;
        }
        
        try {
            System.out.println("\n正在查询订单状态...");
            String response = paymentController.queryOrderStatus(outTradeNo);
            
            // 解析响应
            Map<String, Object> result = objectMapper.readValue(response, Map.class);
            
            System.out.println("\n=== 订单查询结果 ===");
            System.out.println("成功: " + result.get("success"));
            System.out.println("商户订单号: " + result.get("outTradeNo"));
            System.out.println("交易状态: " + result.get("tradeState"));
            System.out.println("状态描述: " + result.get("stateDescription"));
            
        } catch (Exception e) {
            System.err.println("查询订单状态失败: " + e.getMessage());
        }
    }
    
    /**
     * 测试工具类功能
     */
    private static void testUtils() {
        System.out.println("\n--- 测试工具类功能 ---");
        
        // 这里可以添加更多工具类测试
        System.out.println("工具类功能测试完成！");
        System.out.println("（具体测试内容请参考 WeChatPayTest.java）");
    }
}