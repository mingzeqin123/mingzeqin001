package com.example.app.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 支付请求实体类
 */
public class PaymentRequest {
    
    @JsonProperty("out_trade_no")
    private String outTradeNo; // 商户订单号
    
    @JsonProperty("description")
    private String description; // 商品描述
    
    @JsonProperty("amount")
    private Amount amount; // 订单金额
    
    @JsonProperty("payer")
    private Payer payer; // 支付者
    
    @JsonProperty("notify_url")
    private String notifyUrl; // 通知地址
    
    @JsonProperty("attach")
    private String attach; // 附加数据
    
    @JsonProperty("goods_tag")
    private String goodsTag; // 订单优惠标记
    
    @JsonProperty("time_expire")
    private String timeExpire; // 交易结束时间
    
    // 构造函数
    public PaymentRequest() {}
    
    public PaymentRequest(String outTradeNo, String description, Amount amount, String notifyUrl) {
        this.outTradeNo = outTradeNo;
        this.description = description;
        this.amount = amount;
        this.notifyUrl = notifyUrl;
    }
    
    // Getter和Setter方法
    public String getOutTradeNo() {
        return outTradeNo;
    }
    
    public void setOutTradeNo(String outTradeNo) {
        this.outTradeNo = outTradeNo;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Amount getAmount() {
        return amount;
    }
    
    public void setAmount(Amount amount) {
        this.amount = amount;
    }
    
    public Payer getPayer() {
        return payer;
    }
    
    public void setPayer(Payer payer) {
        this.payer = payer;
    }
    
    public String getNotifyUrl() {
        return notifyUrl;
    }
    
    public void setNotifyUrl(String notifyUrl) {
        this.notifyUrl = notifyUrl;
    }
    
    public String getAttach() {
        return attach;
    }
    
    public void setAttach(String attach) {
        this.attach = attach;
    }
    
    public String getGoodsTag() {
        return goodsTag;
    }
    
    public void setGoodsTag(String goodsTag) {
        this.goodsTag = goodsTag;
    }
    
    public String getTimeExpire() {
        return timeExpire;
    }
    
    public void setTimeExpire(String timeExpire) {
        this.timeExpire = timeExpire;
    }
    
    /**
     * 订单金额信息
     */
    public static class Amount {
        @JsonProperty("total")
        private int total; // 订单总金额，单位为分
        
        @JsonProperty("currency")
        private String currency = "CNY"; // 货币类型
        
        public Amount() {}
        
        public Amount(int total) {
            this.total = total;
        }
        
        public Amount(int total, String currency) {
            this.total = total;
            this.currency = currency;
        }
        
        public int getTotal() {
            return total;
        }
        
        public void setTotal(int total) {
            this.total = total;
        }
        
        public String getCurrency() {
            return currency;
        }
        
        public void setCurrency(String currency) {
            this.currency = currency;
        }
    }
    
    /**
     * 支付者信息
     */
    public static class Payer {
        @JsonProperty("openid")
        private String openid; // 用户标识
        
        public Payer() {}
        
        public Payer(String openid) {
            this.openid = openid;
        }
        
        public String getOpenid() {
            return openid;
        }
        
        public void setOpenid(String openid) {
            this.openid = openid;
        }
    }
}