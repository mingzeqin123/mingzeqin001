# 页面PV/UV统计功能说明

## 功能概述

本功能为微信小程序添加了完整的页面访问统计（PV/UV）功能，可以统计每个页面的访问量和独立访客数。

## 主要特性

### 1. 统计功能
- **PV统计**：记录每个页面的访问次数
- **UV统计**：记录每个页面的独立访客数
- **会话管理**：30分钟会话超时机制
- **日统计**：按日期统计访问数据
- **实时统计**：页面访问时实时记录

### 2. 数据展示
- **总体统计**：显示总PV、总UV、页面数量
- **页面排行**：按访问量排序的页面列表
- **趋势图表**：最近7天访问趋势
- **日统计查询**：查询指定日期的统计数据

### 3. 数据管理
- **数据导出**：将统计数据导出为JSON格式
- **数据清除**：清除所有统计数据
- **数据持久化**：使用微信小程序本地存储

## 文件结构

```
utils/
├── stats.js          # 统计工具类
pages/
├── stats/
│   ├── stats.js      # 统计页面逻辑
│   ├── stats.wxml    # 统计页面模板
│   ├── stats.wxss    # 统计页面样式
│   └── stats.json    # 统计页面配置
```

## 使用方法

### 1. 在页面中记录访问

```javascript
// 在页面的 onLoad 方法中添加
onLoad() {
  // 记录页面访问
  const statsManager = getApp().globalData.statsManager
  if (statsManager) {
    statsManager.recordPageView('pageName', '页面标题')
  }
}
```

### 2. 获取统计数据

```javascript
// 获取总体统计
const overallStats = statsManager.getOverallStats()

// 获取页面统计
const pageStats = statsManager.getPageStats('pageName')

// 获取所有页面统计
const allPageStats = statsManager.getAllPageStats()

// 获取最近N天统计
const recentStats = statsManager.getRecentDaysStats(7)
```

### 3. 数据管理

```javascript
// 导出数据
const exportData = statsManager.exportStats()

// 清除数据
statsManager.clearStats()

// 导入数据
statsManager.importStats(data)
```

## 统计页面功能

### 1. 概览标签页
- 显示总体统计数据
- 最近7天访问趋势图表
- 所有页面的统计列表

### 2. 页面排行标签页
- 按PV排序的页面排行榜
- 显示每个页面的PV和UV数据

### 3. 日统计标签页
- 选择日期查询特定日期的统计
- 显示最近7天的详细数据

### 4. 操作功能
- **刷新数据**：重新加载最新统计数据
- **导出数据**：将数据复制到剪贴板
- **清除数据**：删除所有统计数据

## 技术实现

### 1. 会话管理
- 使用时间戳和随机字符串生成会话ID
- 30分钟会话超时机制
- 会话数据存储在本地存储中

### 2. 数据存储
- 使用微信小程序的 `wx.getStorageSync` 和 `wx.setStorageSync`
- 数据结构包含页面统计、日统计、总体统计等

### 3. 统计逻辑
- PV：每次页面访问都增加
- UV：同一会话在同一页面只计算一次
- 日统计：按日期分组统计

## 注意事项

1. **数据持久化**：统计数据存储在本地，清除小程序数据会丢失
2. **会话超时**：30分钟无活动后会话会过期
3. **性能考虑**：大量数据可能影响存储性能
4. **隐私保护**：不收集用户个人信息，只统计访问行为

## 扩展功能

可以根据需要扩展以下功能：
- 添加更多统计维度（停留时间、跳出率等）
- 实现数据云端同步
- 添加数据可视化图表
- 支持多维度筛选和排序