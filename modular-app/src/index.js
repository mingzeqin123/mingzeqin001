#!/usr/bin/env node

/**
 * 模块化应用入口文件
 * 提供命令行接口和快速启动功能
 */

const ModularApp = require('./app');
const { getConfig, validateConfig } = require('./config');

// 命令行参数解析
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        config: null,
        logLevel: 'info',
        port: null,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--config':
            case '-c':
                options.config = args[++i];
                break;
            case '--log-level':
            case '-l':
                options.logLevel = args[++i];
                break;
            case '--port':
            case '-p':
                options.port = parseInt(args[++i]);
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
            default:
                if (arg.startsWith('--')) {
                    console.warn(`未知参数: ${arg}`);
                }
        }
    }

    return options;
}

// 显示帮助信息
function showHelp() {
    console.log(`
模块化应用 - 命令行工具

用法:
  node src/index.js [选项]

选项:
  -c, --config <文件>     指定配置文件路径
  -l, --log-level <级别>  设置日志级别 (error, warn, info, debug)
  -p, --port <端口>       设置服务端口
  -h, --help              显示此帮助信息

示例:
  node src/index.js --log-level debug --port 3000
  node src/index.js --config ./config/production.json

环境变量:
  NODE_ENV                运行环境 (development, production)
  PORT                    服务端口
  LOG_LEVEL               日志级别
  DB_HOST                 数据库主机
  JWT_SECRET              JWT密钥

更多信息请访问: https://github.com/your-username/modular-app
`);
}

// 主函数
async function main() {
    const options = parseArgs();

    if (options.help) {
        showHelp();
        process.exit(0);
    }

    try {
        // 验证配置
        const configValidation = validateConfig();
        if (!configValidation.isValid) {
            console.error('❌ 配置验证失败:');
            configValidation.errors.forEach(error => {
                console.error(`  - ${error}`);
            });
            process.exit(1);
        }

        // 创建应用实例
        const appConfig = {
            logger: {
                level: options.logLevel || getConfig('logger.level')
            },
            port: options.port || getConfig('app.port')
        };

        console.log('🚀 启动模块化应用...');
        console.log(`📋 配置: ${JSON.stringify(appConfig, null, 2)}`);

        const app = new ModularApp(appConfig);

        // 显示应用信息
        const status = app.getStatus();
        console.log('\n📊 应用状态:');
        console.log(`  名称: ${status.app.name}`);
        console.log(`  版本: ${status.app.version}`);
        console.log(`  环境: ${status.app.environment}`);
        console.log(`  运行时间: ${status.app.uptime.toFixed(2)}秒`);
        console.log(`  用户登录状态: ${status.user.isLoggedIn ? '已登录' : '未登录'}`);
        console.log(`  数据项数量: ${status.data.totalItems}`);

        // 设置优雅关闭
        process.on('SIGINT', async () => {
            console.log('\n🛑 收到中断信号，正在关闭应用...');
            await app.cleanup();
            console.log('✅ 应用已安全关闭');
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 收到终止信号，正在关闭应用...');
            await app.cleanup();
            console.log('✅ 应用已安全关闭');
            process.exit(0);
        });

        // 显示就绪信息
        console.log('\n✅ 应用启动完成！');
        console.log('💡 提示: 按 Ctrl+C 停止应用');
        console.log('📖 查看 examples/ 目录了解使用方法');

        // 保持进程运行
        setInterval(() => {
            // 定期输出状态信息（可选）
        }, 60000); // 每分钟

    } catch (error) {
        console.error('❌ 应用启动失败:', error.message);
        console.error('🔍 错误详情:', error.stack);
        process.exit(1);
    }
}

// 如果直接运行此文件，则启动应用
if (require.main === module) {
    main().catch(error => {
        console.error('💥 未处理的错误:', error);
        process.exit(1);
    });
}

module.exports = { main, parseArgs, showHelp };