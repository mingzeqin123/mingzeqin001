const XLSX = require('xlsx');
const moment = require('moment');
const database = require('../config/database');
const ossService = require('../config/oss');
const logger = require('../utils/logger');

class DataSummaryService {
  constructor() {
    // 配置需要汇总的表和查询
    this.tableConfigs = [
      {
        name: 'users',
        query: 'SELECT * FROM users WHERE created_at >= ? AND created_at < ?',
        filename: 'users_summary'
      },
      {
        name: 'orders',
        query: 'SELECT * FROM orders WHERE order_date >= ? AND order_date < ?',
        filename: 'orders_summary'
      },
      {
        name: 'products',
        query: 'SELECT * FROM products WHERE updated_at >= ? AND updated_at < ?',
        filename: 'products_summary'
      }
      // 可以根据需要添加更多表配置
    ];
  }

  /**
   * 执行数据汇总任务
   * @param {string} dateRange 日期范围类型：'daily', 'weekly', 'monthly'
   * @param {string} specificDate 特定日期，格式：YYYY-MM-DD
   */
  async executeSummaryTask(dateRange = 'daily', specificDate = null) {
    try {
      logger.info(`开始执行数据汇总任务，范围：${dateRange}`);
      
      const { startDate, endDate } = this.getDateRange(dateRange, specificDate);
      const summaryData = {};
      
      // 汇总每张表的数据
      for (const config of this.tableConfigs) {
        try {
          const data = await this.queryTableData(config, startDate, endDate);
          summaryData[config.name] = {
            data: data,
            count: data.length,
            queryTime: moment().format('YYYY-MM-DD HH:mm:ss')
          };
          
          logger.info(`表 ${config.name} 汇总完成，记录数：${data.length}`);
        } catch (error) {
          logger.error(`表 ${config.name} 汇总失败:`, error);
          summaryData[config.name] = {
            error: error.message,
            queryTime: moment().format('YYYY-MM-DD HH:mm:ss')
          };
        }
      }

      // 生成汇总报告
      const summaryReport = this.generateSummaryReport(summaryData, startDate, endDate);
      
      // 上传到OSS
      await this.uploadToOSS(summaryData, summaryReport, dateRange, startDate);
      
      logger.info('数据汇总任务执行完成');
      return summaryReport;
      
    } catch (error) {
      logger.error('数据汇总任务执行失败:', error);
      throw error;
    }
  }

  /**
   * 查询表数据
   * @param {Object} config 表配置
   * @param {string} startDate 开始日期
   * @param {string} endDate 结束日期
   * @returns {Promise<Array>} 查询结果
   */
  async queryTableData(config, startDate, endDate) {
    const data = await database.query(config.query, [startDate, endDate]);
    return data;
  }

  /**
   * 获取日期范围
   * @param {string} dateRange 日期范围类型
   * @param {string} specificDate 特定日期
   * @returns {Object} 开始和结束日期
   */
  getDateRange(dateRange, specificDate) {
    const baseDate = specificDate ? moment(specificDate) : moment();
    let startDate, endDate;

    switch (dateRange) {
      case 'daily':
        startDate = baseDate.clone().startOf('day');
        endDate = baseDate.clone().endOf('day');
        break;
      case 'weekly':
        startDate = baseDate.clone().startOf('week');
        endDate = baseDate.clone().endOf('week');
        break;
      case 'monthly':
        startDate = baseDate.clone().startOf('month');
        endDate = baseDate.clone().endOf('month');
        break;
      default:
        startDate = baseDate.clone().startOf('day');
        endDate = baseDate.clone().endOf('day');
    }

    return {
      startDate: startDate.format('YYYY-MM-DD HH:mm:ss'),
      endDate: endDate.format('YYYY-MM-DD HH:mm:ss')
    };
  }

