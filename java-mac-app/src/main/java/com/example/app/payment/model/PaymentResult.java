package com.example.app.payment.model;

/**
 * 支付结果封装类
 */
public class PaymentResult {
    
    private boolean success;        // 是否成功
    private String message;         // 消息
    private String codeUrl;         // 二维码链接（扫码支付）
    private String prepayId;        // 预支付ID
    private String outTradeNo;      // 商户订单号
    private int totalFee;           // 支付金额（分）
    private String tradeType;       // 交易类型
    private String errorCode;       // 错误代码
    private String errorMessage;    // 错误信息
    
    public PaymentResult() {
        this.success = false;
    }
    
    public PaymentResult(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
    
    /**
     * 创建成功结果
     * @param codeUrl 二维码链接
     * @param outTradeNo 商户订单号
     * @param totalFee 支付金额
     * @return 成功结果
     */
    public static PaymentResult success(String codeUrl, String outTradeNo, int totalFee) {
        PaymentResult result = new PaymentResult();
        result.success = true;
        result.message = "支付订单创建成功";
        result.codeUrl = codeUrl;
        result.outTradeNo = outTradeNo;
        result.totalFee = totalFee;
        return result;
    }
    
    /**
     * 创建失败结果
     * @param message 错误消息
     * @return 失败结果
     */
    public static PaymentResult failure(String message) {
        PaymentResult result = new PaymentResult();
        result.success = false;
        result.message = message;
        return result;
    }
    
    /**
     * 创建失败结果
     * @param errorCode 错误代码
     * @param errorMessage 错误消息
     * @return 失败结果
     */
    public static PaymentResult failure(String errorCode, String errorMessage) {
        PaymentResult result = new PaymentResult();
        result.success = false;
        result.errorCode = errorCode;
        result.errorMessage = errorMessage;
        result.message = errorMessage;
        return result;
    }
    
    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
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
    
    public int getTotalFee() {
        return totalFee;
    }
    
    public void setTotalFee(int totalFee) {
        this.totalFee = totalFee;
    }
    
    public String getTradeType() {
        return tradeType;
    }
    
    public void setTradeType(String tradeType) {
        this.tradeType = tradeType;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    @Override
    public String toString() {
        return "PaymentResult{" +
                "success=" + success +
                ", message='" + message + '\'' +
                ", codeUrl='" + codeUrl + '\'' +
                ", outTradeNo='" + outTradeNo + '\'' +
                ", totalFee=" + totalFee +
                ", errorCode='" + errorCode + '\'' +
                '}';
    }
}