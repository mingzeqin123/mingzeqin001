/**
 * Sono接口使用示例
 * 展示各种API的实际使用场景
 */

const sonoInterface = require('./sono-interface.js');

/**
 * 示例1: 基础水印处理
 */
async function example1_basicWatermark() {
  console.log('=== 示例1: 基础水印处理 ===');
  
  try {
    // 初始化接口
    await sonoInterface.initialize();
    
    // 添加简单文字水印
    const imagePath = '/path/to/your/image.jpg';
    const result = await sonoInterface.watermark.addText(imagePath, {
      text: '© 2024 Sono',
      position: 'bottom-right',
      color: '#FFFFFF',
      fontSize: 18,
      opacity: 0.8
    });
    
    console.log('水印添加成功:', result);
    return result;
    
  } catch (error) {
    console.error('水印处理失败:', error.message);
  }
}

/**
 * 示例2: 批量水印处理
 */
async function example2_batchWatermark() {
  console.log('=== 示例2: 批量水印处理 ===');
  
  try {
    const imagePaths = [
      '/path/to/image1.jpg',
      '/path/to/image2.jpg',
      '/path/to/image3.jpg'
    ];
    
    const watermarkConfig = {
      type: 'text',
      text: '批量处理水印',
      position: 'bottom-left',
      color: '#FF0000',
      fontSize: 16,
      opacity: 0.7
    };
    
    const results = await sonoInterface.watermark.batchProcess(
      imagePaths,
      watermarkConfig,
      (progress) => {
        console.log(`处理进度: ${progress.completed}/${progress.total} (${Math.round(progress.progress * 100)}%)`);
      }
    );
    
    console.log('批量处理完成:', results);
    
    // 统计处理结果
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    console.log(`成功: ${successful}, 失败: ${failed}`);
    
    return results;
    
  } catch (error) {
    console.error('批量处理失败:', error.message);
  }
}

/**
 * 示例3: 图片水印处理
 */
async function example3_imageWatermark() {
  console.log('=== 示例3: 图片水印处理 ===');
  
  try {
    const originalImage = '/path/to/original.jpg';
    const watermarkImage = '/path/to/logo.png';
    
    const result = await sonoInterface.watermark.addImage(
      originalImage,
      watermarkImage,
      {
        position: 'top-right',
        width: 80,
        height: 40,
        opacity: 0.6
      }
    );
    
    console.log('图片水印添加成功:', result);
    return result;
    
  } catch (error) {
    console.error('图片水印处理失败:', error.message);
  }
}

/**
 * 示例4: 游戏引擎基础使用
 */
async function example4_gameEngine() {
  console.log('=== 示例4: 游戏引擎基础使用 ===');
  
  try {
    // 获取游戏工具函数
    const gameUtils = sonoInterface.gameEngine.getUtils();
    
    // 数学计算示例
    console.log('线性插值 lerp(0, 100, 0.5):', gameUtils.lerp(0, 100, 0.5));
    console.log('缓动函数 easeOutQuart(0.5):', gameUtils.easeOutQuart(0.5));
    console.log('3D距离计算:', gameUtils.distance3D(0, 0, 0, 3, 4, 5));
    
    // 创建游戏对象
    const player = sonoInterface.gameEngine.createPlayer({
      position: { x: 0, y: 0, z: 0 },
      color: '#FF6B6B'
    });
    
    const block = sonoInterface.gameEngine.createBlock({
      type: 'normal',
      position: { x: 2, y: 0, z: 0 },
      size: { width: 1, height: 0.2, depth: 1 },
      color: '#4ECDC4'
    });
    
    console.log('游戏对象创建成功');
    console.log('玩家:', player);
    console.log('方块:', block);
    
    return { player, block };
    
  } catch (error) {
    console.error('游戏引擎使用失败:', error.message);
  }
}

/**
 * 示例5: 工具函数使用
 */
