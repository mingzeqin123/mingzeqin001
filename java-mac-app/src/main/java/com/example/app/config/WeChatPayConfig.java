package com.example.app.config;

/**
 * 微信支付配置类
 * 包含微信支付所需的基本配置信息
 */
public class WeChatPayConfig {
    
    // 微信支付商户号
    private String merchantId;
    
    // 应用ID
    private String appId;
    
    // 商户私钥路径
    private String privateKeyPath;
    
    // 商户证书序列号
    private String merchantSerialNumber;
    
    // 微信支付平台证书路径
    private String wechatPayCertificatePath;
    
    // API密钥v3
    private String apiV3Key;
    
    // 支付通知回调地址
    private String notifyUrl;
    
    // 微信支付API域名
    private String domain = "https://api.mch.weixin.qq.com";
    
    // 构造函数
    public WeChatPayConfig() {
        // 默认配置，实际使用时应从配置文件或环境变量中读取
        this.merchantId = "YOUR_MERCHANT_ID";
        this.appId = "YOUR_APP_ID";
        this.privateKeyPath = "path/to/your/private_key.pem";
        this.merchantSerialNumber = "YOUR_MERCHANT_SERIAL_NUMBER";
        this.wechatPayCertificatePath = "path/to/wechatpay_certificate.pem";
        this.apiV3Key = "YOUR_API_V3_KEY";
        this.notifyUrl = "https://your-domain.com/wechat/pay/notify";
    }
    
    // 带参数的构造函数
    public WeChatPayConfig(String merchantId, String appId, String privateKeyPath, 
                          String merchantSerialNumber, String wechatPayCertificatePath, 
                          String apiV3Key, String notifyUrl) {
        this.merchantId = merchantId;
        this.appId = appId;
        this.privateKeyPath = privateKeyPath;
        this.merchantSerialNumber = merchantSerialNumber;
        this.wechatPayCertificatePath = wechatPayCertificatePath;
        this.apiV3Key = apiV3Key;
        this.notifyUrl = notifyUrl;
    }
    
    // Getter和Setter方法
    public String getMerchantId() {
        return merchantId;
    }
    
    public void setMerchantId(String merchantId) {
        this.merchantId = merchantId;
    }
    
    public String getAppId() {
        return appId;
    }
    
    public void setAppId(String appId) {
        this.appId = appId;
    }
    
    public String getPrivateKeyPath() {
        return privateKeyPath;
    }
    
    public void setPrivateKeyPath(String privateKeyPath) {
        this.privateKeyPath = privateKeyPath;
    }
    
    public String getMerchantSerialNumber() {
        return merchantSerialNumber;
    }
    
    public void setMerchantSerialNumber(String merchantSerialNumber) {
        this.merchantSerialNumber = merchantSerialNumber;
    }
    
    public String getWechatPayCertificatePath() {
        return wechatPayCertificatePath;
    }
    
    public void setWechatPayCertificatePath(String wechatPayCertificatePath) {
        this.wechatPayCertificatePath = wechatPayCertificatePath;
    }
    
    public String getApiV3Key() {
        return apiV3Key;
    }
    
    public void setApiV3Key(String apiV3Key) {
        this.apiV3Key = apiV3Key;
    }
    
    public String getNotifyUrl() {
        return notifyUrl;
    }
    
    public void setNotifyUrl(String notifyUrl) {
        this.notifyUrl = notifyUrl;
    }
    
    public String getDomain() {
        return domain;
    }
    
    public void setDomain(String domain) {
        this.domain = domain;
    }
    
    /**
     * 验证配置是否完整
     * @return 配置是否有效
     */
    public boolean isValid() {
        return merchantId != null && !merchantId.isEmpty() &&
               appId != null && !appId.isEmpty() &&
               privateKeyPath != null && !privateKeyPath.isEmpty() &&
               merchantSerialNumber != null && !merchantSerialNumber.isEmpty() &&
               apiV3Key != null && !apiV3Key.isEmpty() &&
               notifyUrl != null && !notifyUrl.isEmpty();
    }
    
    @Override
    public String toString() {
        return "WeChatPayConfig{" +
                "merchantId='" + merchantId + '\'' +
                ", appId='" + appId + '\'' +
                ", privateKeyPath='" + privateKeyPath + '\'' +
                ", merchantSerialNumber='" + merchantSerialNumber + '\'' +
                ", wechatPayCertificatePath='" + wechatPayCertificatePath + '\'' +
                ", notifyUrl='" + notifyUrl + '\'' +
                ", domain='" + domain + '\'' +
                '}';
    }
}