  /**
   * 生成汇总报告
   * @param {Object} summaryData 汇总数据
   * @param {string} startDate 开始日期
   * @param {string} endDate 结束日期
   * @returns {Object} 汇总报告
   */
  generateSummaryReport(summaryData, startDate, endDate) {
    const report = {
      summary: {
        dateRange: `${startDate} ~ ${endDate}`,
        generatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        totalTables: Object.keys(summaryData).length,
        totalRecords: 0,
        successTables: 0,
        failedTables: 0
      },
      tables: {}
    };

    Object.keys(summaryData).forEach(tableName => {
      const tableData = summaryData[tableName];
      
      if (tableData.error) {
        report.summary.failedTables++;
        report.tables[tableName] = {
          status: 'failed',
          error: tableData.error,
          queryTime: tableData.queryTime
        };
      } else {
        report.summary.successTables++;
        report.summary.totalRecords += tableData.count;
        report.tables[tableName] = {
          status: 'success',
          recordCount: tableData.count,
          queryTime: tableData.queryTime
        };
      }
    });

    return report;
  }

  /**
   * 上传数据到OSS
   * @param {Object} summaryData 汇总数据
   * @param {Object} summaryReport 汇总报告
   * @param {string} dateRange 日期范围
   * @param {string} startDate 开始日期
   */
  async uploadToOSS(summaryData, summaryReport, dateRange, startDate) {
    const dateStr = moment(startDate).format('YYYY-MM-DD');
    const timeStr = moment().format('HHmmss');
    
    try {
      // 1. 上传JSON格式的原始数据
      for (const tableName of Object.keys(summaryData)) {
        if (!summaryData[tableName].error) {
          const jsonPath = `data-summary/${dateRange}/${dateStr}/${tableName}_${timeStr}.json`;
          await ossService.uploadJson(jsonPath, summaryData[tableName]);
          logger.info(`JSON数据上传成功: ${jsonPath}`);
        }
      }

      // 2. 生成并上传Excel文件
      const excelBuffer = this.generateExcelFile(summaryData);
      const excelPath = `data-summary/${dateRange}/${dateStr}/summary_${timeStr}.xlsx`;
      await ossService.uploadExcel(excelPath, excelBuffer);
      logger.info(`Excel文件上传成功: ${excelPath}`);

      // 3. 上传汇总报告
      const reportPath = `data-summary/${dateRange}/${dateStr}/report_${timeStr}.json`;
      await ossService.uploadJson(reportPath, summaryReport);
      logger.info(`汇总报告上传成功: ${reportPath}`);

    } catch (error) {
      logger.error('OSS上传失败:', error);
      throw error;
    }
  }

  /**
   * 生成Excel文件
   * @param {Object} summaryData 汇总数据
   * @returns {Buffer} Excel文件缓冲区
   */
  generateExcelFile(summaryData) {
    const workbook = XLSX.utils.book_new();

    Object.keys(summaryData).forEach(tableName => {
      const tableData = summaryData[tableName];
      
      if (!tableData.error && tableData.data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(tableData.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
      }
    });

    // 如果没有有效数据，创建一个空的工作表
    if (workbook.SheetNames.length === 0) {
      const emptySheet = XLSX.utils.json_to_sheet([{ message: '没有可用数据' }]);
      XLSX.utils.book_append_sheet(workbook, emptySheet, 'Empty');
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 自定义查询并上传
   * @param {string} query SQL查询语句
   * @param {Array} params 查询参数
   * @param {string} filename 文件名
   * @param {string} folder 文件夹路径
   */
  async customQuery(query, params, filename, folder = 'custom-queries') {
    try {
      const data = await database.query(query, params);
      const timeStr = moment().format('YYYY-MM-DD_HHmmss');
      
      // 上传JSON数据
      const jsonPath = `${folder}/${filename}_${timeStr}.json`;
      await ossService.uploadJson(jsonPath, { data, count: data.length, queryTime: moment().format() });
      
      // 生成并上传Excel文件
      if (data.length > 0) {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        const excelPath = `${folder}/${filename}_${timeStr}.xlsx`;
        await ossService.uploadExcel(excelPath, excelBuffer);
      }
      
      logger.info(`自定义查询完成，上传文件: ${filename}`);
      return { count: data.length, data };
      
    } catch (error) {
      logger.error('自定义查询失败:', error);
      throw error;
    }
  }
}

module.exports = new DataSummaryService();