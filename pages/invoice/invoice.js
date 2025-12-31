// pages/invoice/invoice.js
const ServiceConfig = require('../../utils/invoice-service-config.js');
const InvoiceUtil = require('../../utils/invoice.js');

function invokeServiceMarket({ service, api, data }) {
  return new Promise((resolve, reject) => {
    if (!wx.serviceMarket || !wx.serviceMarket.invokeService) {
      reject(new Error('当前基础库不支持 wx.serviceMarket.invokeService'));
      return;
    }
    wx.serviceMarket.invokeService({
      service,
      api,
      data,
      success: resolve,
      fail: reject
    });
  });
}

function readFileAsBase64(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (res) => resolve(res.data),
      fail: reject
    });
  });
}

function toAmountNumber(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim().replace(/,/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function buildInitialVerifyState() {
  return {
    status: 'idle',
    title: '未开始',
    message: '上传发票并识别后可开始查验',
    raw: null
  };
}

function parseVerifyResponseToStatus(resp) {
  const payload = InvoiceUtil.unwrapInvokeServiceResponse(resp);

  // 常见字段：isValid / valid / result / status
  const tryGet = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return undefined;
    for (const k of keys) {
      if (obj[k] !== undefined) return obj[k];
    }
    return undefined;
  };

  const v1 = tryGet(payload, ['isValid', 'valid', 'IsValid', 'Valid']);
  if (typeof v1 === 'boolean') return v1 ? 'pass' : 'fail';

  const v2 = tryGet(payload, ['result', 'Result', 'status', 'Status']);
  if (typeof v2 === 'number') {
    if (v2 === 1) return 'pass';
    if (v2 === 0) return 'fail';
  }
  if (typeof v2 === 'string') {
    const s = v2.toLowerCase();
    if (['1', 'true', 'pass', 'valid', 'success', 'ok'].includes(s)) return 'pass';
    if (['0', 'false', 'fail', 'invalid', 'error', 'ng'].includes(s)) return 'fail';
  }

  // 兜底：看 message
  const msg = String(tryGet(payload, ['message', 'Message', 'msg', 'Msg']) || '');
  if (msg.includes('一致') || msg.includes('通过') || msg.includes('有效') || msg.includes('真')) return 'pass';
  if (msg.includes('不一致') || msg.includes('无效') || msg.includes('失败') || msg.includes('假')) return 'fail';

  return 'unknown';
}

Page({
  data: {
    imagePath: '',
    autoVerify: true,
    busy: false,

    ocrStatus: 'idle', // idle | done | error | not_configured
    ocrMessage: '',

    invoice: {
      invoiceCode: '',
      invoiceNumber: '',
      invoiceDate: '',
      totalAmount: '',
      checkCode: ''
    },

    missingFields: [],
    missingFieldsText: '',

    verify: buildInitialVerifyState()
  },

  onLoad() {
    this.updateMissingFields();
  },

  // 选择发票图片
  chooseInvoiceImage() {
    const choose = () =>
      new Promise((resolve, reject) => {
        if (wx.chooseMedia) {
          wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (res) => {
              const file = res.tempFiles && res.tempFiles[0];
              resolve(file ? file.tempFilePath : '');
            },
            fail: reject
          });
          return;
        }

        wx.chooseImage({
          count: 1,
          sizeType: ['original', 'compressed'],
          sourceType: ['album', 'camera'],
          success: (res) => resolve(res.tempFilePaths[0]),
          fail: reject
        });
      });

    choose()
      .then((path) => {
        if (!path) return;
        this.setData({
          imagePath: path,
          ocrStatus: 'idle',
          ocrMessage: '',
          invoice: {
            invoiceCode: '',
            invoiceNumber: '',
            invoiceDate: '',
            totalAmount: '',
            checkCode: ''
          },
          verify: buildInitialVerifyState(),
          missingFields: [],
          missingFieldsText: ''
        });

        this.ocrInvoice();
      })
      .catch(() => {
        wx.showToast({ title: '选择图片失败', icon: 'error' });
      });
  },

  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    if (!src) return;
    wx.previewImage({ current: src, urls: [src] });
  },

  onAutoVerifyChange(e) {
    this.setData({ autoVerify: !!e.detail.value });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`invoice.${field}`]: value,
      verify: buildInitialVerifyState()
    });
    this.updateMissingFields();
  },

  updateMissingFields() {
    const invoice = this.getInvoiceForVerify();
    const missing = InvoiceUtil.getMissingVerifyFields(invoice);
    this.setData({ missingFields: missing, missingFieldsText: missing.join('、') });
  },

  getInvoiceForVerify() {
    const inv = this.data.invoice || {};
    return {
      invoiceCode: inv.invoiceCode,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      totalAmount: toAmountNumber(inv.totalAmount),
      checkCode: inv.checkCode
    };
  },

  canUseOcrService() {
    return (
      ServiceConfig &&
      ServiceConfig.ocr &&
      ServiceConfig.ocr.enabled &&
      ServiceConfig.ocr.service &&
      ServiceConfig.ocr.api
    );
  },

  canUseVerifyService() {
    return (
      ServiceConfig &&
      ServiceConfig.verify &&
      ServiceConfig.verify.enabled &&
      ServiceConfig.verify.service &&
      ServiceConfig.verify.api
    );
  },

  // OCR识别
  async ocrInvoice() {
    if (!this.data.imagePath) return;

    if (!this.canUseOcrService()) {
      this.setData({
        ocrStatus: 'not_configured',
        ocrMessage: ''
      });
      this.updateMissingFields();
      return;
    }

    this.setData({ busy: true, ocrStatus: 'idle', ocrMessage: '' });
    wx.showLoading({ title: '识别中...' });

    try {
      const base64 = await readFileAsBase64(this.data.imagePath);
      const data = {
        // 尽量兼容不同服务商字段
        image: base64,
        Image: base64,
        img_base64: base64,
        image_base64: base64,
        ...((ServiceConfig.ocr && ServiceConfig.ocr.extraData) || {})
      };

      const resp = await invokeServiceMarket({
        service: ServiceConfig.ocr.service,
        api: ServiceConfig.ocr.api,
        data
      });

      const extracted = InvoiceUtil.extractInvoiceFieldsFromOcrResponse(resp);
      const nextInvoice = {
        invoiceCode: extracted.invoiceCode || '',
        invoiceNumber: extracted.invoiceNumber || '',
        invoiceDate: extracted.invoiceDate || '',
        totalAmount: extracted.totalAmount === null || extracted.totalAmount === undefined ? '' : String(extracted.totalAmount),
        checkCode: extracted.checkCode || ''
      };

      this.setData({
        invoice: nextInvoice,
        ocrStatus: 'done',
        ocrMessage: ''
      });
      this.updateMissingFields();

      if (this.data.autoVerify) {
        await this.verifyInvoice();
      }
    } catch (err) {
      console.error('OCR失败:', err);
      this.setData({
        ocrStatus: 'error',
        ocrMessage: err && err.message ? err.message : '调用失败'
      });
    } finally {
      wx.hideLoading();
      this.setData({ busy: false });
    }
  },

  reOcr() {
    this.ocrInvoice();
  },

  // 发票查验
  async verifyInvoice() {
    const invoice = this.getInvoiceForVerify();
    const missing = InvoiceUtil.getMissingVerifyFields(invoice);
    this.setData({ missingFields: missing, missingFieldsText: missing.join('、') });

    if (missing.length) {
      this.setData({
        verify: {
          status: 'unknown',
          title: '信息不完整',
          message: `请补齐：${missing.join('、')}`,
          raw: null
        }
      });
      return;
    }

    if (!this.canUseVerifyService()) {
      this.setData({
        verify: {
          status: 'not_configured',
          title: '未配置查验服务',
          message: '已展示发票信息，但未开通/未配置真伪查验接口',
          raw: null
        }
      });
      return;
    }

    this.setData({
      busy: true,
      verify: {
        status: 'checking',
        title: '查验中',
        message: '正在提交查验，请稍候…',
        raw: null
      }
    });
    wx.showLoading({ title: '查验中...' });

    try {
      const data = {
        ...InvoiceUtil.buildVerifyPayload(invoice),
        ...((ServiceConfig.verify && ServiceConfig.verify.extraData) || {})
      };

      const resp = await invokeServiceMarket({
        service: ServiceConfig.verify.service,
        api: ServiceConfig.verify.api,
        data
      });

      console.log('发票查验响应:', resp);

      const status = parseVerifyResponseToStatus(resp);
      if (status === 'pass') {
        this.setData({
          verify: {
            status: 'pass',
            title: '通过',
            message: '查验通过（以服务市场返回为准）',
            raw: InvoiceUtil.unwrapInvokeServiceResponse(resp)
          }
        });
        return;
      }

      if (status === 'fail') {
        this.setData({
          verify: {
            status: 'fail',
            title: '未通过',
            message: '查验未通过（可能为信息不一致/发票无效等，以服务市场返回为准）',
            raw: InvoiceUtil.unwrapInvokeServiceResponse(resp)
          }
        });
        return;
      }

      this.setData({
        verify: {
          status: 'unknown',
          title: '已返回结果',
          message: '已获取查验响应，但无法自动判定。请在控制台查看 raw 响应或按服务商文档解析。',
          raw: InvoiceUtil.unwrapInvokeServiceResponse(resp)
        }
      });
    } catch (err) {
      console.error('查验失败:', err);
      this.setData({
        verify: {
          status: 'error',
          title: '查验失败',
          message: err && err.message ? err.message : '调用失败',
          raw: null
        }
      });
    } finally {
      wx.hideLoading();
      this.setData({ busy: false });
    }
  }
});

