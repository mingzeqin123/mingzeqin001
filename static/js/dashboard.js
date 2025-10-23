// 服务器监控大屏JavaScript

class ServerDashboard {
    constructor() {
        this.charts = {};
        this.updateInterval = 10000; // 10秒更新一次
        this.maxDataPoints = 20; // 图表最多显示20个数据点
        this.historyData = [];
        
        this.init();
    }
    
    init() {
        this.initCharts();
        this.startAutoUpdate();
        this.loadInitialData();
        
        // 添加错误处理
        window.addEventListener('error', (e) => {
            console.error('Dashboard error:', e.error);
        });
    }
    
    // 初始化图表
    initCharts() {
        // CPU和内存使用率趋势图
        const usageCtx = document.getElementById('usage-chart').getContext('2d');
        this.charts.usage = new Chart(usageCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'CPU使用率 (%)',
                        data: [],
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: '内存使用率 (%)',
                        data: [],
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            maxTicksLimit: 10
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
        
        // 磁盘使用情况饼图
        const diskCtx = document.getElementById('disk-chart').getContext('2d');
        this.charts.disk = new Chart(diskCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#ff6b6b',
                        '#4ecdc4',
                        '#ffe66d',
                        '#a8e6cf',
                        '#ffa726',
                        '#ab47bc'
                    ],
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            padding: 20
                        }
                    }
                }
            }
        });
    }
    
    // 加载初始数据
    async loadInitialData() {
        try {
            await this.updateMetrics();
            await this.loadHistoryData();
        } catch (error) {
            console.error('加载初始数据失败:', error);
            this.showError('加载数据失败，请检查服务器连接');
        }
    }
    
    // 加载历史数据
    async loadHistoryData() {
        try {
            const response = await axios.get('/api/metrics/history?limit=20');
            if (response.data.success) {
                this.historyData = response.data.data;
                this.updateCharts();
            }
        } catch (error) {
            console.error('加载历史数据失败:', error);
        }
    }
    
    // 更新指标数据
    async updateMetrics() {
        try {
            const response = await axios.get('/api/metrics');
            if (response.data.success) {
                const metrics = response.data.data;
                this.updateUI(metrics);
                
                // 添加到历史数据
                this.historyData.push(metrics);
                if (this.historyData.length > this.maxDataPoints) {
                    this.historyData.shift();
                }
                
                this.updateCharts();
                this.updateStatus('online');
            }
        } catch (error) {
            console.error('更新指标失败:', error);
            this.updateStatus('offline');
            throw error;
        }
    }
    
    // 更新UI界面
    updateUI(metrics) {
        // 更新头部信息
        document.getElementById('server-name').textContent = metrics.server_name;
        document.getElementById('last-update').textContent = `最后更新: ${metrics.timestamp}`;
        
        // 更新CPU信息
        const cpu = metrics.cpu;
        document.getElementById('cpu-usage').textContent = `${cpu.usage_percent}%`;
        document.getElementById('cpu-cores').textContent = cpu.count_physical;
        document.getElementById('cpu-logical').textContent = cpu.count_logical;
        document.getElementById('cpu-freq').textContent = `${cpu.frequency_mhz} MHz`;
        document.getElementById('cpu-progress').style.width = `${cpu.usage_percent}%`;
        
        // 设置CPU使用率颜色
        const cpuElement = document.getElementById('cpu-usage');
        this.setUsageColor(cpuElement, cpu.usage_percent);
        
        // 更新内存信息
        const memory = metrics.memory;
        document.getElementById('memory-usage').textContent = `${memory.usage_percent}%`;
        document.getElementById('memory-total').textContent = `${memory.total_gb} GB`;
        document.getElementById('memory-used').textContent = `${memory.used_gb} GB`;
        document.getElementById('memory-available').textContent = `${memory.available_gb} GB`;
        document.getElementById('memory-progress').style.width = `${memory.usage_percent}%`;
        
        // 设置内存使用率颜色
        const memoryElement = document.getElementById('memory-usage');
        this.setUsageColor(memoryElement, memory.usage_percent);
        
        // 更新磁盘信息
        this.updateDiskInfo(metrics.disk);
        
        // 更新网络信息
        const network = metrics.network;
        document.getElementById('network-sent').textContent = `${(network.bytes_sent / (1024 * 1024)).toFixed(2)} MB`;
        document.getElementById('network-recv').textContent = `${(network.bytes_recv / (1024 * 1024)).toFixed(2)} MB`;
        document.getElementById('packets-sent').textContent = network.packets_sent.toLocaleString();
        document.getElementById('packets-recv').textContent = network.packets_recv.toLocaleString();
        
        // 更新系统信息
        const system = metrics.system;
        document.getElementById('hostname').textContent = system.hostname;
        document.getElementById('platform').textContent = system.platform;
        document.getElementById('processor').textContent = system.processor || 'Unknown';
        document.getElementById('boot-time').textContent = system.boot_time;
        document.getElementById('uptime').textContent = `${system.uptime_hours} 小时`;
    }
    
    // 更新磁盘信息
    updateDiskInfo(diskData) {
        const diskList = document.getElementById('disk-list');
        diskList.innerHTML = '';
        
        diskData.forEach(disk => {
            const diskItem = document.createElement('div');
            diskItem.className = 'disk-item';
            
            diskItem.innerHTML = `
                <div class="disk-header">
                    <span>${disk.device} (${disk.mountpoint})</span>
                    <span class="disk-usage ${this.getUsageClass(disk.usage_percent)}">${disk.usage_percent}%</span>
                </div>
                <div class="detail-item">
                    <span>已使用: ${disk.used_gb} GB / ${disk.total_gb} GB</span>
                    <span>可用: ${disk.free_gb} GB</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill disk-progress" style="width: ${disk.usage_percent}%"></div>
                </div>
            `;
            
            diskList.appendChild(diskItem);
        });
    }
    
    // 更新图表
    updateCharts() {
        if (this.historyData.length === 0) return;
        
        // 更新趋势图
        const labels = this.historyData.map(item => {
            const time = new Date(item.timestamp);
            return time.toLocaleTimeString();
        });
        
        const cpuData = this.historyData.map(item => item.cpu.usage_percent);
        const memoryData = this.historyData.map(item => item.memory.usage_percent);
        
        this.charts.usage.data.labels = labels;
        this.charts.usage.data.datasets[0].data = cpuData;
        this.charts.usage.data.datasets[1].data = memoryData;
        this.charts.usage.update('none');
        
        // 更新磁盘饼图
        if (this.historyData.length > 0) {
            const latestDisk = this.historyData[this.historyData.length - 1].disk;
            const diskLabels = latestDisk.map(disk => `${disk.device} (${disk.usage_percent}%)`);
            const diskData = latestDisk.map(disk => disk.used_gb);
            
            this.charts.disk.data.labels = diskLabels;
            this.charts.disk.data.datasets[0].data = diskData;
            this.charts.disk.update('none');
        }
    }
    
    // 设置使用率颜色
    setUsageColor(element, percentage) {
        element.className = element.className.replace(/\b(success|warning|danger)\b/g, '');
        
        if (percentage < 60) {
            element.classList.add('success');
        } else if (percentage < 80) {
            element.classList.add('warning');
        } else {
            element.classList.add('danger');
        }
    }
    
    // 获取使用率样式类
    getUsageClass(percentage) {
        if (percentage < 60) return 'success';
        if (percentage < 80) return 'warning';
        return 'danger';
    }
    
    // 更新连接状态
    updateStatus(status) {
        const indicator = document.getElementById('status-indicator');
        const dot = indicator.querySelector('.status-dot');
        const text = indicator.querySelector('span:last-child');
        
        if (status === 'online') {
            indicator.style.background = 'rgba(0, 255, 136, 0.2)';
            indicator.style.borderColor = '#00ff88';
            dot.style.background = '#00ff88';
            text.textContent = '在线';
        } else {
            indicator.style.background = 'rgba(255, 107, 107, 0.2)';
            indicator.style.borderColor = '#ff6b6b';
            dot.style.background = '#ff6b6b';
            text.textContent = '离线';
        }
    }
    
    // 显示错误信息
    showError(message) {
        // 这里可以添加更复杂的错误显示逻辑
        console.error(message);
        
        // 简单的错误提示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        
        // 可以添加到页面顶部
        document.querySelector('.dashboard').prepend(errorDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
    
    // 开始自动更新
    startAutoUpdate() {
        setInterval(async () => {
            try {
                await this.updateMetrics();
            } catch (error) {
                console.error('自动更新失败:', error);
            }
        }, this.updateInterval);
    }
}

// 页面加载完成后初始化仪表板
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ServerDashboard();
});

// 添加页面可见性检测，当页面不可见时停止更新
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('页面隐藏，暂停更新');
    } else {
        console.log('页面显示，恢复更新');
        if (window.dashboard) {
            window.dashboard.updateMetrics();
        }
    }
});