async function example5_utilities() {
  console.log('=== 示例5: 工具函数使用 ===');
  
  try {
    const { math, easing, color } = sonoInterface.utils;
    
    // 数学工具
    console.log('数学工具示例:');
    console.log('  随机整数 randomInt(1, 10):', math.randomInt(1, 10));
    console.log('  限制范围 clamp(150, 0, 100):', math.clamp(150, 0, 100));
    console.log('  角度转弧度 degToRad(90):', math.degToRad(90));
    
    // 缓动函数
    console.log('缓动函数示例:');
    const t = 0.7;
    console.log(`  easeOutQuart(${t}):`, easing.easeOutQuart(t));
    console.log(`  easeInOutCubic(${t}):`, easing.easeInOutCubic(t));
    console.log(`  easeOutBounce(${t}):`, easing.easeOutBounce(t));
    
    // 颜色工具
    console.log('颜色工具示例:');
    const hexColor = '#FF5733';
    const rgbColor = color.hexToRgb(hexColor);
    console.log(`  hexToRgb('${hexColor}'):`, rgbColor);
    console.log('  rgbToHex(255, 87, 51):', color.rgbToHex(255, 87, 51));
    console.log('  随机颜色:', color.randomColor());
    
    // 性能监控
    console.log('性能监控示例:');
    const monitor = sonoInterface.utils.performance.createMonitor();
    
    monitor.start('calculation');
    // 模拟一些计算
    for (let i = 0; i < 1000000; i++) {
      Math.sqrt(i);
    }
    monitor.end('calculation');
    
    const stats = monitor.getStats();
    console.log('  计算耗时:', stats.calculation);
    
  } catch (error) {
    console.error('工具函数使用失败:', error.message);
  }
}

/**
 * 示例6: 存储API使用
 */
async function example6_storage() {
  console.log('=== 示例6: 存储API使用 ===');
  
  try {
    const storage = sonoInterface.storage;
    
    // 存储不同类型的数据
    await storage.set('userName', 'Alice');
    await storage.set('userScore', 1500);
    await storage.set('gameSettings', {
      volume: 0.8,
      difficulty: 'hard',
      enableSounds: true
    });
    
    // 读取数据
    const userName = await storage.get('userName');
    const userScore = await storage.get('userScore', 0);
    const settings = await storage.get('gameSettings', {});
    const nonExistent = await storage.get('nonExistent', 'default');
    
    console.log('存储的数据:');
    console.log('  用户名:', userName);
    console.log('  用户分数:', userScore);
    console.log('  游戏设置:', settings);
    console.log('  不存在的键(使用默认值):', nonExistent);
    
    // 删除特定数据
    await storage.remove('userName');
    const deletedUser = await storage.get('userName', '未找到');
    console.log('删除后的用户名:', deletedUser);
    
  } catch (error) {
    console.error('存储API使用失败:', error.message);
  }
}

/**
 * 示例7: 事件系统使用
 */
async function example7_events() {
  console.log('=== 示例7: 事件系统使用 ===');
  
  try {
    const events = sonoInterface.events;
    
    // 定义事件处理器
    const gameStartHandler = (data) => {
      console.log('游戏开始事件:', data);
    };
    
    const scoreUpdateHandler = (score) => {
      console.log('分数更新:', score);
    };
    
    const gameEndHandler = (finalScore) => {
      console.log('游戏结束，最终分数:', finalScore);
    };
    
    // 注册事件监听器
    events.on('gameStart', gameStartHandler);
    events.on('scoreUpdate', scoreUpdateHandler);
    events.once('gameEnd', gameEndHandler); // 只监听一次
    
    // 模拟游戏流程
    console.log('模拟游戏流程:');
    
    // 游戏开始
    events.emit('gameStart', { 
      player: 'Alice', 
      level: 1, 
      timestamp: new Date().toISOString() 
    });
    
    // 分数更新
    events.emit('scoreUpdate', 100);
    events.emit('scoreUpdate', 250);
    events.emit('scoreUpdate', 400);
    
    // 游戏结束
    events.emit('gameEnd', 400);
    
    // 再次触发游戏结束（不会被处理，因为使用了once）
    events.emit('gameEnd', 500);
    
    // 移除事件监听器
    events.off('gameStart', gameStartHandler);
    events.off('scoreUpdate', scoreUpdateHandler);
    
    console.log('事件监听器已移除');
    
  } catch (error) {
    console.error('事件系统使用失败:', error.message);
  }
}

