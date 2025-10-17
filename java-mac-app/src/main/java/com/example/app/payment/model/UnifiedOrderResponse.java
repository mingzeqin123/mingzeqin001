package com.example.app.payment.model;

import java.util.Map;
import java.util.HashMap;

/**
 * 微信统一下单响应参数
 */
public class UnifiedOrderResponse {
    
    // 通信标识
    private String returnCode;      // 返回状态码
    private String returnMsg;       // 返回信息
    
    // 业务结果
    private String resultCode;      // 业务结果
    private String errCode;         // 错误代码
    private String errCodeDes;      // 错误代码描述
    
    // 交易信息
    private String appid;           // 微信分配的公众账号ID
    private String mchId;           // 微信支付分配的商户号
    private String deviceInfo;      // 设备号
    private String nonceStr;        // 随机字符串
    private String sign;            // 签名
    private String tradeType;       // 交易类型
    private String prepayId;        // 预支付交易会话标识
    private String codeUrl;         // 二维码链接（扫码支付时返回）
    
    // 其他信息
    private String attach;          // 附加数据
    private String timeStamp;       // 时间戳
    
    /**
     * 从Map创建响应对象
     * @param params 响应参数Map
     * @return 响应对象
     */
    public static UnifiedOrderResponse fromMap(Map<String, String> params) {
        UnifiedOrderResponse response = new UnifiedOrderResponse();
        
        if (params != null) {
            response.returnCode = params.get("return_code");
            response.returnMsg = params.get("return_msg");
            response.resultCode = params.get("result_code");
            response.errCode = params.get("err_code");
            response.errCodeDes = params.get("err_code_des");
            response.appid = params.get("appid");
            response.mchId = params.get("mch_id");
            response.deviceInfo = params.get("device_info");
            response.nonceStr = params.get("nonce_str");
            response.sign = params.get("sign");
            response.tradeType = params.get("trade_type");
            response.prepayId = params.get("prepay_id");
            response.codeUrl = params.get("code_url");
            response.attach = params.get("attach");
            response.timeStamp = params.get("time_stamp");
        }
        
        return response;
    }
    
    /**
     * 转换为Map
     * @return 参数Map
     */
    public Map<String, String> toMap() {
        Map<String, String> params = new HashMap<>();
        
        if (returnCode != null) params.put("return_code", returnCode);
        if (returnMsg != null) params.put("return_msg", returnMsg);
        if (resultCode != null) params.put("result_code", resultCode);
        if (errCode != null) params.put("err_code", errCode);
        if (errCodeDes != null) params.put("err_code_des", errCodeDes);
        if (appid != null) params.put("appid", appid);
        if (mchId != null) params.put("mch_id", mchId);
        if (deviceInfo != null) params.put("device_info", deviceInfo);
        if (nonceStr != null) params.put("nonce_str", nonceStr);
        if (sign != null) params.put("sign", sign);
        if (tradeType != null) params.put("trade_type", tradeType);
        if (prepayId != null) params.put("prepay_id", prepayId);
        if (codeUrl != null) params.put("code_url", codeUrl);
        if (attach != null) params.put("attach", attach);
        if (timeStamp != null) params.put("time_stamp", timeStamp);
        
        return params;
    }
    
    /**
     * 判断请求是否成功
     * @return 是否成功
     */
    public boolean isSuccess() {
        return "SUCCESS".equals(returnCode) && "SUCCESS".equals(resultCode);
    }
    
    /**
     * 判断通信是否成功
     * @return 通信是否成功
     */
    public boolean isReturnSuccess() {
        return "SUCCESS".equals(returnCode);
    }
    
    /**
     * 判断业务是否成功
     * @return 业务是否成功
     */
    public boolean isResultSuccess() {
        return "SUCCESS".equals(resultCode);
    }
    
    /**
     * 获取错误信息
     * @return 错误信息
     */
    public String getErrorMessage() {
        if (!isReturnSuccess()) {
            return "通信失败: " + returnMsg;
        }
        if (!isResultSuccess()) {
            return "业务失败: " + errCodeDes + "(" + errCode + ")";
        }
        return null;
    }
    
    // Getters and Setters
    public String getReturnCode() {
        return returnCode;
    }
    
    public void setReturnCode(String returnCode) {
        this.returnCode = returnCode;
    }
    
    public String getReturnMsg() {
        return returnMsg;
    }
    
    public void setReturnMsg(String returnMsg) {
        this.returnMsg = returnMsg;
    }
    
    public String getResultCode() {
        return resultCode;
    }
    
    public void setResultCode(String resultCode) {
        this.resultCode = resultCode;
    }
    
    public String getErrCode() {
        return errCode;
    }
    
    public void setErrCode(String errCode) {
        this.errCode = errCode;
    }
    
    public String getErrCodeDes() {
        return errCodeDes;
    }
    
    public void setErrCodeDes(String errCodeDes) {
        this.errCodeDes = errCodeDes;
    }
    
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
    
    public String getDeviceInfo() {
        return deviceInfo;
    }
    
    public void setDeviceInfo(String deviceInfo) {
        this.deviceInfo = deviceInfo;
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
    
    public String getTradeType() {
        return tradeType;
    }
    
    public void setTradeType(String tradeType) {
        this.tradeType = tradeType;
    }
    
    public String getPrepayId() {
        return prepayId;
    }
    
    public void setPrepayId(String prepayId) {
        this.prepayId = prepayId;
    }
    
    public String getCodeUrl() {
        return codeUrl;
    }
    
    public void setCodeUrl(String codeUrl) {
        this.codeUrl = codeUrl;
    }
    
    public String getAttach() {
        return attach;
    }
    
    public void setAttach(String attach) {
        this.attach = attach;
    }
    
    public String getTimeStamp() {
        return timeStamp;
    }
    
    public void setTimeStamp(String timeStamp) {
        this.timeStamp = timeStamp;
    }
    
    @Override
    public String toString() {
        return "UnifiedOrderResponse{" +
                "returnCode='" + returnCode + '\'' +
                ", returnMsg='" + returnMsg + '\'' +
                ", resultCode='" + resultCode + '\'' +
                ", errCode='" + errCode + '\'' +
                ", errCodeDes='" + errCodeDes + '\'' +
                ", prepayId='" + prepayId + '\'' +
                ", codeUrl='" + codeUrl + '\'' +
                '}';
    }
}