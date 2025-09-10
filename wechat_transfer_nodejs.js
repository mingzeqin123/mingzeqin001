/**
 * 微信商家转账到零钱 - Node.js示例代码
 * 
 * 依赖包：
 * npm install axios crypto fs
 * 
 * 使用前请确保：
 * 1. 已开通商家转账到零钱功能
 * 2. 已配置API证书和密钥
 * 3. 已安装必要的依赖包
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

class WechatTransfer {
    constructor(config) {
        this.appid = config.appid;
        this.mchId = config.mchId;
        this.apiKeyV3 = config.apiKeyV3;
        this.certPath = config.certPath;
        this.keyPath = config.keyPath;
        this.serialNo = config.serialNo;
        
        // 加载私钥
        this.privateKey = fs.readFileSync(this.keyPath, 'utf8');
        
        // 创建HTTPS Agent用于双向SSL认证
        this.httpsAgent = new https.Agent({
            cert: fs.readFileSync(this.certPath),
            key: fs.readFileSync(this.keyPath),
            rejectUnauthorized: true
        });
    }
    
    /**
     * 发起转账
     * @param {Object} transferData 转账数据
     * @returns {Object} 转账结果
     */
    async transfer(transferData) {
        const url = 'https://api.mch.weixin.qq.com/v3/transfer/batches';
        
        // 构建请求数据
        const data = {
            appid: this.appid,
            out_batch_no: transferData.outBatchNo,
            batch_name: transferData.batchName,
            batch_remark: transferData.batchRemark,
            total_amount: transferData.totalAmount,
            total_num: transferData.transferDetailList.length,
            transfer_detail_list: transferData.transferDetailList
        };
        
        const jsonData = JSON.stringify(data);
        
        // 生成签名
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.generateNonce();
        const signature = this.generateSignature('POST', '/v3/transfer/batches', timestamp, nonce, jsonData);
        
        // 构建Authorization头
        const authorization = [
            'WECHATPAY2-SHA256-RSA2048',
            `mchid="${this.mchId}"`,
            `nonce_str="${nonce}"`,
            `signature="${signature}"`,
            `timestamp="${timestamp}"`,
            `serial_no="${this.serialNo}"`
        ].join(' ');
        
        // 发送请求
        try {
            const response = await axios({
                method: 'POST',
                url: url,
                data: jsonData,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': authorization,
                    'User-Agent': 'YourApp/1.0'
                },
                httpsAgent: this.httpsAgent,
                timeout: 30000
            });
            
            return {
                httpCode: response.status,
                response: response.data,
                success: response.status === 200
            };
        } catch (error) {
            return {
                httpCode: error.response ? error.response.status : 0,
                response: error.response ? error.response.data : { error: error.message },
                success: false
            };
        }
    }
    
    /**
     * 查询转账批次
     * @param {string} outBatchNo 商家批次单号
     * @param {boolean} needQueryDetail 是否查询转账明细
     * @param {number} offset 偏移量
     * @param {number} limit 限制数量
     * @returns {Object} 查询结果
     */
    async queryBatch(outBatchNo, needQueryDetail = true, offset = 0, limit = 20) {
        const params = new URLSearchParams({
            need_query_detail: needQueryDetail ? 'true' : 'false',
            offset: offset.toString(),
            limit: limit.toString()
        });
        
        const url = `https://api.mch.weixin.qq.com/v3/transfer/batches/out-batch-no/${outBatchNo}?${params}`;
        const urlPath = `/v3/transfer/batches/out-batch-no/${outBatchNo}?${params}`;
        
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.generateNonce();
        const signature = this.generateSignature('GET', urlPath, timestamp, nonce, '');
        
        const authorization = [
            'WECHATPAY2-SHA256-RSA2048',
            `mchid="${this.mchId}"`,
            `nonce_str="${nonce}"`,
            `signature="${signature}"`,
            `timestamp="${timestamp}"`,
            `serial_no="${this.serialNo}"`
        ].join(' ');
        
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                headers: {
                    'Accept': 'application/json',
                    'Authorization': authorization,
                    'User-Agent': 'YourApp/1.0'
                },
                httpsAgent: this.httpsAgent,
                timeout: 30000
            });
            
            return {
                httpCode: response.status,
                response: response.data,
                success: response.status === 200
            };
        } catch (error) {
            return {
                httpCode: error.response ? error.response.status : 0,
                response: error.response ? error.response.data : { error: error.message },
                success: false
            };
        }
    }
    
    /**
     * 查询转账明细
     * @param {string} outBatchNo 商家批次单号
     * @param {string} outDetailNo 商家明细单号
     * @returns {Object} 查询结果
     */
    async queryDetail(outBatchNo, outDetailNo) {
        const url = `https://api.mch.weixin.qq.com/v3/transfer/batches/out-batch-no/${outBatchNo}/details/out-detail-no/${outDetailNo}`;
        const urlPath = `/v3/transfer/batches/out-batch-no/${outBatchNo}/details/out-detail-no/${outDetailNo}`;
        
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.generateNonce();
        const signature = this.generateSignature('GET', urlPath, timestamp, nonce, '');
        
        const authorization = [
            'WECHATPAY2-SHA256-RSA2048',
            `mchid="${this.mchId}"`,
            `nonce_str="${nonce}"`,
            `signature="${signature}"`,
            `timestamp="${timestamp}"`,
            `serial_no="${this.serialNo}"`
        ].join(' ');
        
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                headers: {
                    'Accept': 'application/json',
                    'Authorization': authorization,
                    'User-Agent': 'YourApp/1.0'
                },
                httpsAgent: this.httpsAgent,
                timeout: 30000
            });
            
            return {
                httpCode: response.status,
                response: response.data,
                success: response.status === 200
            };
        } catch (error) {
            return {
                httpCode: error.response ? error.response.status : 0,
                response: error.response ? error.response.data : { error: error.message },
                success: false
            };
        }
    }
    
    /**
     * 生成随机字符串
     * @param {number} length 长度
     * @returns {string} 随机字符串
     */
    generateNonce(length = 32) {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    /**
     * 生成签名
     * @param {string} method HTTP方法
     * @param {string} urlPath URL路径
     * @param {number} timestamp 时间戳
     * @param {string} nonce 随机字符串
     * @param {string} body 请求体
     * @returns {string} 签名
     */
    generateSignature(method, urlPath, timestamp, nonce, body) {
        const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`;
        
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(message, 'utf8');
        return sign.sign(this.privateKey, 'base64');
    }
}

// 使用示例
async function main() {
    // 配置信息
    const config = {
        appid: 'your_appid',
        mchId: 'your_mch_id',
        apiKeyV3: 'your_api_key_v3',
        certPath: '/path/to/apiclient_cert.pem',
        keyPath: '/path/to/apiclient_key.pem',
        serialNo: 'your_cert_serial_no'
    };
    
    try {
        // 创建转账客户端
        const wechatTransfer = new WechatTransfer(config);
        
        // 构建转账数据
        const currentTime = Date.now();
        const transferData = {
            outBatchNo: `batch_${currentTime}_${Math.floor(Math.random() * 9000) + 1000}`,
            batchName: '测试转账',
            batchRemark: '测试转账备注',
            totalAmount: 100, // 1元，单位为分
            transferDetailList: [
                {
                    out_detail_no: `detail_${currentTime}_${Math.floor(Math.random() * 9000) + 1000}`,
                    transfer_amount: 100,
                    transfer_remark: '转账备注',
                    openid: 'user_openid_here',
                    // user_name: '张三' // 实名转账时需要
                }
            ]
        };
        
        // 发起转账
        console.log('正在发起转账...');
        const result = await wechatTransfer.transfer(transferData);
        
        if (result.success) {
            console.log('✅ 转账发起成功');
            console.log('响应数据:', JSON.stringify(result.response, null, 2));
            
            // 等待2秒后查询转账结果
            console.log('\n等待2秒后查询转账结果...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const queryResult = await wechatTransfer.queryBatch(transferData.outBatchNo);
            if (queryResult.success) {
                console.log('✅ 查询成功');
                console.log('查询结果:', JSON.stringify(queryResult.response, null, 2));
                
                // 如果有转账明细，可以进一步查询单个明细
                if (queryResult.response.transfer_detail_list && queryResult.response.transfer_detail_list.length > 0) {
                    const detailNo = transferData.transferDetailList[0].out_detail_no;
                    const detailResult = await wechatTransfer.queryDetail(transferData.outBatchNo, detailNo);
                    console.log('\n转账明细:', JSON.stringify(detailResult.response, null, 2));
                }
            } else {
                console.log('❌ 查询失败');
                console.log('错误信息:', queryResult.response);
            }
        } else {
            console.log('❌ 转账发起失败');
            console.log(`HTTP状态码: ${result.httpCode}`);
            console.log('错误信息:', result.response);
        }
        
    } catch (error) {
        console.error('❌ 程序执行出错:', error.message);
    }
}

// 如果直接运行此文件，则执行示例
if (require.main === module) {
    main().catch(console.error);
}

module.exports = WechatTransfer;