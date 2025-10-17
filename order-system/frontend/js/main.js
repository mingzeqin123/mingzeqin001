// 主应用逻辑
class OrderSystemApp {
    constructor() {
        this.currentSection = 'home';
        this.init();
    }

    // 初始化应用
    init() {
        this.bindEvents();
        this.loadInitialData();
    }

    // 绑定事件监听器
    bindEvents() {
        // 导航菜单切换
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        // 移动端菜单切换
        const navToggle = document.getElementById('navToggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                const navMenu = document.getElementById('navMenu');
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // 页面加载完成后的初始化
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeApp();
        });
    }

    // 初始化应用
    async initializeApp() {
        try {
            // 检查用户登录状态
            if (authManager.isLoggedIn()) {
                await authManager.validateToken();
            }

            // 加载初始数据
            await this.loadInitialData();
        } catch (error) {
            console.error('应用初始化失败:', error);
        }
    }

    // 加载初始数据
    async loadInitialData() {
        try {
            // 加载首页统计
            await this.loadHomeStats();
            
            // 加载商品分类
            if (productManager) {
                await productManager.loadCategories();
            }
        } catch (error) {
            console.error('加载初始数据失败:', error);
        }
    }

    // 加载首页统计
    async loadHomeStats() {
        try {
            if (!authManager.isLoggedIn()) {
                this.updateHomeStats({
                    total_products: 0,
                    total_orders: 0,
                    total_users: 0,
                    total_revenue: 0
                });
                return;
            }

            // 加载商品统计
            const productsResponse = await ProductAPI.getProducts({ limit: 1 });
            const totalProducts = productsResponse.data.pagination.total;

            // 加载订单统计
            const ordersResponse = await OrderAPI.getOrderStats();
            const stats = ordersResponse.data;

            this.updateHomeStats({
                total_products: totalProducts,
                total_orders: stats.total_orders || 0,
                total_users: 0, // 需要用户管理API
                total_revenue: stats.total_revenue || 0
            });
        } catch (error) {
            console.error('加载首页统计失败:', error);
            this.updateHomeStats({
                total_products: 0,
                total_orders: 0,
                total_users: 0,
                total_revenue: 0
            });
        }
    }

    // 更新首页统计显示
    updateHomeStats(stats) {
        const elements = {
            totalProducts: document.getElementById('totalProducts'),
            totalOrders: document.getElementById('totalOrders'),
            totalUsers: document.getElementById('totalUsers'),
            totalRevenue: document.getElementById('totalRevenue')
        };

        if (elements.totalProducts) {
            elements.totalProducts.textContent = stats.total_products || 0;
        }
        if (elements.totalOrders) {
            elements.totalOrders.textContent = stats.total_orders || 0;
        }
        if (elements.totalUsers) {
            elements.totalUsers.textContent = stats.total_users || 0;
        }
        if (elements.totalRevenue) {
            elements.totalRevenue.textContent = Utils.formatPrice(stats.total_revenue || 0);
        }
    }

    // 切换页面区域
    switchSection(sectionName) {
        // 隐藏所有区域
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // 显示目标区域
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
        }

        // 更新导航链接状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const targetLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }

        // 关闭移动端菜单
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.classList.remove('active');
        }

        // 根据区域加载相应数据
        this.loadSectionData(sectionName);
    }

    // 根据区域加载数据
    async loadSectionData(sectionName) {
        try {
            switch (sectionName) {
                case 'home':
                    await this.loadHomeStats();
                    break;
                case 'products':
                    if (productManager) {
                        await productManager.loadProducts();
                    }
                    break;
                case 'orders':
                    if (orderManager) {
                        await orderManager.loadOrders();
                    }
                    break;
                case 'cart':
                    if (cartManager) {
                        cartManager.loadCart();
                    }
                    break;
            }
        } catch (error) {
            console.error(`加载${sectionName}数据失败:`, error);
        }
    }

    // 刷新当前页面数据
    async refreshCurrentSection() {
        await this.loadSectionData(this.currentSection);
    }
}

// 创建全局应用实例
const app = new OrderSystemApp();

// 全局函数
window.switchSection = (sectionName) => app.switchSection(sectionName);
window.refreshHomeStats = () => app.loadHomeStats();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('订单管理系统已加载');
});

// 导出应用实例
window.app = app;