/**
 * 示例8: 综合应用场景
 */
async function example8_comprehensive() {
  console.log('=== 示例8: 综合应用场景 ===');
  
  try {
    // 场景：为游戏截图批量添加水印并保存设置
    
    // 1. 初始化并获取预设配置
    await sonoInterface.initialize();
    const presets = sonoInterface.watermark.getPresets();
    console.log('可用的水印位置:', presets.positions);
    
    // 2. 设置游戏配置
    const gameConfig = {
      playerName: 'Player1',
      bestScore: 0,
      watermarkStyle: 'medium'
    };
    await sonoInterface.storage.set('gameConfig', gameConfig);
    
    // 3. 创建性能监控
    const monitor = sonoInterface.utils.performance.createMonitor();
    
    // 4. 模拟游戏截图处理
    const screenshots = [
      '/screenshots/level1.jpg',
      '/screenshots/level2.jpg',
      '/screenshots/boss.jpg'
    ];
    
    monitor.start('watermarkBatch');
    
    const watermarkConfig = {
      type: 'text',
      text: `${gameConfig.playerName} - 最高分: ${gameConfig.bestScore}`,
      ...presets.textStyles[gameConfig.watermarkStyle],
      position: 'bottom-right'
    };
    
    // 使用事件监听处理进度
    sonoInterface.events.on('batchProgress', (progress) => {
      console.log(`水印处理进度: ${Math.round(progress * 100)}%`);
    });
    
    const results = await sonoInterface.watermark.batchProcess(
      screenshots,
      watermarkConfig,
      (progress) => {
        sonoInterface.events.emit('batchProgress', progress.progress);
      }
    );
    
    monitor.end('watermarkBatch');
    
    // 5. 保存处理结果
    const processedImages = results
      .filter(r => r.success)
      .map(r => r.watermarked);
    
    await sonoInterface.storage.set('processedScreenshots', processedImages);
    
    // 6. 获取性能统计
    const stats = monitor.getStats();
    console.log('批量处理性能统计:', stats);
    
    // 7. 更新游戏配置
    const updatedConfig = await sonoInterface.storage.get('gameConfig');
    updatedConfig.lastProcessTime = new Date().toISOString();
    updatedConfig.processedCount = processedImages.length;
    await sonoInterface.storage.set('gameConfig', updatedConfig);
    
    console.log('综合应用场景完成');
    console.log('处理结果:', {
      totalImages: screenshots.length,
      successfullyProcessed: processedImages.length,
      processingTime: stats.watermarkBatch,
      savedConfig: updatedConfig
    });
    
    return {
      processedImages,
      stats,
      config: updatedConfig
    };
    
  } catch (error) {
    console.error('综合应用场景失败:', error.message);
  }
}

/**
 * 运行所有示例
 */
async function runAllExamples() {
  console.log('🚀 开始运行Sono接口示例\n');
  
  const examples = [
    example1_basicWatermark,
    example2_batchWatermark,
    example3_imageWatermark,
    example4_gameEngine,
    example5_utilities,
    example6_storage,
    example7_events,
    example8_comprehensive
  ];
  
  for (let i = 0; i < examples.length; i++) {
    try {
      await examples[i]();
      console.log('✅ 示例完成\n');
    } catch (error) {
      console.error('❌ 示例失败:', error.message, '\n');
    }
    
    // 在示例之间添加延迟
    if (i < examples.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('🎉 所有示例运行完成');
}

// 导出示例函数
module.exports = {
  example1_basicWatermark,
  example2_batchWatermark,
  example3_imageWatermark,
  example4_gameEngine,
  example5_utilities,
  example6_storage,
  example7_events,
  example8_comprehensive,
  runAllExamples
};

// 如果直接运行此文件，则执行所有示例
if (require.main === module) {
  runAllExamples().catch(console.error);
}