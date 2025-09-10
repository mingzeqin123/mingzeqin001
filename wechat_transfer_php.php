<?php
/**
 * 微信商家转账到零钱 - PHP示例代码
 * 
 * 使用前请确保：
 * 1. 已开通商家转账到零钱功能
 * 2. 已配置API证书和密钥
 * 3. 已安装必要的依赖包
 */

class WechatTransfer {
    private $appid;
    private $mch_id;
    private $api_key_v3;
    private $cert_path;
    private $key_path;
    private $serial_no;
    
    public function __construct($config) {
        $this->appid = $config['appid'];
        $this->mch_id = $config['mch_id'];
        $this->api_key_v3 = $config['api_key_v3'];
        $this->cert_path = $config['cert_path'];
        $this->key_path = $config['key_path'];
        $this->serial_no = $config['serial_no'];
    }
    
    /**
     * 发起转账
     * 
     * @param array $transfer_data 转账数据
     * @return array 转账结果
     */
    public function transfer($transfer_data) {
        $url = 'https://api.mch.weixin.qq.com/v3/transfer/batches';
        
        // 构建请求数据
        $data = [
            'appid' => $this->appid,
            'out_batch_no' => $transfer_data['out_batch_no'],
            'batch_name' => $transfer_data['batch_name'],
            'batch_remark' => $transfer_data['batch_remark'],
            'total_amount' => $transfer_data['total_amount'],
            'total_num' => count($transfer_data['transfer_detail_list']),
            'transfer_detail_list' => $transfer_data['transfer_detail_list']
        ];
        
        $json_data = json_encode($data, JSON_UNESCAPED_UNICODE);
        
        // 生成签名
        $timestamp = time();
        $nonce = $this->generateNonce();
        $signature = $this->generateSignature('POST', '/v3/transfer/batches', $timestamp, $nonce, $json_data);
        
        // 构建Authorization头
        $authorization = sprintf(
            'WECHATPAY2-SHA256-RSA2048 mchid="%s",nonce_str="%s",signature="%s",timestamp="%d",serial_no="%s"',
            $this->mch_id,
            $nonce,
            $signature,
            $timestamp,
            $this->serial_no
        );
        
        // 发送请求
        $headers = [
            'Content-Type: application/json',
            'Accept: application/json',
            'Authorization: ' . $authorization,
            'User-Agent: YourApp/1.0'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSLCERT, $this->cert_path);
        curl_setopt($ch, CURLOPT_SSLKEY, $this->key_path);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'http_code' => $http_code,
            'response' => json_decode($response, true)
        ];
    }
    
    /**
     * 查询转账批次
     */
    public function queryBatch($out_batch_no, $need_query_detail = true, $offset = 0, $limit = 20) {
        $url = "https://api.mch.weixin.qq.com/v3/transfer/batches/out-batch-no/{$out_batch_no}";
        $query_params = [
            'need_query_detail' => $need_query_detail ? 'true' : 'false',
            'offset' => $offset,
            'limit' => $limit
        ];
        $url .= '?' . http_build_query($query_params);
        
        $timestamp = time();
        $nonce = $this->generateNonce();
        $signature = $this->generateSignature('GET', parse_url($url, PHP_URL_PATH) . '?' . parse_url($url, PHP_URL_QUERY), $timestamp, $nonce, '');
        
        $authorization = sprintf(
            'WECHATPAY2-SHA256-RSA2048 mchid="%s",nonce_str="%s",signature="%s",timestamp="%d",serial_no="%s"',
            $this->mch_id,
            $nonce,
            $signature,
            $timestamp,
            $this->serial_no
        );
        
        $headers = [
            'Accept: application/json',
            'Authorization: ' . $authorization,
            'User-Agent: YourApp/1.0'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSLCERT, $this->cert_path);
        curl_setopt($ch, CURLOPT_SSLKEY, $this->key_path);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'http_code' => $http_code,
            'response' => json_decode($response, true)
        ];
    }
    
    /**
     * 生成随机字符串
     */
    private function generateNonce($length = 32) {
        return substr(str_shuffle('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, $length);
    }
    
    /**
     * 生成签名
     */
    private function generateSignature($method, $url_path, $timestamp, $nonce, $body) {
        $message = $method . "\n" . $url_path . "\n" . $timestamp . "\n" . $nonce . "\n" . $body . "\n";
        
        $private_key = openssl_pkey_get_private(file_get_contents($this->key_path));
        openssl_sign($message, $signature, $private_key, OPENSSL_ALGO_SHA256);
        openssl_free_key($private_key);
        
        return base64_encode($signature);
    }
}

// 使用示例
try {
    $config = [
        'appid' => 'your_appid',
        'mch_id' => 'your_mch_id',
        'api_key_v3' => 'your_api_key_v3',
        'cert_path' => '/path/to/apiclient_cert.pem',
        'key_path' => '/path/to/apiclient_key.pem',
        'serial_no' => 'your_cert_serial_no'
    ];
    
    $wechat_transfer = new WechatTransfer($config);
    
    // 转账数据
    $transfer_data = [
        'out_batch_no' => 'batch_' . date('YmdHis') . rand(1000, 9999),
        'batch_name' => '测试转账',
        'batch_remark' => '测试转账备注',
        'total_amount' => 100, // 1元，单位为分
        'transfer_detail_list' => [
            [
                'out_detail_no' => 'detail_' . date('YmdHis') . rand(1000, 9999),
                'transfer_amount' => 100,
                'transfer_remark' => '转账备注',
                'openid' => 'user_openid_here',
                // 'user_name' => '张三' // 实名转账时需要
            ]
        ]
    ];
    
    // 发起转账
    $result = $wechat_transfer->transfer($transfer_data);
    
    if ($result['http_code'] == 200) {
        echo "转账发起成功\n";
        print_r($result['response']);
        
        // 查询转账结果
        sleep(2); // 等待2秒后查询
        $query_result = $wechat_transfer->queryBatch($transfer_data['out_batch_no']);
        echo "查询结果：\n";
        print_r($query_result['response']);
    } else {
        echo "转账发起失败，HTTP状态码：" . $result['http_code'] . "\n";
        print_r($result['response']);
    }
    
} catch (Exception $e) {
    echo "错误：" . $e->getMessage() . "\n";
}
?>