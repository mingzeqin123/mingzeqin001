package com.example.app.payment.model;

import java.util.Map;
import java.util.HashMap;

/**
 * 微信统一下单请求参数
 */
public class UnifiedOrderRequest {
    
    // 必填参数
    private String appid;           // 微信分配的公众账号ID
    private String mchId;           // 微信支付分配的商户号
    private String nonceStr;        // 随机字符串
    private String sign;            // 签名
    private String body;            // 商品描述
    private String outTradeNo;      // 商户订单号
    private int totalFee;           // 总金额，单位为分
    private String spbillCreateIp;  // 用户端实际ip
    private String notifyUrl;       // 接收微信支付异步通知回调地址
    private String tradeType;       // 交易类型，JSAPI，NATIVE，APP等
    
    // 可选参数
    private String deviceInfo;      // 设备号
    private String detail;          // 商品详情
    private String attach;          // 附加数据
    private String feeType;         // 货币类型
    private String timeStart;       // 交易起始时间
    private String timeExpire;      // 交易结束时间
    private String goodsTag;        // 商品标记
    private String productId;       // 商品ID（扫码支付时必填）
    private String limitPay;        // 指定支付方式
    private String openid;          // 用户标识（JSAPI支付时必填）
    
    public UnifiedOrderRequest() {
        this.feeType = "CNY";
        this.tradeType = "NATIVE";
    }
    
    /**
     * 转换为Map用于签名和请求
     * @return 参数Map
     */
    public Map<String, String> toMap() {
        Map<String, String> params = new HashMap<>();
        
        if (appid != null) params.put("appid", appid);
        if (mchId != null) params.put("mch_id", mchId);
        if (nonceStr != null) params.put("nonce_str", nonceStr);
        if (sign != null) params.put("sign", sign);
        if (body != null) params.put("body", body);
        if (outTradeNo != null) params.put("out_trade_no", outTradeNo);
        if (totalFee > 0) params.put("total_fee", String.valueOf(totalFee));
        if (spbillCreateIp != null) params.put("spbill_create_ip", spbillCreateIp);
        if (notifyUrl != null) params.put("notify_url", notifyUrl);
        if (tradeType != null) params.put("trade_type", tradeType);
        if (deviceInfo != null) params.put("device_info", deviceInfo);
        if (detail != null) params.put("detail", detail);
        if (attach != null) params.put("attach", attach);
        if (feeType != null) params.put("fee_type", feeType);
        if (timeStart != null) params.put("time_start", timeStart);
        if (timeExpire != null) params.put("time_expire", timeExpire);
        if (goodsTag != null) params.put("goods_tag", goodsTag);
        if (productId != null) params.put("product_id", productId);
        if (limitPay != null) params.put("limit_pay", limitPay);
        if (openid != null) params.put("openid", openid);
        
        return params;
    }
    
    // Getters and Setters
    public String getAppid() {
        return appid;
    }
    
    public void setAppid(String appid) {
        this.appid = appid;
    }
    
    public String getMchId() {
        return mchId;
    }
    
    public void setMchId(String mchId) {
        this.mchId = mchId;
    }
    
    public String getNonceStr() {
        return nonceStr;
    }
    
    public void setNonceStr(String nonceStr) {
        this.nonceStr = nonceStr;
    }
    
    public String getSign() {
        return sign;
    }
    
    public void setSign(String sign) {
        this.sign = sign;
    }
    
    public String getBody() {
        return body;
    }
    
    public void setBody(String body) {
        this.body = body;
    }
    
    public String getOutTradeNo() {
        return outTradeNo;
    }
    
    public void setOutTradeNo(String outTradeNo) {
        this.outTradeNo = outTradeNo;
    }
    
    public int getTotalFee() {
        return totalFee;
    }
    
    public void setTotalFee(int totalFee) {
        this.totalFee = totalFee;
    }
    
    public String getSpbillCreateIp() {
        return spbillCreateIp;
    }
    
    public void setSpbillCreateIp(String spbillCreateIp) {
        this.spbillCreateIp = spbillCreateIp;
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
    
    public String getDeviceInfo() {
        return deviceInfo;
    }
    
    public void setDeviceInfo(String deviceInfo) {
        this.deviceInfo = deviceInfo;
    }
    
    public String getDetail() {
        return detail;
    }
    
    public void setDetail(String detail) {
        this.detail = detail;
    }
    
    public String getAttach() {
        return attach;
    }
    
    public void setAttach(String attach) {
        this.attach = attach;
    }
    
    public String getFeeType() {
        return feeType;
    }
    
    public void setFeeType(String feeType) {
        this.feeType = feeType;
    }
    
    public String getTimeStart() {
        return timeStart;
    }
    
    public void setTimeStart(String timeStart) {
        this.timeStart = timeStart;
    }
    
    public String getTimeExpire() {
        return timeExpire;
    }
    
    public void setTimeExpire(String timeExpire) {
        this.timeExpire = timeExpire;
    }
    
    public String getGoodsTag() {
        return goodsTag;
    }
    
    public void setGoodsTag(String goodsTag) {
        this.goodsTag = goodsTag;
    }
    
    public String getProductId() {
        return productId;
    }
    
    public void setProductId(String productId) {
        this.productId = productId;
    }
    
    public String getLimitPay() {
        return limitPay;
    }
    
    public void setLimitPay(String limitPay) {
        this.limitPay = limitPay;
    }
    
    public String getOpenid() {
        return openid;
    }
    
    public void setOpenid(String openid) {
        this.openid = openid;
    }
    
    @Override
    public String toString() {
        return "UnifiedOrderRequest{" +
                "appid='" + appid + '\'' +
                ", mchId='" + mchId + '\'' +
                ", nonceStr='" + nonceStr + '\'' +
                ", body='" + body + '\'' +
                ", outTradeNo='" + outTradeNo + '\'' +
                ", totalFee=" + totalFee +
                ", spbillCreateIp='" + spbillCreateIp + '\'' +
                ", notifyUrl='" + notifyUrl + '\'' +
                ", tradeType='" + tradeType + '\'' +
                ", productId='" + productId + '\'' +
                '}';
    }
}