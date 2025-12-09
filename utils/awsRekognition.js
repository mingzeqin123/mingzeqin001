const awsConfig = require('../config/aws.js');

/**
 * 读取图片文件并转换为 Base64 字符串
 * @param {string} filePath - 微信小程序临时文件路径
 * @returns {Promise<string>}
 */
function readImageAsBase64(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: ({ data }) => resolve(data),
      fail: reject
    });
  });
}

/**
 * 调用部署在 API Gateway/Lambda 的 Rekognition 代理服务
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
function callRekognitionApi(payload) {
  const { endpoint, apiKey, requestTimeout = 20000 } = awsConfig.rekognition || {};

  if (!endpoint) {
    return Promise.reject(new Error('未配置 Rekognition endpoint，请先在 config/aws.js 中填写。'));
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: endpoint,
      method: 'POST',
      timeout: requestTimeout,
      header: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {})
      },
      data: payload,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const message = res.data && res.data.message
            ? res.data.message
            : `AWS Rekognition 调用失败，HTTP ${res.statusCode}`;
          reject(new Error(message));
        }
      },
      fail: reject
    });
  });
}

/**
 * 对选择的图片执行智能识别
 * @param {string} imagePath
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function analyzeImage(imagePath, options = {}) {
  const imageBase64 = await readImageAsBase64(imagePath);
  const defaults = (awsConfig.rekognition && awsConfig.rekognition.defaultFeatures) || {};
  const featureFlags = {
    detectLabels: options.detectLabels ?? defaults.detectLabels ?? true,
    detectText: options.detectText ?? defaults.detectText ?? false,
    detectModerationLabels: options.detectModerationLabels ?? defaults.detectModerationLabels ?? false
  };

  const payload = {
    imageBase64,
    config: {
      ...featureFlags,
      maxLabels: options.maxLabels || 10,
      minConfidence: options.minConfidence || 70
    }
  };

  return callRekognitionApi(payload);
}

module.exports = {
  analyzeImage
};
