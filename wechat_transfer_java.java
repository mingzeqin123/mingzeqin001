import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.*;
import javax.net.ssl.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.util.Base64;

/**
 * 微信商家转账到零钱 - Java示例代码
 * 
 * 依赖：
 * - gson (JSON处理)
 * - 需要配置SSL证书
 */
public class WechatTransfer {
    
    private String appid;
    private String mchId;
    private String apiKeyV3;
    private String certPath;
    private String keyPath;
    private String serialNo;
    private PrivateKey privateKey;
    
    public WechatTransfer(String appid, String mchId, String apiKeyV3, 
                         String certPath, String keyPath, String serialNo) throws Exception {
        this.appid = appid;
        this.mchId = mchId;
        this.apiKeyV3 = apiKeyV3;
        this.certPath = certPath;
        this.keyPath = keyPath;
        this.serialNo = serialNo;
        this.privateKey = loadPrivateKey(keyPath);
    }
    
    /**
     * 发起转账
     */
    public TransferResult transfer(TransferRequest request) throws Exception {
        String url = "https://api.mch.weixin.qq.com/v3/transfer/batches";
        
        // 构建请求数据
        JsonObject data = new JsonObject();
        data.addProperty("appid", appid);
        data.addProperty("out_batch_no", request.getOutBatchNo());
        data.addProperty("batch_name", request.getBatchName());
        data.addProperty("batch_remark", request.getBatchRemark());
        data.addProperty("total_amount", request.getTotalAmount());
        data.addProperty("total_num", request.getTransferDetailList().size());
        
        Gson gson = new Gson();
        data.add("transfer_detail_list", gson.toJsonTree(request.getTransferDetailList()));
        
        String jsonData = gson.toJson(data);
        
        // 生成签名
        long timestamp = Instant.now().getEpochSecond();
        String nonce = generateNonce();
        String signature = generateSignature("POST", "/v3/transfer/batches", timestamp, nonce, jsonData);
        
        // 构建Authorization头
        String authorization = String.format(
            "WECHATPAY2-SHA256-RSA2048 mchid=\"%s\",nonce_str=\"%s\",signature=\"%s\",timestamp=\"%d\",serial_no=\"%s\"",
            mchId, nonce, signature, timestamp, serialNo
        );
        
        // 发送HTTP请求
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("Authorization", authorization);
        conn.setRequestProperty("User-Agent", "YourApp/1.0");
        conn.setDoOutput(true);
        
        // 配置SSL证书
        configureSSL(conn);
        
        // 写入请求数据
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonData.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }
        
        // 读取响应
        int responseCode = conn.getResponseCode();
        String response;
        
        if (responseCode == 200) {
            response = readInputStream(conn.getInputStream());
        } else {
            response = readInputStream(conn.getErrorStream());
        }
        
