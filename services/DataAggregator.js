const moment = require('moment');
const XLSX = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

class DataAggregator {
  constructor(databaseService, logger) {
    this.db = databaseService;
    this.logger = logger;
    this.outputDir = path.join(__dirname, '../temp');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async aggregateTables(tables, options = {}) {
    const {
      outputFormat = 'json',
      includeMetadata = true,
      aggregationConfig = {},
      dateRange = null
    } = options;

    const results = {
      timestamp: moment().toISOString(),
      tables: {},
      summary: {
        totalTables: tables.length,
        totalRecords: 0,
        successCount: 0,
        errorCount: 0
      }
    };

    for (const tableName of tables) {
      try {
        this.logger.info(`开始汇总表: ${tableName}`);
        
        const tableData = await this.aggregateTable(tableName, {
          ...aggregationConfig[tableName],
          dateRange
        });

        results.tables[tableName] = {
          success: true,
          recordCount: tableData.length,
          data: tableData,
          metadata: includeMetadata ? await this.getTableMetadata(tableName) : null
        };

        results.summary.totalRecords += tableData.length;
        results.summary.successCount++;

        this.logger.info(`表 ${tableName} 汇总完成，记录数: ${tableData.length}`);

      } catch (error) {
        this.logger.error(`表 ${tableName} 汇总失败:`, error);
        
        results.tables[tableName] = {
          success: false,
          error: error.message,
          recordCount: 0
        };

        results.summary.errorCount++;
      }
    }

    // 生成输出文件
    const outputFiles = await this.generateOutputFiles(results, outputFormat);
    results.outputFiles = outputFiles;

    return results;
  }

  async aggregateTable(tableName, config = {}) {
    const {
      groupBy = [],
      selectFields = ['*'],
      where = '',
      having = '',
      orderBy = '',
      limit = 1000,
      aggregations = [],
      dateRange = null
    } = config;

    // 构建查询条件
    let whereClause = where;
    if (dateRange && dateRange.start && dateRange.end) {
      const dateCondition = `created_at BETWEEN '${dateRange.start}' AND '${dateRange.end}'`;
      whereClause = whereClause ? `${whereClause} AND ${dateCondition}` : dateCondition;
    }

    // 如果没有聚合配置，直接查询表数据
    if (groupBy.length === 0 && aggregations.length === 0) {
      return await this.db.getTableData(tableName, {
        where: whereClause,
        orderBy: orderBy || 'id',
        limit
      });
    }

    // 执行聚合查询
    return await this.db.getAggregatedData(tableName, {
      groupBy,
      selectFields,
      where: whereClause,
      having,
      orderBy,
      limit,
      aggregations
    });
  }

  async getTableMetadata(tableName) {
    try {
      const schema = await this.db.getTableSchema(tableName);
      const count = await this.db.getTableCount(tableName);
      
      return {
        schema,
        totalRecords: count,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`获取表 ${tableName} 元数据失败:`, error);
      return null;
    }
  }

  async generateOutputFiles(results, format) {
    const timestamp = moment().format('YYYYMMDD_HHmmss');
    const outputFiles = [];

    try {
      switch (format.toLowerCase()) {
        case 'json':
          outputFiles.push(await this.generateJSONFile(results, timestamp));
          break;
        case 'csv':
          outputFiles.push(await this.generateCSVFiles(results, timestamp));
          break;
        case 'excel':
          outputFiles.push(await this.generateExcelFile(results, timestamp));
          break;
        case 'all':
          outputFiles.push(await this.generateJSONFile(results, timestamp));
          outputFiles.push(...await this.generateCSVFiles(results, timestamp));
          outputFiles.push(await this.generateExcelFile(results, timestamp));
          break;
        default:
          outputFiles.push(await this.generateJSONFile(results, timestamp));
      }

      return outputFiles;
    } catch (error) {
      this.logger.error('生成输出文件失败:', error);
      throw error;
    }
  }

  async generateJSONFile(results, timestamp) {
    const fileName = `aggregated_data_${timestamp}.json`;
    const filePath = path.join(this.outputDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf8');
    
    return {
      type: 'json',
      fileName,
      filePath,
      size: fs.statSync(filePath).size
    };
  }

  async generateCSVFiles(results, timestamp) {
    const files = [];

    for (const [tableName, tableResult] of Object.entries(results.tables)) {
      if (tableResult.success && tableResult.data.length > 0) {
        const fileName = `${tableName}_${timestamp}.csv`;
        const filePath = path.join(this.outputDir, fileName);
        
        const csvWriter = createCsvWriter({
          path: filePath,
          header: this.generateCSVHeaders(tableResult.data[0])
        });

        await csvWriter.writeRecords(tableResult.data);
        
        files.push({
          type: 'csv',
          tableName,
          fileName,
          filePath,
          size: fs.statSync(filePath).size
        });
      }
    }

    return files;
  }

  async generateExcelFile(results, timestamp) {
    const fileName = `aggregated_data_${timestamp}.xlsx`;
    const filePath = path.join(this.outputDir, fileName);
    
    const workbook = XLSX.utils.book_new();

    // 添加汇总信息表
    const summaryData = [
      ['汇总时间', results.timestamp],
      ['总表数', results.summary.totalTables],
      ['总记录数', results.summary.totalRecords],
      ['成功表数', results.summary.successCount],
      ['失败表数', results.summary.errorCount]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, '汇总信息');

    // 为每个表添加工作表
    for (const [tableName, tableResult] of Object.entries(results.tables)) {
      if (tableResult.success && tableResult.data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(tableResult.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
      }
    }

    XLSX.writeFile(workbook, filePath);
    
    return {
      type: 'excel',
      fileName,
      filePath,
      size: fs.statSync(filePath).size
    };
  }

  generateCSVHeaders(sampleRecord) {
    if (!sampleRecord) return [];
    
    return Object.keys(sampleRecord).map(key => ({
      id: key,
      title: key
    }));
  }

  async cleanupTempFiles() {
    try {
      const files = fs.readdirSync(this.outputDir);
      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        fs.unlinkSync(filePath);
      }
      this.logger.info('临时文件清理完成');
    } catch (error) {
      this.logger.error('清理临时文件失败:', error);
    }
  }
}

module.exports = DataAggregator;