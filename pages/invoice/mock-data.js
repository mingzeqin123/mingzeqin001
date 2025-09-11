// 开票系统模拟数据
const MockData = {
  // 模拟发票数据
  invoices: [
    {
      id: '1',
      invoiceNumber: 'INV202401150001',
      invoiceType: 'normal',
      status: 'completed',
      statusText: '已开票',
      customerName: '北京科技有限公司',
      customerTaxNumber: '91110000123456789X',
      customerAddress: '北京市朝阳区xxx街道xxx号',
      customerPhone: '010-12345678',
      customerBank: '中国工商银行北京分行',
      customerAccount: '1234567890123456789',
      invoiceContent: '软件开发服务费',
      amount: '10000.00',
      taxRate: 0.13,
      taxAmount: '1300.00',
      totalAmount: '11300.00',
      invoiceDate: '2024-01-15',
      remark: '项目开发费用',
      createTime: '2024-01-15 09:00:00',
      updateTime: '2024-01-15 10:30:00',
      operationLogs: [
        {
          id: '1',
          operation: '创建发票',
          operationTime: '2024-01-15 09:00:00',
          operator: '张三'
        },
        {
          id: '2',
          operation: '提交开票',
          operationTime: '2024-01-15 10:30:00',
          operator: '张三'
        }
      ]
    },
    {
      id: '2',
      invoiceNumber: 'INV202401150002',
      invoiceType: 'special',
      status: 'pending',
      statusText: '待开票',
      customerName: '上海贸易有限公司',
      customerTaxNumber: '91310000987654321Y',
      customerAddress: '上海市浦东新区xxx路xxx号',
      customerPhone: '021-87654321',
      customerBank: '中国建设银行上海分行',
      customerAccount: '9876543210987654321',
      invoiceContent: '商品销售',
      amount: '5000.00',
      taxRate: 0.13,
      taxAmount: '650.00',
      totalAmount: '5650.00',
      invoiceDate: '2024-01-15',
      remark: '',
      createTime: '2024-01-15 14:00:00',
      updateTime: '2024-01-15 14:00:00',
      operationLogs: [
        {
          id: '3',
          operation: '创建发票',
          operationTime: '2024-01-15 14:00:00',
          operator: '李四'
        }
      ]
    },
    {
      id: '3',
      invoiceNumber: 'INV202401150003',
      invoiceType: 'normal',
      status: 'draft',
      statusText: '草稿',
      customerName: '深圳创新科技有限公司',
      customerTaxNumber: '',
      customerAddress: '深圳市南山区xxx大厦',
      customerPhone: '0755-12345678',
      customerBank: '',
      customerAccount: '',
      invoiceContent: '技术咨询服务费',
      amount: '3000.00',
      taxRate: 0.06,
      taxAmount: '180.00',
      totalAmount: '3180.00',
      invoiceDate: '2024-01-15',
      remark: '技术咨询',
      createTime: '2024-01-15 16:00:00',
      updateTime: '2024-01-15 16:00:00',
      operationLogs: [
        {
          id: '4',
          operation: '创建发票',
          operationTime: '2024-01-15 16:00:00',
          operator: '王五'
        }
      ]
    }
  ],

  // 模拟客户数据
  customers: [
    {
      id: '1',
      name: '北京科技有限公司',
      taxNumber: '91110000123456789X',
      address: '北京市朝阳区xxx街道xxx号',
      phone: '010-12345678',
      email: 'contact@beijing-tech.com',
      bank: '中国工商银行北京分行',
      account: '1234567890123456789',
      createTime: '2024-01-01 09:00:00',
      updateTime: '2024-01-01 09:00:00'
    },
    {
      id: '2',
      name: '上海贸易有限公司',
      taxNumber: '91310000987654321Y',
      address: '上海市浦东新区xxx路xxx号',
      phone: '021-87654321',
      email: 'info@shanghai-trade.com',
      bank: '中国建设银行上海分行',
      account: '9876543210987654321',
      createTime: '2024-01-02 10:00:00',
      updateTime: '2024-01-02 10:00:00'
    },
    {
      id: '3',
      name: '深圳创新科技有限公司',
      taxNumber: '91440300123456789Z',
      address: '深圳市南山区xxx大厦',
      phone: '0755-12345678',
      email: 'hello@shenzhen-innov.com',
      bank: '招商银行深圳分行',
      account: '1122334455667788990',
      createTime: '2024-01-03 11:00:00',
      updateTime: '2024-01-03 11:00:00'
    },
    {
      id: '4',
      name: '广州制造有限公司',
      taxNumber: '91440100987654321A',
      address: '广州市天河区xxx工业园',
      phone: '020-11111111',
      email: 'sales@guangzhou-mfg.com',
      bank: '中国银行广州分行',
      account: '2233445566778899001',
      createTime: '2024-01-04 12:00:00',
      updateTime: '2024-01-04 12:00:00'
    }
  ],

  // 模拟统计数据
  statistics: {
    totalInvoices: 156,
    totalAmount: 1250000.00,
    totalTax: 162500.00,
    completedInvoices: 120,
    pendingInvoices: 25,
    draftInvoices: 8,
    cancelledInvoices: 3,
    monthlyStats: [
      { month: '2024-01', count: 45, amount: 450000.00 },
      { month: '2024-02', count: 38, amount: 380000.00 },
      { month: '2024-03', count: 42, amount: 420000.00 }
    ]
  }
};

