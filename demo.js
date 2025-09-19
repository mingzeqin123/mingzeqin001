/**
 * 防恶意评论系统演示脚本
 * 展示各种防刷机制的工作原理
 */

console.log('🛡️  防恶意评论系统演示');
console.log('=' .repeat(50));

// 模拟防刷工具类
const AntiSpamUtil = require('./utils/antiSpam.js');

// 演示数据
const demoComments = [
  '这个游戏很有趣，画面也很精美！',
  '操作简单，适合休闲娱乐。',
  '希望能增加更多关卡。',
  '垃圾游戏，浪费时间！',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  '微信加我：1234567890',
  '代练刷分，联系QQ：123456789',
  '这个游戏很有趣，画面也很精美！', // 重复内容
  'a', // 过短内容
  '!!!!!!!!!!!!!!!!!!!!' // 过多特殊字符
];

console.log('\n📝 测试评论内容:');
demoComments.forEach((comment, index) => {
  console.log(`${index + 1}. ${comment}`);
});

console.log('\n🔍 开始内容检测...\n');

// 1. 敏感词检测演示
console.log('1️⃣ 敏感词检测:');
demoComments.forEach((comment, index) => {
  const hasSensitive = AntiSpamUtil.containsSensitiveWords(comment);
  const status = hasSensitive ? '❌ 包含敏感词' : '✅ 正常';
  console.log(`   评论${index + 1}: ${status}`);
});

// 2. 内容质量检测演示
console.log('\n2️⃣ 内容质量检测:');
demoComments.forEach((comment, index) => {
  const quality = AntiSpamUtil.calculateContentQuality(comment);
  const level = quality > 0.7 ? '高' : quality > 0.3 ? '中' : '低';
  const status = quality > 0.3 ? '✅ 通过' : '❌ 质量过低';
  console.log(`   评论${index + 1}: 质量${level}(${quality.toFixed(2)}) ${status}`);
});

// 3. 垃圾内容检测演示
console.log('\n3️⃣ 垃圾内容检测:');
demoComments.forEach(async (comment, index) => {
  const isSpam = await AntiSpamUtil.detectSpam(comment);
  const status = isSpam ? '❌ 垃圾内容' : '✅ 正常内容';
  console.log(`   评论${index + 1}: ${status}`);
});

// 4. 重复内容检测演示
console.log('\n4️⃣ 重复内容检测:');
const existingComments = demoComments.slice(0, 3); // 模拟已有评论
for (let i = 3; i < demoComments.length; i++) {
  const isDuplicate = AntiSpamUtil.isDuplicateContent(demoComments[i], existingComments);
  const status = isDuplicate ? '❌ 重复内容' : '✅ 原创内容';
  console.log(`   评论${i + 1}: ${status}`);
}

// 5. 标签提取演示
console.log('\n5️⃣ 标签提取:');
demoComments.forEach((comment, index) => {
  const tags = AntiSpamUtil.extractTags(comment);
  console.log(`   评论${index + 1}: [${tags.join(', ') || '无标签'}]`);
});

// 6. 用户行为分析演示
console.log('\n6️⃣ 用户行为分析:');
const mockUserBehavior = {
  commentCount: 15,
  lastCommentTime: Date.now() - 300000, // 5分钟前
  suspiciousActions: 2,
  ipAddress: '192.168.1.100',
  deviceFingerprint: 'iPhone_12_iOS_15'
};

const behaviorCheck = AntiSpamUtil.checkUserBehavior(mockUserBehavior);
console.log(`   用户评论数: ${mockUserBehavior.commentCount}`);
console.log(`   可疑行为数: ${mockUserBehavior.suspiciousActions}`);
console.log(`   行为评估: ${behaviorCheck.isAbnormal ? '❌ 异常' : '✅ 正常'}`);
if (behaviorCheck.reasons.length > 0) {
  console.log(`   异常原因: ${behaviorCheck.reasons.join(', ')}`);
}
console.log(`   风险等级: ${behaviorCheck.riskLevel}`);

// 7. 风险评估演示
console.log('\n7️⃣ 综合风险评估:');
const testComment = '这个游戏很有趣，画面也很精美！';
const riskAssessment = AntiSpamUtil.generateRiskAssessment(testComment, mockUserBehavior);
console.log(`   评论内容: "${testComment}"`);
console.log(`   内容风险: ${riskAssessment.contentRisk}`);
console.log(`   行为风险: ${riskAssessment.behaviorRisk}`);
console.log(`   总体风险: ${riskAssessment.overallRisk}`);
console.log(`   风险分数: ${riskAssessment.score}/100`);
if (riskAssessment.recommendations.length > 0) {
  console.log(`   建议措施: ${riskAssessment.recommendations.join(', ')}`);
}

// 8. 批量检测演示
console.log('\n8️⃣ 批量内容检测:');
AntiSpamUtil.batchDetectSpam(demoComments.slice(0, 5)).then(results => {
  console.log('   批量检测结果:');
  results.forEach((result, index) => {
    const status = result.isSpam ? '❌ 垃圾' : '✅ 正常';
    console.log(`     评论${index + 1}: ${status} (质量: ${result.qualityScore.toFixed(2)})`);
  });
});

// 9. 统计信息演示
console.log('\n9️⃣ 统计信息分析:');
const mockComments = [
  { content: '好游戏', timestamp: Date.now() - 3600000, quality: 0.8 },
  { content: '不错', timestamp: Date.now() - 7200000, quality: 0.6 },
  { content: '垃圾', timestamp: Date.now() - 10800000, quality: 0.2 },
  { content: '推荐', timestamp: Date.now() - 14400000, quality: 0.9 }
];

const stats = AntiSpamUtil.getStatistics(mockComments);
console.log(`   总评论数: ${stats.totalComments}`);
console.log(`   垃圾评论数: ${stats.spamCount}`);
console.log(`   平均质量: ${stats.averageQuality.toFixed(2)}`);
console.log(`   质量分布:`);
console.log(`     高质量 (>0.7): ${stats.qualityDistribution.high}`);
console.log(`     中等质量 (0.3-0.7): ${stats.qualityDistribution.medium}`);
console.log(`     低质量 (<0.3): ${stats.qualityDistribution.low}`);

// 10. 防刷建议演示
console.log('\n🔟 防刷建议:');
const recommendations = AntiSpamUtil.getAntiSpamRecommendations(riskAssessment);
console.log('   系统建议:');
recommendations.forEach((rec, index) => {
  console.log(`     ${index + 1}. ${rec}`);
});

console.log('\n' + '='.repeat(50));
console.log('🎉 演示完成！');
console.log('\n📋 系统特性总结:');
console.log('✅ 实时敏感词检测');
console.log('✅ 智能内容质量评估');
console.log('✅ 垃圾内容模式识别');
console.log('✅ 重复内容检测');
console.log('✅ 用户行为分析');
console.log('✅ 综合风险评估');
console.log('✅ 批量内容处理');
console.log('✅ 统计分析报告');
console.log('✅ 智能防刷建议');

console.log('\n🚀 如何使用:');
console.log('1. 前端: 在微信小程序中访问评论页面');
console.log('2. 后端: 运行 node server/server.js 启动服务');
console.log('3. 测试: 运行 node server/test.js 进行功能测试');
console.log('4. 文档: 查看 docs/anti-spam-guide.md 了解详细实现');

console.log('\n💡 提示:');
console.log('- 可以根据实际需求调整敏感词库和检测阈值');
console.log('- 建议定期更新垃圾内容检测模式');
console.log('- 监控用户行为数据，优化防刷策略');
console.log('- 结合机器学习算法提升检测准确性');