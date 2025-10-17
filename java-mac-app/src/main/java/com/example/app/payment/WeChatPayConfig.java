package com.example.app.payment;

/**
 * 微信支付配置类
 * 包含微信支付所需的各种配置参数
 */
public class WeChatPayConfig {
    
    // 微信支付相关配置
    private String appId;           // 微信小程序/公众号的AppID
    private String mchId;           // 商户号
    private String apiKey;          // API密钥
    private String certPath;        // 证书路径
    private String notifyUrl;       // 支付结果通知地址
    private String tradeType;       // 交易类型，扫码支付为NATIVE
    
    // 微信支付API地址
    public static final String UNIFIED_ORDER_URL = "https://api.mch.weixin.qq.com/pay/unifiedorder";
    public static final String ORDER_QUERY_URL = "https://api.mch.weixin.qq.com/pay/orderquery";
    public static final String CLOSE_ORDER_URL = "https://api.mch.weixin.qq.com/pay/closeorder";
    public static final String REFUND_URL = "https://api.mch.weixin.qq.com/secapi/pay/refund";
    public static final String REFUND_QUERY_URL = "https://api.mch.weixin.qq.com/pay/refundquery";
    
    // 默认配置
    public static final String DEFAULT_TRADE_TYPE = "NATIVE";
    public static final String DEFAULT_CHARSET = "UTF-8";
    public static final String DEFAULT_SIGN_TYPE = "MD5";
    
    public WeChatPayConfig() {
        this.tradeType = DEFAULT_TRADE_TYPE;
    }
    
    public WeChatPayConfig(String appId, String mchId, String apiKey, String notifyUrl) {
        this.appId = appId;
        this.mchId = mchId;
        this.apiKey = apiKey;
        this.notifyUrl = notifyUrl;
        this.tradeType = DEFAULT_TRADE_TYPE;
    }
    
    // Getters and Setters
    public String getAppId() {
        return appId;
    }
    
    public void setAppId(String appId) {
        this.appId = appId;
    }
    
    public String getMchId() {
        return mchId;
    }
    
    public void setMchId(String mchId) {
        this.mchId = mchId;
    }
    
    public String getApiKey() {
        return apiKey;
    }
    
    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }
    
    public String getCertPath() {
        return certPath;
    }
    
    public void setCertPath(String certPath) {
        this.certPath = certPath;
    }
    
    public String getNotifyUrl() {
        return notifyUrl;
    }
    
    public void setNotifyUrl(String notifyUrl) {
        this.notifyUrl = notifyUrl;
    }
    
    public String getTradeType() {
        return tradeType;
    }
    
    public void setTradeType(String tradeType) {
        this.tradeType = tradeType;
    }
    
    @Override
    public String toString() {
        return "WeChatPayConfig{" +
                "appId='" + appId + '\'' +
                ", mchId='" + mchId + '\'' +
                ", apiKey='***'" +
                ", certPath='" + certPath + '\'' +
                ", notifyUrl='" + notifyUrl + '\'' +
                ", tradeType='" + tradeType + '\'' +
                '}';
    }
}