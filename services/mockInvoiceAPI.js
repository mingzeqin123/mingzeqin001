/**
 * 模拟开票API服务
 * 用于开发和测试阶段
 */

const utils = require('../utils/invoiceUtils.js');
const config = require('../config/invoiceConfig.js');

class MockInvoiceAPI {
  constructor() {
    this.invoices = new Map(); // 存储模拟发票数据
    this.delay = 1000; // 模拟网络延迟
  }

  /**
   * 模拟创建发票
   * @param {Object} invoiceData 发票数据
   * @returns {Promise} 创建结果
   */
  async createInvoice(invoiceData) {
    await this.simulateDelay();
    
    // 模拟验证失败的情况
    if (Math.random() < 0.1) { // 10%的概率失败
      throw new Error('模拟开票失败：系统繁忙，请稍后重试');
    }
    
    const invoiceId = utils.generateRequestId();
    const invoiceNumber = utils.generateInvoiceNumber();
    const now = new Date().toISOString();
    
    const invoice = {
      id: invoiceId,
      invoiceNumber: invoiceNumber,
      invoiceCode: this.generateInvoiceCode(),
      checkCode: this.generateCheckCode(),
      status: 'pending',
      type: invoiceData.type,
      title: invoiceData.title,
      taxNumber: invoiceData.taxNumber,
      amount: parseFloat(invoiceData.amount),
      content: invoiceData.content,
      remark: invoiceData.remark || '',
      createTime: now,
      updateTime: now,
      
      // 税额计算
      ...utils.calculateTax(invoiceData.amount, config.TAX_RATES.GENERAL),
      
      // 专票信息
      ...(invoiceData.type === 2 && invoiceData.companyInfo ? {
        address: invoiceData.companyInfo.address,
        phone: invoiceData.companyInfo.phone,
        bankName: invoiceData.companyInfo.bankName,
        bankAccount: invoiceData.companyInfo.bankAccount
      } : {})
    };
    
    // 存储发票
    this.invoices.set(invoiceId, invoice);
    
    // 异步更新状态
    this.simulateProcessing(invoiceId);
    
    return {
      code: 0,
      message: '开票申请已提交',
      data: invoice
    };
  }

  /**
   * 模拟获取发票详情
   * @param {string} invoiceId 发票ID
   * @returns {Promise} 发票详情
   */
  async getInvoiceDetail(invoiceId) {
    await this.simulateDelay(500);
    
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error('发票不存在');
    }
    
