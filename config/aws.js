/**
 * AWS 服务配置
 *
 * ⚠️ 请根据自己的 AWS 账号实际情况进行填写：
 *  - endpoint: 公开的 HTTPS 接口地址（建议使用 API Gateway + Lambda）
 *  - apiKey:   如果启用了 API Key 校验则填写，否则保持为空字符串
 *  - region:   部署 Lambda/rekognition 所在的 region，例如 ap-southeast-1
 */
module.exports = {
  rekognition: {
    endpoint: 'https://your-api-id.execute-api.ap-southeast-1.amazonaws.com/prod/rekognition',
    apiKey: '',
    region: 'ap-southeast-1',
    defaultFeatures: {
      detectLabels: true,
      detectText: true,
      detectModerationLabels: false
    },
    requestTimeout: 20000
  }
};