        return new TransferResult(responseCode, response);
    }
    
    /**
     * 查询转账批次
     */
    public TransferResult queryBatch(String outBatchNo, boolean needQueryDetail, int offset, int limit) throws Exception {
        String url = String.format(
            "https://api.mch.weixin.qq.com/v3/transfer/batches/out-batch-no/%s?need_query_detail=%s&offset=%d&limit=%d",
            outBatchNo, needQueryDetail ? "true" : "false", offset, limit
        );
        
        long timestamp = Instant.now().getEpochSecond();
        String nonce = generateNonce();
        String urlPath = String.format("/v3/transfer/batches/out-batch-no/%s?need_query_detail=%s&offset=%d&limit=%d",
            outBatchNo, needQueryDetail ? "true" : "false", offset, limit);
        String signature = generateSignature("GET", urlPath, timestamp, nonce, "");
        
        String authorization = String.format(
            "WECHATPAY2-SHA256-RSA2048 mchid=\"%s\",nonce_str=\"%s\",signature=\"%s\",timestamp=\"%d\",serial_no=\"%s\"",
            mchId, nonce, signature, timestamp, serialNo
        );
        
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("Authorization", authorization);
        conn.setRequestProperty("User-Agent", "YourApp/1.0");
        
        configureSSL(conn);
        
        int responseCode = conn.getResponseCode();
        String response;
        
        if (responseCode == 200) {
            response = readInputStream(conn.getInputStream());
        } else {
            response = readInputStream(conn.getErrorStream());
        }
        
        return new TransferResult(responseCode, response);
    }
    
    /**
     * 生成随机字符串
     */
    private String generateNonce() {
        String chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        Random random = new Random();
        StringBuilder sb = new StringBuilder(32);
        for (int i = 0; i < 32; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
    
    /**
     * 生成签名
     */
    private String generateSignature(String method, String urlPath, long timestamp, String nonce, String body) throws Exception {
        String message = method + "\n" + urlPath + "\n" + timestamp + "\n" + nonce + "\n" + body + "\n";
        
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(message.getBytes(StandardCharsets.UTF_8));
        
        return Base64.getEncoder().encodeToString(signature.sign());
    }
    
    /**
     * 加载私钥
     */
    private PrivateKey loadPrivateKey(String keyPath) throws Exception {
        String key = new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(keyPath)));
        key = key.replace("-----BEGIN PRIVATE KEY-----", "")
                 .replace("-----END PRIVATE KEY-----", "")
                 .replaceAll("\\s+", "");
        
        byte[] keyBytes = Base64.getDecoder().decode(key);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePrivate(spec);
    }
    
    /**
     * 配置SSL证书
     */
    private void configureSSL(HttpURLConnection conn) throws Exception {
        if (conn instanceof HttpsURLConnection) {
            HttpsURLConnection httpsConn = (HttpsURLConnection) conn;
            
            // 加载客户端证书
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            try (FileInputStream fis = new FileInputStream(certPath)) {
                keyStore.load(fis, mchId.toCharArray());
            }
            
            KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
            kmf.init(keyStore, mchId.toCharArray());
            
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(kmf.getKeyManagers(), null, null);
            
            httpsConn.setSSLSocketFactory(sslContext.getSocketFactory());
        }
    }
    
    /**
     * 读取输入流
     */
    private String readInputStream(InputStream inputStream) throws IOException {
        if (inputStream == null) return "";
        
        StringBuilder response = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                response.append(line);
            }
        }
        return response.toString();
    }
    
    // 内部类定义
    public static class TransferRequest {
        private String outBatchNo;
        private String batchName;
        private String batchRemark;
        private int totalAmount;
        private List<TransferDetail> transferDetailList;
        
        // 构造函数和getter/setter方法
        public TransferRequest(String outBatchNo, String batchName, String batchRemark, 
                             int totalAmount, List<TransferDetail> transferDetailList) {
            this.outBatchNo = outBatchNo;
            this.batchName = batchName;
            this.batchRemark = batchRemark;
            this.totalAmount = totalAmount;
            this.transferDetailList = transferDetailList;
        }
        
        public String getOutBatchNo() { return outBatchNo; }
        public String getBatchName() { return batchName; }
        public String getBatchRemark() { return batchRemark; }
        public int getTotalAmount() { return totalAmount; }
        public List<TransferDetail> getTransferDetailList() { return transferDetailList; }
    }
    
    public static class TransferDetail {
        private String out_detail_no;
        private int transfer_amount;
        private String transfer_remark;
        private String openid;
        private String user_name; // 可选
        
        public TransferDetail(String outDetailNo, int transferAmount, String transferRemark, 
                            String openid, String userName) {
            this.out_detail_no = outDetailNo;
            this.transfer_amount = transferAmount;
            this.transfer_remark = transferRemark;
            this.openid = openid;
            this.user_name = userName;
        }
        
        // getter方法
        public String getOut_detail_no() { return out_detail_no; }
        public int getTransfer_amount() { return transfer_amount; }
        public String getTransfer_remark() { return transfer_remark; }
        public String getOpenid() { return openid; }
        public String getUser_name() { return user_name; }
    }
    
    public static class TransferResult {
        private int httpCode;
        private String response;
        
        public TransferResult(int httpCode, String response) {
            this.httpCode = httpCode;
            this.response = response;
        }
        
        public int getHttpCode() { return httpCode; }
        public String getResponse() { return response; }
    }
    
    // 使用示例
    public static void main(String[] args) {
        try {
            WechatTransfer wechatTransfer = new WechatTransfer(
                "your_appid",
                "your_mch_id", 
                "your_api_key_v3",
                "/path/to/apiclient_cert.p12",
                "/path/to/apiclient_key.pem",
                "your_cert_serial_no"
            );
            
            // 构建转账请求
            List<TransferDetail> details = Arrays.asList(
                new TransferDetail(
                    "detail_" + System.currentTimeMillis(),
                    100, // 1元
                    "转账备注",
                    "user_openid_here",
                    null // "张三" // 实名转账时填写
                )
            );
            
            TransferRequest request = new TransferRequest(
                "batch_" + System.currentTimeMillis(),
                "测试转账",
                "测试转账备注",
                100,
                details
            );
            
            // 发起转账
            TransferResult result = wechatTransfer.transfer(request);
            
            if (result.getHttpCode() == 200) {
                System.out.println("转账发起成功");
                System.out.println("响应：" + result.getResponse());
                
                // 查询转账结果
                Thread.sleep(2000); // 等待2秒
                TransferResult queryResult = wechatTransfer.queryBatch(request.getOutBatchNo(), true, 0, 20);
                System.out.println("查询结果：" + queryResult.getResponse());
            } else {
                System.out.println("转账发起失败，HTTP状态码：" + result.getHttpCode());
                System.out.println("错误响应：" + result.getResponse());
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}