    return {
      code: 0,
      message: '获取成功',
      data: invoice
    };
  }

  /**
   * 模拟获取发票历史记录
   * @param {Object} params 查询参数
   * @returns {Promise} 历史记录
   */
  async getInvoiceHistory(params = {}) {
    await this.simulateDelay(800);
    
    const { page = 1, limit = 10, status = '' } = params;
    let invoiceList = Array.from(this.invoices.values());
    
    // 状态过滤
    if (status) {
      invoiceList = invoiceList.filter(invoice => invoice.status === status);
    }
    
    // 排序
    invoiceList.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedList = invoiceList.slice(startIndex, endIndex);
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        list: paginatedList,
        total: invoiceList.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(invoiceList.length / limit)
      }
    };
  }

  /**
   * 模拟取消发票
   * @param {string} invoiceId 发票ID
   * @returns {Promise} 取消结果
   */
  async cancelInvoice(invoiceId) {
    await this.simulateDelay();
    
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error('发票不存在');
    }
    
    if (invoice.status === 'completed') {
      throw new Error('已完成的发票无法取消');
    }
    
    invoice.status = 'cancelled';
    invoice.updateTime = new Date().toISOString();
    invoice.cancelTime = new Date().toISOString();
    
    return {
      code: 0,
      message: '发票已取消',
      data: invoice
    };
  }

  /**
   * 模拟获取下载链接
   * @param {string} invoiceId 发票ID
   * @returns {Promise} 下载链接
   */
  async getDownloadUrl(invoiceId) {
    await this.simulateDelay();
    
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error('发票不存在');
    }
    
    if (invoice.status !== 'completed') {
      throw new Error('发票尚未完成，无法下载');
    }
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        downloadUrl: `https://mock-api.com/invoice/download/${invoiceId}.pdf`,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30分钟后过期
      }
    };
  }

  /**
   * 模拟网络延迟
   * @param {number} delay 延迟时间（毫秒）
   */
  async simulateDelay(delay = this.delay) {
    return new Promise(resolve => {
      setTimeout(resolve, delay);
    });
  }

  /**
   * 模拟开票处理流程
   * @param {string} invoiceId 发票ID
   */
  async simulateProcessing(invoiceId) {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return;
    
    // 延迟后更新为处理中
    setTimeout(() => {
      if (invoice.status === 'pending') {
        invoice.status = 'processing';
        invoice.updateTime = new Date().toISOString();
      }
    }, 2000);
    
    // 延迟后完成或失败
    setTimeout(() => {
      if (invoice.status === 'processing') {
        // 90%成功率
        if (Math.random() < 0.9) {
          invoice.status = 'completed';
          invoice.completeTime = new Date().toISOString();
          invoice.pdfUrl = `https://mock-api.com/invoice/pdf/${invoiceId}.pdf`;
          invoice.imageUrl = `https://mock-api.com/invoice/image/${invoiceId}.jpg`;
        } else {
          invoice.status = 'failed';
          invoice.errorMessage = '开票失败：税务系统繁忙，请稍后重试';
        }
        invoice.updateTime = new Date().toISOString();
      }
    }, 8000);
  }

  /**
   * 生成模拟发票代码
   * @returns {string} 发票代码
   */
  generateInvoiceCode() {
    const prefix = '144'; // 发票代码前缀
    const year = new Date().getFullYear().toString().substr(2);
    const random = Math.random().toString().substr(2, 8);
    return prefix + year + random;
  }

  /**
   * 生成模拟校验码
   * @returns {string} 校验码
   */
  generateCheckCode() {
    return Math.random().toString().substr(2, 6).toUpperCase();
  }

  /**
   * 初始化模拟数据
   */
  initMockData() {
    const mockInvoices = [
      {
        id: 'mock_001',
        invoiceNumber: 'INV20240115001',
        invoiceCode: '14424010001',
        checkCode: 'A1B2C3',
        status: 'completed',
        type: 1,
        title: '测试公司A',
        taxNumber: '91110000000000001A',
        amount: 1000.00,
        tax: 130.00,
        total: 1130.00,
        content: '技术服务费',
        remark: '测试发票',
        createTime: '2024-01-15T10:00:00.000Z',
        updateTime: '2024-01-15T10:05:00.000Z',
        completeTime: '2024-01-15T10:05:00.000Z',
        pdfUrl: 'https://mock-api.com/invoice/pdf/mock_001.pdf',
        imageUrl: 'https://mock-api.com/invoice/image/mock_001.jpg'
      },
      {
        id: 'mock_002',
        invoiceNumber: 'INV20240115002',
        status: 'processing',
        type: 2,
        title: '测试公司B',
        taxNumber: '91110000000000002B',
        amount: 2000.00,
        tax: 260.00,
        total: 2260.00,
        content: '软件开发费',
        remark: '',
        address: '北京市朝阳区测试街道123号',
        phone: '010-12345678',
        bankName: '中国银行测试支行',
        bankAccount: '1234567890123456',
        createTime: '2024-01-15T11:00:00.000Z',
        updateTime: '2024-01-15T11:02:00.000Z'
      },
      {
        id: 'mock_003',
        invoiceNumber: 'INV20240115003',
        status: 'failed',
        type: 1,
        title: '测试公司C',
        taxNumber: '91110000000000003C',
        amount: 500.00,
        tax: 65.00,
        total: 565.00,
        content: '咨询服务费',
        remark: '',
        createTime: '2024-01-15T09:00:00.000Z',
        updateTime: '2024-01-15T09:03:00.000Z',
        errorMessage: '纳税人信息不匹配，请核实后重新开票'
      }
    ];
    
    mockInvoices.forEach(invoice => {
      this.invoices.set(invoice.id, invoice);
    });
  }
}

// 创建单例并初始化模拟数据
const mockAPI = new MockInvoiceAPI();
mockAPI.initMockData();

module.exports = mockAPI;