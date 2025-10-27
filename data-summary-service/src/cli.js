#!/usr/bin/env node

require('dotenv').config();
const { Command } = require('commander');
const moment = require('moment');
const logger = require('./utils/logger');
const dataSummaryService = require('./services/dataSummaryService');
const schedulerService = require('./services/schedulerService');
const database = require('./config/database');

const program = new Command();

program
  .name('data-summary-cli')
  .description('数据汇总服务命令行工具')
  .version('1.0.0');

// 手动执行汇总命令
program
  .command('summary')
  .description('手动执行数据汇总')
  .option('-r, --range <range>', '日期范围 (daily|weekly|monthly)', 'daily')
  .option('-d, --date <date>', '特定日期 (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      console.log(`🚀 开始执行${options.range}汇总...`);
      
      const result = await dataSummaryService.executeSummaryTask(options.range, options.date);
      
      console.log('✅ 汇总完成！');
      console.log('📊 汇总报告:');
      console.log(`  时间范围: ${result.summary.dateRange}`);
      console.log(`  处理表数: ${result.summary.totalTables}`);
      console.log(`  成功表数: ${result.summary.successTables}`);
      console.log(`  失败表数: ${result.summary.failedTables}`);
      console.log(`  总记录数: ${result.summary.totalRecords}`);
      
    } catch (error) {
      console.error('❌ 汇总失败:', error.message);
      process.exit(1);
    } finally {
      await database.close();
    }
  });

// 自定义查询命令
program
  .command('query')
  .description('执行自定义查询并上传到OSS')
  .requiredOption('-q, --query <query>', 'SQL查询语句')
  .option('-p, --params <params>', '查询参数 (JSON格式)', '[]')
  .requiredOption('-f, --filename <filename>', '输出文件名')
  .option('--folder <folder>', '文件夹路径', 'custom-queries')
  .action(async (options) => {
    try {
      console.log('🔍 执行自定义查询...');
      
      const params = JSON.parse(options.params);
      const result = await dataSummaryService.customQuery(
        options.query,
        params,
        options.filename,
        options.folder
      );
      
      console.log('✅ 查询完成！');
      console.log(`📊 查询结果: ${result.count} 条记录`);
      
    } catch (error) {
      console.error('❌ 查询失败:', error.message);
      process.exit(1);
    } finally {
      await database.close();
    }
  });

// 测试连接命令
program
  .command('test')
  .description('测试数据库和OSS连接')
  .action(async () => {
    try {
      console.log('🔍 测试数据库连接...');
      await database.query('SELECT 1');
      console.log('✅ 数据库连接正常');
      
      console.log('🔍 测试OSS连接...');
      const ossService = require('./config/oss');
      const testData = { test: true, timestamp: new Date().toISOString() };
      await ossService.uploadJson('test/cli-test.json', testData);
      console.log('✅ OSS连接正常');
      
      console.log('🎉 所有连接测试通过！');
      
    } catch (error) {
      console.error('❌ 连接测试失败:', error.message);
      process.exit(1);
    } finally {
      await database.close();
    }
  });

// 定时任务管理命令
program
  .command('schedule')
  .description('定时任务管理')
  .option('--list', '列出所有定时任务')
  .option('--start <name>', '启动指定任务')
  .option('--stop <name>', '停止指定任务')
  .option('--add <name>', '添加新任务')
  .option('--cron <expression>', '任务的cron表达式')
  .option('--range <range>', '任务的日期范围')
  .action(async (options) => {
    try {
      schedulerService.init();
      
      if (options.list) {
        const tasks = schedulerService.getTasksStatus();
        console.log('📋 定时任务列表:');
        tasks.forEach(task => {
          console.log(`  ${task.name}: ${task.status} (${task.cronExpression})`);
        });
      }
      
      if (options.start) {
        schedulerService.startTask(options.start);
        console.log(`✅ 任务 ${options.start} 已启动`);
      }
      
      if (options.stop) {
        schedulerService.stopTask(options.stop);
        console.log(`⏹️  任务 ${options.stop} 已停止`);
      }
      
      if (options.add && options.cron && options.range) {
        schedulerService.addCustomSummaryTask(options.add, options.cron, options.range);
        console.log(`✅ 任务 ${options.add} 已添加`);
      }
      
    } catch (error) {
      console.error('❌ 任务管理失败:', error.message);
      process.exit(1);
    }
  });

// 日志查看命令
program
  .command('logs')
  .description('查看服务日志')
  .option('-f, --follow', '实时跟踪日志')
  .option('-n, --lines <lines>', '显示最后N行', '50')
  .action((options) => {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '../logs/combined.log');
    
    if (!fs.existsSync(logFile)) {
      console.log('📝 日志文件不存在');
      return;
    }
    
    if (options.follow) {
      const tail = require('child_process').spawn('tail', ['-f', logFile]);
      tail.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
    } else {
      const tail = require('child_process').spawn('tail', ['-n', options.lines, logFile]);
      tail.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
    }
  });

// 状态检查命令
program
  .command('status')
  .description('检查服务状态')
  .action(() => {
    const { exec } = require('child_process');
    
    exec('pm2 jlist', (error, stdout, stderr) => {
      if (error) {
        console.log('📊 PM2 未运行或未找到服务');
        return;
      }
      
      try {
        const processes = JSON.parse(stdout);
        const service = processes.find(p => p.name === 'data-summary-service');
        
        if (service) {
          console.log('📊 服务状态:');
          console.log(`  名称: ${service.name}`);
          console.log(`  状态: ${service.pm2_env.status}`);
          console.log(`  PID: ${service.pid}`);
          console.log(`  运行时间: ${moment(service.pm2_env.pm_uptime).fromNow()}`);
          console.log(`  重启次数: ${service.pm2_env.restart_time}`);
          console.log(`  内存使用: ${(service.monit.memory / 1024 / 1024).toFixed(2)} MB`);
          console.log(`  CPU使用: ${service.monit.cpu}%`);
        } else {
          console.log('📊 服务未运行');
        }
      } catch (parseError) {
        console.log('📊 无法解析服务状态');
      }
    });
  });

// 解析命令行参数
program.parse();

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}