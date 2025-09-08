const cron = require('node-cron');
const moment = require('moment');
const dataSummaryService = require('./dataSummaryService');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.tasks = new Map();
    this.isInitialized = false;
  }

  /**
   * 初始化调度器
   */
  init() {
    if (this.isInitialized) {
      logger.warn('调度器已经初始化');
      return;
    }

    // 从环境变量读取默认的cron表达式
    const defaultCronSchedule = process.env.CRON_SCHEDULE || '0 2 * * *'; // 默认每天凌晨2点

    // 添加默认的每日汇总任务
    this.addTask('daily-summary', defaultCronSchedule, async () => {
      await this.executeDataSummary('daily');
    });

    // 添加每周汇总任务（每周一凌晨3点）
    this.addTask('weekly-summary', '0 3 * * 1', async () => {
      await this.executeDataSummary('weekly');
    });

    // 添加每月汇总任务（每月1号凌晨4点）
    this.addTask('monthly-summary', '0 4 1 * *', async () => {
      await this.executeDataSummary('monthly');
    });

    this.isInitialized = true;
    logger.info('调度器初始化完成');
  }

  /**
   * 添加定时任务
   * @param {string} name 任务名称
   * @param {string} cronExpression cron表达式
   * @param {Function} taskFunction 任务函数
   * @param {Object} options 任务选项
   */
  addTask(name, cronExpression, taskFunction, options = {}) {
    try {
      // 验证cron表达式
      if (!cron.validate(cronExpression)) {
        throw new Error(`无效的cron表达式: ${cronExpression}`);
      }

      // 如果任务已存在，先停止它
      if (this.tasks.has(name)) {
        this.stopTask(name);
      }

      const task = cron.schedule(cronExpression, async () => {
        const startTime = moment();
        logger.info(`开始执行定时任务: ${name}`);
        
        try {
          await taskFunction();
          const duration = moment().diff(startTime, 'seconds');
          logger.info(`定时任务执行成功: ${name}，耗时: ${duration}秒`);
        } catch (error) {
          logger.error(`定时任务执行失败: ${name}`, error);
        }
      }, {
        scheduled: false,
        timezone: options.timezone || 'Asia/Shanghai'
      });

      this.tasks.set(name, {
        task,
        cronExpression,
        taskFunction,
        options,
        createdAt: moment().format(),
        status: 'stopped'
      });

      logger.info(`定时任务已添加: ${name}, cron: ${cronExpression}`);
      return task;
    } catch (error) {
      logger.error(`添加定时任务失败: ${name}`, error);
      throw error;
    }
  }

  /**
   * 启动指定任务
   * @param {string} name 任务名称
   */
  startTask(name) {
    const taskInfo = this.tasks.get(name);
    if (!taskInfo) {
      throw new Error(`任务不存在: ${name}`);
    }

    taskInfo.task.start();
    taskInfo.status = 'running';
    logger.info(`定时任务已启动: ${name}`);
  }

  /**
   * 停止指定任务
   * @param {string} name 任务名称
   */
  stopTask(name) {
    const taskInfo = this.tasks.get(name);
    if (!taskInfo) {
      throw new Error(`任务不存在: ${name}`);
    }

    taskInfo.task.stop();
    taskInfo.status = 'stopped';
    logger.info(`定时任务已停止: ${name}`);
  }

  /**
   * 删除指定任务
   * @param {string} name 任务名称
   */
  removeTask(name) {
    const taskInfo = this.tasks.get(name);
    if (!taskInfo) {
      throw new Error(`任务不存在: ${name}`);
    }

    taskInfo.task.destroy();
    this.tasks.delete(name);
    logger.info(`定时任务已删除: ${name}`);
  }

  /**
   * 启动所有任务
   */
  startAllTasks() {
    this.tasks.forEach((taskInfo, name) => {
      if (taskInfo.status !== 'running') {
        this.startTask(name);
      }
    });
    logger.info('所有定时任务已启动');
  }

  /**
   * 停止所有任务
   */
  stopAllTasks() {
    this.tasks.forEach((taskInfo, name) => {
      if (taskInfo.status === 'running') {
        this.stopTask(name);
      }
    });
    logger.info('所有定时任务已停止');
  }

  /**
   * 获取所有任务状态
   * @returns {Array} 任务状态列表
   */
  getTasksStatus() {
    const tasks = [];
    this.tasks.forEach((taskInfo, name) => {
      tasks.push({
        name,
        cronExpression: taskInfo.cronExpression,
        status: taskInfo.status,
        createdAt: taskInfo.createdAt,
        timezone: taskInfo.options.timezone || 'Asia/Shanghai'
      });
    });
    return tasks;
  }

  /**
   * 手动执行指定任务
   * @param {string} name 任务名称
   */
  async executeTask(name) {
    const taskInfo = this.tasks.get(name);
    if (!taskInfo) {
      throw new Error(`任务不存在: ${name}`);
    }

    logger.info(`手动执行任务: ${name}`);
    await taskInfo.taskFunction();
  }

  /**
   * 执行数据汇总任务
   * @param {string} dateRange 日期范围
   * @param {string} specificDate 特定日期
   */
  async executeDataSummary(dateRange, specificDate = null) {
    try {
      const result = await dataSummaryService.executeSummaryTask(dateRange, specificDate);
      logger.info(`数据汇总任务完成: ${dateRange}`, result.summary);
      return result;
    } catch (error) {
      logger.error(`数据汇总任务失败: ${dateRange}`, error);
      throw error;
    }
  }

  /**
   * 添加自定义数据汇总任务
   * @param {string} name 任务名称
   * @param {string} cronExpression cron表达式
   * @param {string} dateRange 日期范围
   * @param {Object} options 选项
   */
  addCustomSummaryTask(name, cronExpression, dateRange, options = {}) {
    this.addTask(name, cronExpression, async () => {
      await this.executeDataSummary(dateRange, options.specificDate);
    }, options);
  }

  /**
   * 获取下次执行时间
   * @param {string} name 任务名称
   * @returns {string} 下次执行时间
   */
  getNextExecutionTime(name) {
    const taskInfo = this.tasks.get(name);
    if (!taskInfo) {
      throw new Error(`任务不存在: ${name}`);
    }

    // 这里需要根据cron表达式计算下次执行时间
    // 简单实现，实际可以使用更精确的库
    return 'N/A'; // 可以集成cron-parser库来实现
  }

  /**
   * 优雅关闭调度器
   */
  async shutdown() {
    logger.info('正在关闭调度器...');
    this.stopAllTasks();
    
    // 等待所有任务完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 销毁所有任务
    this.tasks.forEach((taskInfo, name) => {
      taskInfo.task.destroy();
    });
    
    this.tasks.clear();
    this.isInitialized = false;
    logger.info('调度器已关闭');
  }
}

module.exports = new SchedulerService();