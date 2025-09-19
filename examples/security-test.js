/**
 * 安全防护测试示例
 * 演示如何使用API安全防护功能
 */

const apiProtection = require('../utils/apiProtection')
const securityConfig = require('../utils/securityConfig')

// 测试用例
class SecurityTest {
  constructor() {
    this.testResults = []
  }

  // 运行所有测试
  async runAllTests() {
    console.log('开始运行安全防护测试...\n')
    
    await this.testRateLimit()
    await this.testBehaviorAnalysis()
    await this.testAutoBan()
    await this.testConfiguration()
    await this.testMonitoring()
    
    this.printResults()
  }

  // 测试限流功能
  async testRateLimit() {
    console.log('测试限流功能...')
    
    const requestInfo = {
      ip: '192.168.1.100',
      userId: 'testuser123',
      deviceId: 'testdevice456',
      endpoint: '/api/test',
      userAgent: 'Test-Agent/1.0',
      referer: 'https://test.com'
    }

    const protectedAPI = apiProtection.createProtectedEndpoint('/api/test', async (reqInfo) => {
      return { success: true, message: '测试成功' }
    })

    // 正常请求
    try {
      const result = await protectedAPI(requestInfo)
      this.addResult('限流测试-正常请求', result.success, '正常请求应该通过')
    } catch (error) {
      this.addResult('限流测试-正常请求', false, `正常请求失败: ${error.message}`)
    }

    // 高频请求测试
    console.log('  测试高频请求...')
    let blockedCount = 0
    for (let i = 0; i < 100; i++) {
      try {
        const result = await protectedAPI(requestInfo)
        if (!result.success) {
          blockedCount++
        }
      } catch (error) {
        blockedCount++
      }
    }
    
    this.addResult('限流测试-高频请求', blockedCount > 0, `高频请求被阻止: ${blockedCount}/100`)
  }

  // 测试行为分析
  async testBehaviorAnalysis() {
    console.log('测试行为分析...')
    
    const requestInfo = {
      ip: '192.168.1.200',
      userId: 'anomalyuser',
      deviceId: 'anomalydevice',
      endpoint: '/api/test',
      userAgent: 'Suspicious-Bot/1.0',
      referer: 'https://suspicious.com'
    }

    const protectedAPI = apiProtection.createProtectedEndpoint('/api/test', async (reqInfo) => {
      return { success: true, message: '测试成功' }
    })

    // 模拟异常行为
    for (let i = 0; i < 50; i++) {
      try {
        await protectedAPI(requestInfo)
      } catch (error) {
        // 忽略错误，继续测试
      }
    }

    // 检查是否检测到异常
    const stats = apiProtection.getSecurityStats()
    const anomalyCount = stats.monitor.anomalies?.detected || 0
    
    this.addResult('行为分析测试', anomalyCount > 0, `检测到异常行为: ${anomalyCount}次`)
  }

  // 测试自动封禁
  async testAutoBan() {
    console.log('测试自动封禁...')
    
    const requestInfo = {
      ip: '192.168.1.300',
      userId: 'malicioususer',
      deviceId: 'maliciousdevice',
      endpoint: '/api/test',
      userAgent: 'Malicious-Bot/1.0',
      referer: 'https://malicious.com'
    }

    const protectedAPI = apiProtection.createProtectedEndpoint('/api/test', async (reqInfo) => {
      return { success: true, message: '测试成功' }
    })

    // 模拟恶意行为
    for (let i = 0; i < 20; i++) {
      try {
        await protectedAPI(requestInfo)
      } catch (error) {
        // 忽略错误，继续测试
      }
    }

    // 检查是否被封禁
    const stats = apiProtection.getSecurityStats()
    const bannedIPs = stats.middleware?.bannedIPs || 0
    
    this.addResult('自动封禁测试', bannedIPs > 0, `检测到封禁: ${bannedIPs}个IP`)
  }

  // 测试配置管理
  async testConfiguration() {
    console.log('测试配置管理...')
    
    // 测试配置设置
    const originalValue = securityConfig.get('rateLimit.maxRequests')
    securityConfig.set('rateLimit.maxRequests', 10)
    const newValue = securityConfig.get('rateLimit.maxRequests')
    
    this.addResult('配置管理-设置配置', newValue === 10, `配置设置成功: ${newValue}`)
    
    // 恢复原配置
    securityConfig.set('rateLimit.maxRequests', originalValue)
    
    // 测试接口特定配置
    securityConfig.setEndpointConfig('/api/test', {
      rateLimit: {
        maxRequests: 5
      }
    })
    
    const endpointConfig = securityConfig.getEndpointConfig('/api/test')
    this.addResult('配置管理-接口配置', endpointConfig.rateLimit?.maxRequests === 5, '接口配置设置成功')
  }

  // 测试监控功能
  async testMonitoring() {
    console.log('测试监控功能...')
    
    const stats = apiProtection.getSecurityStats()
    const realTimeStats = apiProtection.getSecurityStats().realTime
    
    this.addResult('监控功能-统计信息', stats !== null, '获取统计信息成功')
    this.addResult('监控功能-实时统计', realTimeStats !== null, '获取实时统计成功')
    
    // 测试手动封禁
    apiProtection.ban('ip', '192.168.1.999', '测试封禁', 60000)
    const statsAfterBan = apiProtection.getSecurityStats()
    
    this.addResult('监控功能-手动封禁', statsAfterBan.middleware?.bannedIPs > 0, '手动封禁成功')
  }

  // 添加测试结果
  addResult(testName, passed, message) {
    this.testResults.push({
      name: testName,
      passed,
      message
    })
    
    const status = passed ? '✅ 通过' : '❌ 失败'
    console.log(`  ${status}: ${testName} - ${message}`)
  }

  // 打印测试结果
  printResults() {
    console.log('\n=== 测试结果汇总 ===')
    
    const passed = this.testResults.filter(r => r.passed).length
    const total = this.testResults.length
    
    console.log(`总计: ${total} 个测试`)
    console.log(`通过: ${passed} 个`)
    console.log(`失败: ${total - passed} 个`)
    console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`)
    
    if (total - passed > 0) {
      console.log('\n失败的测试:')
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.name}: ${r.message}`))
    }
  }
}

// 运行测试
if (require.main === module) {
  const test = new SecurityTest()
  test.runAllTests().catch(console.error)
}

module.exports = SecurityTest