package com.example.app.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.List;

/**
 * 微信支付工具类
 * 提供签名、二维码生成、随机字符串生成等工具方法
 */
public class WeChatPayUtil {
    
    private static final String ALGORITHM = "HmacSHA256";
    private static final String CHARSET = "UTF-8";
    
    /**
     * 生成随机字符串
     * @param length 字符串长度
     * @return 随机字符串
     */
    public static String generateNonceStr(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return sb.toString();
    }
    
    /**
     * 生成商户订单号
     * @param prefix 前缀
     * @return 订单号
     */
    public static String generateOutTradeNo(String prefix) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        String timestamp = sdf.format(new Date());
        String random = generateNonceStr(6);
        return prefix + timestamp + random;
    }
    
    /**
     * 生成签名
     * @param params 参数Map
     * @param key API密钥
     * @return 签名字符串
     */
    public static String generateSignature(Map<String, String> params, String key) {
        try {
            // 1. 参数排序
            List<String> keys = new ArrayList<>(params.keySet());
            Collections.sort(keys);
            
            // 2. 构建签名字符串
            StringBuilder sb = new StringBuilder();
            for (String k : keys) {
                String value = params.get(k);
                if (value != null && !value.isEmpty() && !"sign".equals(k)) {
                    if (sb.length() > 0) {
                        sb.append("&");
                    }
                    sb.append(k).append("=").append(value);
                }
            }
            sb.append("&key=").append(key);
            
            // 3. MD5签名
            return md5(sb.toString()).toUpperCase();
            
        } catch (Exception e) {
            throw new RuntimeException("生成签名失败", e);
        }
    }
    
    /**
     * HMAC-SHA256签名
     * @param data 待签名数据
     * @param key 密钥
     * @return 签名结果
     */
    public static String hmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(CHARSET), ALGORITHM);
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(CHARSET));
            return bytesToHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA256签名失败", e);
        }
    }
    
    /**
     * MD5加密
     * @param data 待加密数据
     * @return 加密结果
     */
    public static String md5(String data) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("MD5加密失败", e);
        }
    }
    
    /**
     * 字节数组转十六进制字符串
     * @param bytes 字节数组
     * @return 十六进制字符串
     */
    private static String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
    
    /**
     * 生成二维码图片
     * @param content 二维码内容
     * @param width 宽度
     * @param height 高度
     * @return BufferedImage对象
     * @throws WriterException 写入异常
     */
    public static BufferedImage generateQRCode(String content, int width, int height) throws WriterException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);
        
        BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height, hints);
        
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                image.setRGB(x, y, bitMatrix.get(x, y) ? Color.BLACK.getRGB() : Color.WHITE.getRGB());
            }
        }
        
        return image;
    }
    
    /**
     * 生成二维码字节数组
     * @param content 二维码内容
     * @param width 宽度
     * @param height 高度
     * @param format 图片格式 (如: "PNG", "JPEG")
     * @return 图片字节数组
     * @throws WriterException 写入异常
     * @throws IOException IO异常
     */
    public static byte[] generateQRCodeBytes(String content, int width, int height, String format) 
            throws WriterException, IOException {
        BufferedImage image = generateQRCode(content, width, height);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        javax.imageio.ImageIO.write(image, format, baos);
        
        return baos.toByteArray();
    }
    
    /**
     * 验证签名
     * @param params 参数Map
     * @param key API密钥
     * @param signature 待验证的签名
     * @return 验证结果
     */
    public static boolean verifySignature(Map<String, String> params, String key, String signature) {
        String generatedSignature = generateSignature(params, key);
        return generatedSignature.equals(signature);
    }
    
    /**
     * 格式化金额（元转分）
     * @param amount 金额（元）
     * @return 金额（分）
     */
    public static int formatAmount(double amount) {
        return (int) Math.round(amount * 100);
    }
    
    /**
     * 格式化金额（分转元）
     * @param amount 金额（分）
     * @return 金额（元）
     */
    public static double formatAmount(int amount) {
        return amount / 100.0;
    }
    
    /**
     * 获取当前时间戳（秒）
     * @return 时间戳
     */
    public static long getCurrentTimestamp() {
        return System.currentTimeMillis() / 1000;
    }
    
    /**
     * 格式化时间为ISO8601格式
     * @param timestamp 时间戳（毫秒）
     * @return ISO8601格式时间字符串
     */
    public static String formatTimestamp(long timestamp) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
        sdf.setTimeZone(TimeZone.getTimeZone("Asia/Shanghai"));
        return sdf.format(new Date(timestamp));
    }
    
    /**
     * 检查字符串是否为空
     * @param str 字符串
     * @return 是否为空
     */
    public static boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }
    
    /**
     * 检查字符串是否不为空
     * @param str 字符串
     * @return 是否不为空
     */
    public static boolean isNotEmpty(String str) {
        return !isEmpty(str);
    }
}