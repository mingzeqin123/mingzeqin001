package com.example.app.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 支付响应实体类
 */
public class PaymentResponse {
    
    @JsonProperty("code_url")
    private String codeUrl; // 二维码链接
    
    @JsonProperty("prepay_id")
    private String prepayId; // 预支付交易会话标识
    
    @JsonProperty("out_trade_no")
    private String outTradeNo; // 商户订单号
    
    @JsonProperty("transaction_id")
    private String transactionId; // 微信支付订单号
    
    @JsonProperty("trade_state")
    private String tradeState; // 交易状态
    
    @JsonProperty("trade_state_desc")
    private String tradeStateDesc; // 交易状态描述
    
    @JsonProperty("bank_type")
    private String bankType; // 付款银行
    
    @JsonProperty("attach")
    private String attach; // 附加数据
    
    @JsonProperty("success_time")
    private String successTime; // 支付完成时间
    
    @JsonProperty("amount")
    private Amount amount; // 订单金额信息
    
    @JsonProperty("payer")
    private Payer payer; // 支付者信息
    
    // 错误信息
    @JsonProperty("code")
    private String code; // 错误码
    
    @JsonProperty("message")
    private String message; // 错误信息
    
    // 构造函数
    public PaymentResponse() {}
    
    // Getter和Setter方法
    public String getCodeUrl() {
        return codeUrl;
    }
    
    public void setCodeUrl(String codeUrl) {
        this.codeUrl = codeUrl;
    }
    
    public String getPrepayId() {
        return prepayId;
    }
    
    public void setPrepayId(String prepayId) {
        this.prepayId = prepayId;
    }
    
    public String getOutTradeNo() {
        return outTradeNo;
    }
    
    public void setOutTradeNo(String outTradeNo) {
        this.outTradeNo = outTradeNo;
    }
    
    public String getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }
    
    public String getTradeState() {
        return tradeState;
    }
    
    public void setTradeState(String tradeState) {
        this.tradeState = tradeState;
    }
    
    public String getTradeStateDesc() {
        return tradeStateDesc;
    }
    
    public void setTradeStateDesc(String tradeStateDesc) {
        this.tradeStateDesc = tradeStateDesc;
    }
    
    public String getBankType() {
        return bankType;
    }
    
    public void setBankType(String bankType) {
        this.bankType = bankType;
    }
    
    public String getAttach() {
        return attach;
    }
    
    public void setAttach(String attach) {
        this.attach = attach;
    }
    
    public String getSuccessTime() {
        return successTime;
    }
    
    public void setSuccessTime(String successTime) {
        this.successTime = successTime;
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
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    /**
     * 判断是否成功
     * @return 是否成功
     */
    public boolean isSuccess() {
        return code == null && codeUrl != null && !codeUrl.isEmpty();
    }
    
    /**
     * 判断支付是否完成
     * @return 支付是否完成
     */
    public boolean isPaid() {
        return "SUCCESS".equals(tradeState);
    }
    
    /**
     * 订单金额信息
     */
    public static class Amount {
        @JsonProperty("total")
        private int total; // 订单总金额，单位为分
        
        @JsonProperty("payer_total")
        private int payerTotal; // 用户支付金额
        
        @JsonProperty("currency")
        private String currency; // 货币类型
        
        @JsonProperty("payer_currency")
        private String payerCurrency; // 用户支付币种
        
        public Amount() {}
        
        public int getTotal() {
            return total;
        }
        
        public void setTotal(int total) {
            this.total = total;
        }
        
        public int getPayerTotal() {
            return payerTotal;
        }
        
        public void setPayerTotal(int payerTotal) {
            this.payerTotal = payerTotal;
        }
        
        public String getCurrency() {
            return currency;
        }
        
        public void setCurrency(String currency) {
            this.currency = currency;
        }
        
        public String getPayerCurrency() {
            return payerCurrency;
        }
        
        public void setPayerCurrency(String payerCurrency) {
            this.payerCurrency = payerCurrency;
        }
    }
    
    /**
     * 支付者信息
     */
    public static class Payer {
        @JsonProperty("openid")
        private String openid; // 用户标识
        
        public Payer() {}
        
        public String getOpenid() {
            return openid;
        }
        
        public void setOpenid(String openid) {
            this.openid = openid;
        }
    }
}