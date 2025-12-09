/**
 * AWS Lambda 代理函数：调用 Rekognition 识别图片
 *
 * 部署步骤概览：
 * 1. 在 AWS 控制台创建新的 Lambda 函数 (Node.js 18.x)
 * 2. 将本文件上传并安装依赖：npm install @aws-sdk/client-rekognition
 * 3. 为 Lambda 授权 Rekognition 权限（AWSLambdaBasicExecutionRole + RekognitionFullAccess 或自定义策略）
 * 4. 创建 API Gateway (HTTP API 或 REST API) 并将此 Lambda 作为后端
 * 5. 将 API Gateway 的公开 URL 填写到 config/aws.js 的 endpoint 中
 */
const {
  RekognitionClient,
  DetectLabelsCommand,
  DetectTextCommand,
  DetectModerationLabelsCommand
} = require('@aws-sdk/client-rekognition');

const client = new RekognitionClient({
  region: process.env.AWS_REGION || process.env.REKOGNITION_REGION || 'ap-southeast-1'
});

exports.handler = async (event) => {
  try {
    const payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    if (!payload || !payload.imageBase64) {
      return buildResponse(400, { message: '缺少 imageBase64 字段' });
    }

    const imageBytes = Buffer.from(payload.imageBase64, 'base64');
    const config = payload.config || {};

    const result = {};

    if (config.detectLabels !== false) {
      const labelsRes = await client.send(new DetectLabelsCommand({
        Image: { Bytes: imageBytes },
        MaxLabels: config.maxLabels || 10,
        MinConfidence: config.minConfidence || 70
      }));
      result.labels = labelsRes.Labels || [];
      result.requestId = result.requestId || getRequestId(labelsRes);
    }

    if (config.detectText) {
      const textRes = await client.send(new DetectTextCommand({
        Image: { Bytes: imageBytes }
      }));
      result.textDetections = textRes.TextDetections || [];
      result.requestId = result.requestId || getRequestId(textRes);
    }

    if (config.detectModerationLabels) {
      const moderationRes = await client.send(new DetectModerationLabelsCommand({
        Image: { Bytes: imageBytes },
        MinConfidence: config.minConfidence || 70
      }));
      result.moderationLabels = moderationRes.ModerationLabels || [];
      result.requestId = result.requestId || getRequestId(moderationRes);
    }

    return buildResponse(200, result);
  } catch (error) {
    console.error('Rekognition 调用失败:', error);
    return buildResponse(500, {
      message: error.message || '调用 Rekognition 失败',
      type: error.name || 'RekognitionError'
    });
  }
};

function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    },
    body: JSON.stringify(body)
  };
}

function getRequestId(response) {
  return response && response.$metadata && response.$metadata.requestId;
}
