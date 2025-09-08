const cron = require('node-cron');
const moment = require('moment');

class SchedulerService {
  constructor(dataAggregator, ossService, logger) {
    this.dataAggregator = dataAggregator;
    this.ossService = ossService;
    this.logger = logger;
    this.cronJob = null;
    this.isRunning = false;
    this.lastRun = null;
    this.nextRun = null;
    this.status = 'stopped';
  }

  start() {
    const cronSchedule = process.env.CRON_SCHEDULE || '0 0 2 * * *'; // 默认每天凌晨2点
    
    if (this.cronJob) {
      this.stop();
    }

    this.cronJob = cron.schedule(cronSchedule, async () => {
      await this.runAggregation();
    }, {
      scheduled: false,
      timezone: process.env.TZ || 'Asia/Shanghai'
    });

    this.cronJob.start();
    this.status = 'running';
    this.nextRun = this.calculateNextRun(cronSchedule);
    
    this.logger.info(`定时任务已启动，执行时间: ${cronSchedule}`);
    this.logger.info(`下次执行时间: ${this.nextRun}`);
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.status = 'stopped';
    this.nextRun = null;
    this.logger.info('定时任务已停止');
  }

  async runAggregation() {
    if (this.isRunning) {
      this.logger.warn('数据汇总任务正在运行中，跳过本次执行');
      return;
    }

    this.isRunning = true;
    this.status = 'running';
    this.lastRun = new Date();

    try {
      this.logger.info('开始执行数据汇总任务');
      
      // 获取要汇总的表列表
      const tables = this.getTablesToAggregate();
      if (tables.length === 0) {
        this.logger.warn('没有配置要汇总的表');
        return;
      }

      // 获取输出格式
      const outputFormat = process.env.OUTPUT_FORMAT || 'json';
      
      // 执行数据汇总
      const results = await this.dataAggregator.aggregateTables(tables, {
        outputFormat,
        includeMetadata: true,
        aggregationConfig: this.getAggregationConfig()
      });

      // 上传到OSS
      const uploadResults = await this.uploadToOSS(results);

      this.logger.info('数据汇总任务执行完成', {
        summary: results.summary,
        uploadResults: uploadResults
      });

      // 清理临时文件
      await this.dataAggregator.cleanupTempFiles();

    } catch (error) {
      this.logger.error('数据汇总任务执行失败:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.status = 'idle';
      this.nextRun = this.calculateNextRun(process.env.CRON_SCHEDULE || '0 0 2 * * *');
    }
  }

  getTablesToAggregate() {
    const tablesEnv = process.env.AGGREGATION_TABLES;
    if (!tablesEnv) {
      return ['users', 'orders', 'products']; // 默认表名
    }
    return tablesEnv.split(',').map(table => table.trim());
  }

  getAggregationConfig() {
    // 这里可以根据需要配置每个表的聚合规则
    return {
      // 示例配置
      users: {
        groupBy: ['status'],
        aggregations: [
          { function: 'COUNT', field: 'id', alias: 'user_count' },
          { function: 'AVG', field: 'age', alias: 'avg_age' }
        ]
      },
      orders: {
        groupBy: ['status', 'DATE(created_at)'],
        aggregations: [
          { function: 'COUNT', field: 'id', alias: 'order_count' },
          { function: 'SUM', field: 'amount', alias: 'total_amount' }
        ],
        where: 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      }
    };
  }

  async uploadToOSS(results) {
    const uploadResults = [];

    try {
      // 上传JSON汇总文件
      if (results.outputFiles) {
        for (const file of results.outputFiles) {
          const remotePath = this.ossService.generateRemotePath(
            file.tableName || 'aggregated',
            file.type,
            moment(results.timestamp)
          );

          let uploadResult;
          if (file.type === 'json') {
            uploadResult = await this.ossService.uploadFile(file.filePath, remotePath);
          } else if (file.type === 'csv') {
            uploadResult = await this.ossService.uploadFile(file.filePath, remotePath);
          } else if (file.type === 'excel') {
            uploadResult = await this.ossService.uploadFile(file.filePath, remotePath);
          }

          uploadResults.push({
            fileName: file.fileName,
            remotePath,
            size: file.size,
            url: uploadResult?.url,
            success: true
          });
        }
      }

      this.logger.info(`成功上传 ${uploadResults.length} 个文件到OSS`);
      return uploadResults;

    } catch (error) {
      this.logger.error('上传到OSS失败:', error);
      throw error;
    }
  }

  calculateNextRun(cronSchedule) {
    try {
      // 这里简化处理，实际应该使用cron-parser库来精确计算
      const now = moment();
      const nextRun = now.clone().add(1, 'day').startOf('day').add(2, 'hours');
      return nextRun.toISOString();
    } catch (error) {
      this.logger.error('计算下次运行时间失败:', error);
      return null;
    }
  }

  getStatus() {
    return {
      status: this.status,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun
    };
  }

  getLastRun() {
    return this.lastRun;
  }

  getNextRun() {
    return this.nextRun;
  }
}

module.exports = SchedulerService;