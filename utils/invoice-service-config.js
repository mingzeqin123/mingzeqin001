/**
 * 发票OCR/查验服务配置（可选）
 *
 * 本项目默认不启用任何线上服务，避免未配置导致报错。
 * 如需“上传后自动识别并查验真伪”，请在微信服务市场开通对应服务，
 * 然后把 service / api 填到下面，并将 enabled 置为 true。
 *
 * 说明：
 * - service: 服务市场的 serviceId（字符串）
 * - api:     具体接口名（字符串）
 * - extraData: 固定透传参数（不同服务商字段不同，可按需添加）
 */
module.exports = {
  ocr: {
    enabled: false,
    service: '',
    api: '',
    extraData: {}
  },
  verify: {
    enabled: false,
    service: '',
    api: '',
    extraData: {}
  }
};

