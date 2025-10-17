package com.example.app.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 扫码支付请求实体类
 */
public class QRCodePaymentRequest {
    
    @JsonProperty("appid")
    private String appid; // 应用ID
    
    @JsonProperty("mchid")
    private String mchid; // 商户号
    
    @JsonProperty("description")
    private String description; // 商品描述
    
    @JsonProperty("out_trade_no")
    private String outTradeNo; // 商户订单号
    
    @JsonProperty("time_expire")
    private String timeExpire; // 交易结束时间
    
    @JsonProperty("attach")
    private String attach; // 附加数据
    
    @JsonProperty("notify_url")
    private String notifyUrl; // 通知地址
    
    @JsonProperty("goods_tag")
    private String goodsTag; // 订单优惠标记
    
    @JsonProperty("amount")
    private Amount amount; // 订单金额
    
    @JsonProperty("detail")
    private Detail detail; // 订单详情
    
    @JsonProperty("scene_info")
    private SceneInfo sceneInfo; // 场景信息
    
    // 构造函数
    public QRCodePaymentRequest() {}
    
    public QRCodePaymentRequest(String appid, String mchid, String description, 
                               String outTradeNo, String notifyUrl, Amount amount) {
        this.appid = appid;
        this.mchid = mchid;
        this.description = description;
        this.outTradeNo = outTradeNo;
        this.notifyUrl = notifyUrl;
        this.amount = amount;
    }
    
    // Getter和Setter方法
    public String getAppid() {
        return appid;
    }
    
    public void setAppid(String appid) {
        this.appid = appid;
    }
    
    public String getMchid() {
        return mchid;
    }
    
    public void setMchid(String mchid) {
        this.mchid = mchid;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getOutTradeNo() {
        return outTradeNo;
    }
    
    public void setOutTradeNo(String outTradeNo) {
        this.outTradeNo = outTradeNo;
    }
    
    public String getTimeExpire() {
        return timeExpire;
    }
    
    public void setTimeExpire(String timeExpire) {
        this.timeExpire = timeExpire;
    }
    
    public String getAttach() {
        return attach;
    }
    
    public void setAttach(String attach) {
        this.attach = attach;
    }
    
    public String getNotifyUrl() {
        return notifyUrl;
    }
    
    public void setNotifyUrl(String notifyUrl) {
        this.notifyUrl = notifyUrl;
    }
    
    public String getGoodsTag() {
        return goodsTag;
    }
    
    public void setGoodsTag(String goodsTag) {
        this.goodsTag = goodsTag;
    }
    
    public Amount getAmount() {
        return amount;
    }
    
    public void setAmount(Amount amount) {
        this.amount = amount;
    }
    
    public Detail getDetail() {
        return detail;
    }
    
    public void setDetail(Detail detail) {
        this.detail = detail;
    }
    
    public SceneInfo getSceneInfo() {
        return sceneInfo;
    }
    
    public void setSceneInfo(SceneInfo sceneInfo) {
        this.sceneInfo = sceneInfo;
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
     * 订单详情
     */
    public static class Detail {
        @JsonProperty("cost_price")
        private int costPrice; // 订单原价
        
        @JsonProperty("invoice_id")
        private String invoiceId; // 商品小票ID
        
        @JsonProperty("goods_detail")
        private java.util.List<GoodsDetail> goodsDetail; // 单品列表
        
        public Detail() {}
        
        public int getCostPrice() {
            return costPrice;
        }
        
        public void setCostPrice(int costPrice) {
            this.costPrice = costPrice;
        }
        
        public String getInvoiceId() {
            return invoiceId;
        }
        
        public void setInvoiceId(String invoiceId) {
            this.invoiceId = invoiceId;
        }
        
        public java.util.List<GoodsDetail> getGoodsDetail() {
            return goodsDetail;
        }
        
        public void setGoodsDetail(java.util.List<GoodsDetail> goodsDetail) {
            this.goodsDetail = goodsDetail;
        }
    }
    
    /**
     * 单品信息
     */
    public static class GoodsDetail {
        @JsonProperty("merchant_goods_id")
        private String merchantGoodsId; // 商户侧商品编码
        
        @JsonProperty("wechatpay_goods_id")
        private String wechatpayGoodsId; // 微信支付商品编码
        
        @JsonProperty("goods_name")
        private String goodsName; // 商品名称
        
        @JsonProperty("quantity")
        private int quantity; // 商品数量
        
        @JsonProperty("unit_price")
        private int unitPrice; // 商品单价
        
        public GoodsDetail() {}
        
        public String getMerchantGoodsId() {
            return merchantGoodsId;
        }
        
        public void setMerchantGoodsId(String merchantGoodsId) {
            this.merchantGoodsId = merchantGoodsId;
        }
        
        public String getWechatpayGoodsId() {
            return wechatpayGoodsId;
        }
        
        public void setWechatpayGoodsId(String wechatpayGoodsId) {
            this.wechatpayGoodsId = wechatpayGoodsId;
        }
        
        public String getGoodsName() {
            return goodsName;
        }
        
        public void setGoodsName(String goodsName) {
            this.goodsName = goodsName;
        }
        
        public int getQuantity() {
            return quantity;
        }
        
        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
        
        public int getUnitPrice() {
            return unitPrice;
        }
        
        public void setUnitPrice(int unitPrice) {
            this.unitPrice = unitPrice;
        }
    }
    
    /**
     * 场景信息
     */
    public static class SceneInfo {
        @JsonProperty("payer_client_ip")
        private String payerClientIp; // 用户终端IP
        
        @JsonProperty("device_id")
        private String deviceId; // 商户端设备号
        
        @JsonProperty("store_info")
        private StoreInfo storeInfo; // 商户门店信息
        
        public SceneInfo() {}
        
        public String getPayerClientIp() {
            return payerClientIp;
        }
        
        public void setPayerClientIp(String payerClientIp) {
            this.payerClientIp = payerClientIp;
        }
        
        public String getDeviceId() {
            return deviceId;
        }
        
        public void setDeviceId(String deviceId) {
            this.deviceId = deviceId;
        }
        
        public StoreInfo getStoreInfo() {
            return storeInfo;
        }
        
        public void setStoreInfo(StoreInfo storeInfo) {
            this.storeInfo = storeInfo;
        }
    }
    
    /**
     * 商户门店信息
     */
    public static class StoreInfo {
        @JsonProperty("id")
        private String id; // 门店编号
        
        @JsonProperty("name")
        private String name; // 门店名称
        
        @JsonProperty("area_code")
        private String areaCode; // 地区编码
        
        @JsonProperty("address")
        private String address; // 详细地址
        
        public StoreInfo() {}
        
        public String getId() {
            return id;
        }
        
        public void setId(String id) {
            this.id = id;
        }
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
        }
        
        public String getAreaCode() {
            return areaCode;
        }
        
        public void setAreaCode(String areaCode) {
            this.areaCode = areaCode;
        }
        
        public String getAddress() {
            return address;
        }
        
        public void setAddress(String address) {
            this.address = address;
        }
    }
}