// 模拟API响应
const MockAPI = {
  // 获取发票列表
  getInvoiceList: (params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { page = 1, pageSize = 10, status, keyword } = params;
        let filteredInvoices = [...MockData.invoices];
        
        // 状态筛选
        if (status && status !== 'all') {
          filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
        }
        
        // 关键词搜索
        if (keyword) {
          filteredInvoices = filteredInvoices.filter(invoice => 
            invoice.invoiceNumber.includes(keyword) || 
            invoice.customerName.includes(keyword)
          );
        }
        
        // 分页
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const data = filteredInvoices.slice(start, end);
        
        resolve({
          success: true,
          data: data,
          total: filteredInvoices.length,
          page: page,
          pageSize: pageSize
        });
      }, 500);
    });
  },

  // 获取发票详情
  getInvoiceDetail: (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const invoice = MockData.invoices.find(item => item.id === id);
        if (invoice) {
          resolve({
            success: true,
            data: invoice
          });
        } else {
          reject(new Error('发票不存在'));
        }
      }, 300);
    });
  },

  // 创建发票
  createInvoice: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newInvoice = {
          id: String(MockData.invoices.length + 1),
          invoiceNumber: `INV${Date.now()}`,
          ...data,
          createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          operationLogs: [
            {
              id: '1',
              operation: '创建发票',
              operationTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
              operator: '当前用户'
            }
          ]
        };
        
        MockData.invoices.unshift(newInvoice);
        
        resolve({
          success: true,
          data: newInvoice
        });
      }, 800);
    });
  },

  // 更新发票
  updateInvoice: (id, data) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = MockData.invoices.findIndex(item => item.id === id);
        if (index !== -1) {
          MockData.invoices[index] = {
            ...MockData.invoices[index],
            ...data,
            updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
          };
          resolve({
            success: true,
            data: MockData.invoices[index]
          });
        } else {
          reject(new Error('发票不存在'));
        }
      }, 500);
    });
  },

  // 删除发票
  deleteInvoice: (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = MockData.invoices.findIndex(item => item.id === id);
        if (index !== -1) {
          MockData.invoices.splice(index, 1);
          resolve({
            success: true,
            message: '删除成功'
          });
        } else {
          reject(new Error('发票不存在'));
        }
      }, 300);
    });
  },

  // 获取客户列表
  getCustomerList: (params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { keyword } = params;
        let filteredCustomers = [...MockData.customers];
        
        if (keyword) {
          filteredCustomers = filteredCustomers.filter(customer => 
            customer.name.includes(keyword) || 
            customer.phone.includes(keyword)
          );
        }
        
        resolve({
          success: true,
          data: filteredCustomers
        });
      }, 300);
    });
  }
};

// 导出模拟数据
module.exports = {
  MockData,
  MockAPI
};