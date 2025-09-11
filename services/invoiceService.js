/**
 * 开票服务模块
 * 负责处理发票相关的业务逻辑和API调用
 */

const config = require('../config/invoiceConfig.js');
const utils = require('../utils/invoiceUtils.js');
const mockAPI = require('./mockInvoiceAPI.js');

class InvoiceService {
  constructor() {
    this.baseUrl = config.API_BASE_URL;
    this.apiKey = config.API_KEY;
    this.timeout = config.REQUEST_TIMEOUT;
    this.useMockAPI = config.MOCK_API || config.ENV === 'development';
  }

  /**
   * 创建发票
   * @param {Object} invoiceData 发票数据
   * @returns {Promise} 创建结果
   */
  async createInvoice(invoiceData) {
    try {
      // 数据验证
      this.validateInvoiceData(invoiceData);
      
      // 构建请求数据
      const requestData = this.buildInvoiceRequest(invoiceData);
      
      let response;
      if (this.useMockAPI) {
        // 使用模拟API
        response = await mockAPI.createInvoice(requestData);
      } else {
        // 调用真实API
        response = await this.request('POST', '/api/invoice/create', requestData);
      }
      
      // 保存到本地存储
      await this.saveInvoiceToLocal(response.data);
      
      return {
        success: true,
        invoiceId: response.data.id,
        message: '开票申请已提交',
        data: response.data
      };
    } catch (error) {
      console.error('创建发票失败:', error);
      throw new Error(error.message || '开票服务异常，请稍后重试');
    }
  }

  /**
   * 获取发票详情
   * @param {string} invoiceId 发票ID
   * @returns {Promise} 发票详情
   */
  async getInvoiceDetail(invoiceId) {
    try {
      // 先从本地存储获取
      const localInvoice = await this.getInvoiceFromLocal(invoiceId);
      
      let response;
      if (this.useMockAPI) {
        // 使用模拟API
        response = await mockAPI.getInvoiceDetail(invoiceId);
      } else {
        // 调用真实API
        response = await this.request('GET', `/api/invoice/detail/${invoiceId}`);
      }
      
      // 合并本地和远程数据
      const invoiceDetail = {
        ...localInvoice,
        ...response.data,
        statusText: this.getStatusText(response.data.status)
      };
      
      // 更新本地存储
      await this.updateInvoiceInLocal(invoiceId, invoiceDetail);
      
      return invoiceDetail;
    } catch (error) {
      console.error('获取发票详情失败:', error);
      
      // 如果API调用失败，尝试返回本地数据
      const localInvoice = await this.getInvoiceFromLocal(invoiceId);
      if (localInvoice) {
        return {
          ...localInvoice,
          statusText: this.getStatusText(localInvoice.status)
        };
      }
      
      throw new Error('获取发票详情失败');
    }
  }

  /**
   * 获取发票历史记录
   * @param {Object} options 查询选项
   * @returns {Promise} 历史记录列表
   */
  async getInvoiceHistory(options = {}) {
    try {
      const { page = 1, limit = 10, status = '' } = options;
      
      // 从本地存储获取历史记录
      const localHistory = await this.getLocalInvoiceHistory();
      
      let response;
      if (this.useMockAPI) {
        // 使用模拟API
        response = await mockAPI.getInvoiceHistory({ page, limit, status });
      } else {
        // 调用真实API
        response = await this.request('GET', '/api/invoice/history', {
          page,
          limit,
          status
        });
      }
      
      // 合并并去重
      const mergedHistory = this.mergeInvoiceHistory(localHistory, response.data.list || response.data);
      
      // 添加状态文本
      const historyWithStatus = mergedHistory.map(invoice => ({
        ...invoice,
        statusText: this.getStatusText(invoice.status)
      }));
      
      return historyWithStatus;
    } catch (error) {
      console.error('获取发票历史失败:', error);
      
      // 如果API调用失败，返回本地数据
      const localHistory = await this.getLocalInvoiceHistory();
      return localHistory.map(invoice => ({
        ...invoice,
        statusText: this.getStatusText(invoice.status)
      }));
    }
  }

