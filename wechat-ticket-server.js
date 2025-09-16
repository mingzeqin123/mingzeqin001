const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 配置信息 - 请替换为您的实际配置
const config = {
    appId: 'YOUR_APPID', // 替换为您的公众号AppID
    appSecret: 'YOUR_APPSECRET', // 替换为您的公众号AppSecret
};

// 缓存access_token和jsapi_ticket
let tokenCache = {
    access_token: null,
    expires_at: 0,
    jsapi_ticket: null,
    ticket_expires_at: 0
};

/**
 * 获取微信公众号access_token
 */
async function getAccessToken() {
    try {
        // 检查缓存是否有效
        if (tokenCache.access_token && Date.now() < tokenCache.expires_at) {
            return tokenCache.access_token;
        }

        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`;
        const response = await axios.get(url);
        
        if (response.data.errcode) {
            throw new Error(`获取access_token失败: ${response.data.errmsg}`);
        }

        // 缓存token，提前5分钟过期
        tokenCache.access_token = response.data.access_token;
        tokenCache.expires_at = Date.now() + (response.data.expires_in - 300) * 1000;
        
        console.log('成功获取access_token');
        return response.data.access_token;
    } catch (error) {
        console.error('获取access_token失败:', error.message);
        throw error;
    }
}

/**
 * 获取jsapi_ticket
 */
async function getJsApiTicket() {
    try {
        // 检查缓存是否有效
        if (tokenCache.jsapi_ticket && Date.now() < tokenCache.ticket_expires_at) {
            return tokenCache.jsapi_ticket;
        }

        const accessToken = await getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;
        const response = await axios.get(url);
        
        if (response.data.errcode !== 0) {
            throw new Error(`获取jsapi_ticket失败: ${response.data.errmsg}`);
        }

        // 缓存ticket，提前5分钟过期
        tokenCache.jsapi_ticket = response.data.ticket;
        tokenCache.ticket_expires_at = Date.now() + (response.data.expires_in - 300) * 1000;
        
        console.log('成功获取jsapi_ticket');
        return response.data.ticket;
    } catch (error) {
        console.error('获取jsapi_ticket失败:', error.message);
        throw error;
    }
}

/**
 * 生成随机字符串
 */
function createNonceStr() {
    return Math.random().toString(36).substr(2, 15);
}

/**
 * 生成时间戳
 */
function createTimestamp() {
    return parseInt(new Date().getTime() / 1000) + '';
}

/**
 * 生成JS-SDK签名
 */
function createSignature(jsapi_ticket, noncestr, timestamp, url) {
    const string = `jsapi_ticket=${jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`;
    return crypto.createHash('sha1').update(string).digest('hex');
}

// API路由

/**
 * 获取access_token接口
 */
app.get('/api/wechat/access_token', async (req, res) => {
    try {
        const accessToken = await getAccessToken();
        res.json({
            success: true,
            data: {
                access_token: accessToken,
                expires_at: tokenCache.expires_at
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 获取jsapi_ticket接口
 */
app.get('/api/wechat/jsapi_ticket', async (req, res) => {
    try {
        const ticket = await getJsApiTicket();
        res.json({
            success: true,
            data: {
                jsapi_ticket: ticket,
                expires_at: tokenCache.ticket_expires_at
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 获取JS-SDK配置信息接口
 */
app.post('/api/wechat/js_config', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                message: '缺少url参数'
            });
        }

        const ticket = await getJsApiTicket();
        const noncestr = createNonceStr();
        const timestamp = createTimestamp();
        const signature = createSignature(ticket, noncestr, timestamp, url);

        res.json({
            success: true,
            data: {
                appId: config.appId,
                timestamp: timestamp,
                nonceStr: noncestr,
                signature: signature,
                jsApiList: [
                    'updateAppMessageShareData',
                    'updateTimelineShareData',
                    'onMenuShareTimeline',
                    'onMenuShareAppMessage'
                ]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 健康检查接口
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`微信公众号ticket服务启动成功，端口: ${PORT}`);
    console.log(`请确保已正确配置AppID和AppSecret`);
});

module.exports = app;