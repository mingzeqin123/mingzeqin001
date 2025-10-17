package com.example.app.payment;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.lang3.StringUtils;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

/**
 * 微信支付工具类
 * 提供签名、加密、参数处理等核心功能
 */
public class WeChatPayUtils {
    
    /**
     * 生成随机字符串
     * @param length 字符串长度
     * @return 随机字符串
     */
    public static String generateNonceStr(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
    
    /**
     * 生成32位随机字符串
     * @return 32位随机字符串
     */
    public static String generateNonceStr() {
        return generateNonceStr(32);
    }
    
    /**
     * 生成时间戳
     * @return 当前时间戳（秒）
     */
    public static String generateTimestamp() {
        return String.valueOf(System.currentTimeMillis() / 1000);
    }
    
    /**
     * 生成商户订单号
     * @param prefix 前缀
     * @return 商户订单号
     */
    public static String generateOutTradeNo(String prefix) {
        if (StringUtils.isBlank(prefix)) {
            prefix = "WX";
        }
        return prefix + System.currentTimeMillis() + generateNonceStr(6);
    }
    
    /**
     * 生成商户订单号
     * @return 商户订单号
     */
    public static String generateOutTradeNo() {
        return generateOutTradeNo("WX");
    }
    
    /**
     * 参数排序并拼接
     * @param params 参数Map
     * @return 排序后的参数字符串
     */
    public static String sortAndConcatParams(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return "";
        }
        
        // 过滤空值并排序
        TreeMap<String, String> sortedParams = new TreeMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (StringUtils.isNotBlank(entry.getValue()) && !"sign".equals(entry.getKey())) {
                sortedParams.put(entry.getKey(), entry.getValue());
            }
        }
        
        // 拼接参数
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            sb.append(entry.getKey()).append("=").append(entry.getValue()).append("&");
        }
        
        return sb.length() > 0 ? sb.substring(0, sb.length() - 1) : "";
    }
    
    /**
     * 生成MD5签名
     * @param params 参数Map
     * @param apiKey API密钥
     * @return MD5签名
     */
    public static String generateMD5Sign(Map<String, String> params, String apiKey) {
        String paramStr = sortAndConcatParams(params);
        paramStr += "&key=" + apiKey;
        return DigestUtils.md5Hex(paramStr).toUpperCase();
    }
    
    /**
     * 验证MD5签名
     * @param params 参数Map
     * @param apiKey API密钥
     * @param sign 待验证的签名
     * @return 验证结果
     */
    public static boolean verifyMD5Sign(Map<String, String> params, String apiKey, String sign) {
        if (StringUtils.isBlank(sign)) {
            return false;
        }
        String expectedSign = generateMD5Sign(params, apiKey);
        return sign.equals(expectedSign);
    }
    
    /**
     * 将Map转换为XML字符串
     * @param params 参数Map
     * @return XML字符串
     */
    public static String mapToXml(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return "<xml></xml>";
        }
        
        StringBuilder xml = new StringBuilder();
        xml.append("<xml>");
        for (Map.Entry<String, String> entry : params.entrySet()) {
            xml.append("<").append(entry.getKey()).append(">")
               .append("<![CDATA[").append(entry.getValue()).append("]]>")
               .append("</").append(entry.getKey()).append(">");
        }
        xml.append("</xml>");
        return xml.toString();
    }
    
    /**
     * 将XML字符串转换为Map
     * @param xml XML字符串
     * @return 参数Map
     */
    public static Map<String, String> xmlToMap(String xml) {
        Map<String, String> result = new HashMap<>();
        if (StringUtils.isBlank(xml)) {
            return result;
        }
        
        // 简单的XML解析，实际项目中建议使用专业的XML解析库
        xml = xml.replaceAll("<!\\[CDATA\\[|\\]\\]>", "");
        String[] pairs = xml.replaceAll("<xml>|</xml>", "").split("><");
        
        for (String pair : pairs) {
            if (StringUtils.isNotBlank(pair)) {
                String[] keyValue = pair.split(">");
                if (keyValue.length == 2) {
                    String key = keyValue[0].replaceAll("<", "");
                    String value = keyValue[1].replaceAll("</", "");
                    result.put(key, value);
                }
            }
        }
        
        return result;
    }
    
    /**
     * URL编码
     * @param str 待编码字符串
     * @return 编码后的字符串
     */
    public static String urlEncode(String str) {
        try {
            return URLEncoder.encode(str, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            return str;
        }
    }
    
    /**
     * 验证参数是否为空
     * @param params 参数Map
     * @param requiredFields 必填字段
     * @return 验证结果
     */
    public static boolean validateRequiredFields(Map<String, String> params, String... requiredFields) {
        if (params == null || requiredFields == null) {
            return false;
        }
        
        for (String field : requiredFields) {
            if (StringUtils.isBlank(params.get(field))) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 金额转换（元转分）
     * @param amount 金额（元）
     * @return 金额（分）
     */
    public static int yuanToFen(double amount) {
        return (int) Math.round(amount * 100);
    }
    
    /**
     * 金额转换（分转元）
     * @param amount 金额（分）
     * @return 金额（元）
     */
    public static double fenToYuan(int amount) {
        return amount / 100.0;
    }
    
    /**
     * 格式化金额为分
     * @param amount 金额（元）
     * @return 格式化的金额字符串
     */
    public static String formatAmount(double amount) {
        return String.valueOf(yuanToFen(amount));
    }
}