  /**
   * 取消发票
   * @param {string} invoiceId 发票ID
   * @returns {Promise} 取消结果
   */
  async cancelInvoice(invoiceId) {
    try {
      const response = await this.request('POST', `/api/invoice/cancel/${invoiceId}`);
      
      // 更新本地状态
      await this.updateInvoiceInLocal(invoiceId, {
        status: 'cancelled',
        cancelTime: new Date().toISOString()
      });
      
      return {
        success: true,
        message: '发票已取消'
      };
    } catch (error) {
      console.error('取消发票失败:', error);
      throw new Error(error.message || '取消发票失败');
    }
  }

  /**
   * 下载发票PDF
   * @param {string} invoiceId 发票ID
   * @returns {Promise} 下载链接
   */
  async downloadInvoicePDF(invoiceId) {
    try {
      const response = await this.request('GET', `/api/invoice/download/${invoiceId}`);
      return response.data.downloadUrl;
    } catch (error) {
      console.error('获取下载链接失败:', error);
      throw new Error('获取下载链接失败');
    }
  }

  /**
   * 验证发票数据
   * @param {Object} invoiceData 发票数据
   */
  validateInvoiceData(invoiceData) {
    const { title, taxNumber, amount, content, type } = invoiceData;
    
    if (!title || !title.trim()) {
      throw new Error('发票抬头不能为空');
    }
    
    if (!taxNumber || !taxNumber.trim()) {
      throw new Error('纳税人识别号不能为空');
    }
    
    // 纳税人识别号格式验证
    if (!utils.validateTaxNumber(taxNumber)) {
      throw new Error('纳税人识别号格式不正确');
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('开票金额必须大于0');
    }
    
    if (parseFloat(amount) > config.MAX_INVOICE_AMOUNT) {
      throw new Error(`开票金额不能超过${config.MAX_INVOICE_AMOUNT}元`);
    }
    
    if (!content || !content.trim()) {
      throw new Error('开票内容不能为空');
    }
    
    // 专票额外验证
    if (type === 2) {
      const { address, phone, bankName, bankAccount } = invoiceData;
      if (!address || !phone || !bankName || !bankAccount) {
        throw new Error('专用发票需要完整的企业信息');
      }
    }
  }

  /**
   * 构建发票请求数据
   * @param {Object} invoiceData 原始发票数据
   * @returns {Object} 请求数据
   */
  buildInvoiceRequest(invoiceData) {
    const requestData = {
      type: invoiceData.type,
      title: invoiceData.title.trim(),
      taxNumber: invoiceData.taxNumber.trim(),
      amount: parseFloat(invoiceData.amount),
      content: invoiceData.content.trim(),
      remark: invoiceData.remark?.trim() || '',
      createTime: new Date().toISOString(),
      clientId: this.getClientId()
    };
    
    // 专票额外信息
    if (invoiceData.type === 2) {
      requestData.companyInfo = {
        address: invoiceData.address.trim(),
        phone: invoiceData.phone.trim(),
        bankName: invoiceData.bankName.trim(),
        bankAccount: invoiceData.bankAccount.trim()
      };
    }
    
    return requestData;
  }

  /**
   * 发送HTTP请求
   * @param {string} method 请求方法
   * @param {string} url 请求URL
   * @param {Object} data 请求数据
   * @returns {Promise} 响应数据
   */
  async request(method, url, data = null) {
    return new Promise((resolve, reject) => {
      const requestConfig = {
        url: this.baseUrl + url,
        method: method.toUpperCase(),
        timeout: this.timeout,
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-Version': config.CLIENT_VERSION,
          'X-Request-Id': utils.generateRequestId()
        }
      };
      
      if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
        requestConfig.data = data;
      } else if (data && method.toUpperCase() === 'GET') {
        requestConfig.data = data;
      }
      
      wx.request({
        ...requestConfig,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (res.data.code === 0) {
              resolve(res.data);
            } else {
              reject(new Error(res.data.message || '请求失败'));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.data?.message || '网络请求失败'}`));
          }
        },
        fail: (error) => {
          console.error('网络请求失败:', error);
          reject(new Error('网络连接失败，请检查网络设置'));
        }
      });
    });
  }

  /**
   * 保存发票到本地存储
   * @param {Object} invoiceData 发票数据
   */
  async saveInvoiceToLocal(invoiceData) {
    try {
      const key = `invoice_${invoiceData.id}`;
      await wx.setStorage({
        key,
        data: {
          ...invoiceData,
          localSaveTime: new Date().toISOString()
        }
      });
      
      // 更新历史记录索引
      await this.updateLocalHistoryIndex(invoiceData);
    } catch (error) {
      console.error('保存到本地失败:', error);
    }
  }

  /**
   * 从本地存储获取发票
   * @param {string} invoiceId 发票ID
   * @returns {Promise} 发票数据
   */
  async getInvoiceFromLocal(invoiceId) {
    try {
      const key = `invoice_${invoiceId}`;
      const result = await wx.getStorage({ key });
      return result.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * 更新本地发票数据
   * @param {string} invoiceId 发票ID
   * @param {Object} updateData 更新数据
   */
  async updateInvoiceInLocal(invoiceId, updateData) {
    try {
      const existingData = await this.getInvoiceFromLocal(invoiceId);
      if (existingData) {
        const updatedData = {
          ...existingData,
          ...updateData,
          localUpdateTime: new Date().toISOString()
        };
        
        const key = `invoice_${invoiceId}`;
        await wx.setStorage({
          key,
          data: updatedData
        });
        
        // 更新历史记录索引
        await this.updateLocalHistoryIndex(updatedData);
      }
    } catch (error) {
      console.error('更新本地数据失败:', error);
    }
  }

  /**
   * 获取本地发票历史记录
   * @returns {Promise} 历史记录数组
   */
  async getLocalInvoiceHistory() {
    try {
      const result = await wx.getStorage({ key: 'invoice_history_index' });
      const historyIndex = result.data || [];
      
      // 获取每个发票的详细数据
      const historyPromises = historyIndex.map(item => 
        this.getInvoiceFromLocal(item.id)
      );
      
      const historyDetails = await Promise.all(historyPromises);
      
      // 过滤掉空数据并按时间排序
      return historyDetails
        .filter(item => item !== null)
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
    } catch (error) {
      return [];
    }
  }

  /**
   * 更新本地历史记录索引
   * @param {Object} invoiceData 发票数据
   */
  async updateLocalHistoryIndex(invoiceData) {
    try {
      let historyIndex = [];
      
      try {
        const result = await wx.getStorage({ key: 'invoice_history_index' });
        historyIndex = result.data || [];
      } catch (e) {
        // 索引不存在，使用空数组
      }
      
      // 查找是否已存在
      const existingIndex = historyIndex.findIndex(item => item.id === invoiceData.id);
      
      const indexItem = {
        id: invoiceData.id,
        title: invoiceData.title,
        amount: invoiceData.amount,
        status: invoiceData.status,
        createTime: invoiceData.createTime,
        updateTime: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        historyIndex[existingIndex] = indexItem;
      } else {
        historyIndex.unshift(indexItem);
      }
      
      // 限制历史记录数量
      if (historyIndex.length > config.MAX_LOCAL_HISTORY) {
        historyIndex = historyIndex.slice(0, config.MAX_LOCAL_HISTORY);
      }
      
      await wx.setStorage({
        key: 'invoice_history_index',
        data: historyIndex
      });
    } catch (error) {
      console.error('更新历史索引失败:', error);
    }
  }

  /**
   * 合并本地和远程发票历史记录
   * @param {Array} localHistory 本地历史记录
   * @param {Array} remoteHistory 远程历史记录
   * @returns {Array} 合并后的历史记录
   */
  mergeInvoiceHistory(localHistory, remoteHistory) {
    const merged = [...localHistory];
    
    remoteHistory.forEach(remoteItem => {
      const localIndex = merged.findIndex(localItem => localItem.id === remoteItem.id);
      if (localIndex >= 0) {
        // 更新现有项目
        merged[localIndex] = {
          ...merged[localIndex],
          ...remoteItem
        };
      } else {
        // 添加新项目
        merged.push(remoteItem);
      }
    });
    
    // 按创建时间排序
    return merged.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
  }

  /**
   * 获取状态文本
   * @param {string} status 状态码
   * @returns {string} 状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'pending': '待处理',
      'processing': '开票中',
      'completed': '已完成',
      'failed': '开票失败',
      'cancelled': '已取消'
    };
    
    return statusMap[status] || '未知状态';
  }

  /**
   * 获取客户端ID
   * @returns {string} 客户端ID
   */
  getClientId() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      return `${systemInfo.platform}_${systemInfo.model}_${Date.now()}`;
    } catch (error) {
      return `unknown_${Date.now()}`;
    }
  }
}

// 创建单例实例
const invoiceService = new InvoiceService();

module.exports = invoiceService;