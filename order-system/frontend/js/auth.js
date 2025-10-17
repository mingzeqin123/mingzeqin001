// 认证相关功能
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    // 初始化
    init() {
        // 检查本地存储的token
        const token = localStorage.getItem('token');
        if (token) {
            this.validateToken();
        }
        
        // 绑定事件监听器
        this.bindEvents();
    }

    // 绑定事件监听器
    bindEvents() {
        // 登录表单提交
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // 注册表单提交
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    // 验证token有效性
    async validateToken() {
        try {
            const response = await AuthAPI.getProfile();
            this.currentUser = response.data;
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Token验证失败:', error);
            this.logout();
            return false;
        }
    }

    // 处理登录
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            Utils.showLoading();
            
            const response = await AuthAPI.login({ email, password });
            
            if (response.success) {
                // 保存token和用户信息
                localStorage.setItem('token', response.data.token);
                this.currentUser = response.data.user;
                
                // 更新UI
                this.updateUI();
                
                // 关闭登录模态框
                this.closeModal('loginModal');
                
                // 清空表单
                document.getElementById('loginForm').reset();
                
                Utils.showMessage('登录成功！', 'success');
                
                // 刷新页面数据
                this.refreshPageData();
            }
        } catch (error) {
            console.error('登录失败:', error);
            Utils.showMessage(error.message || '登录失败', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // 处理注册
    async handleRegister(e) {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('registerUsername').value,
            email: document.getElementById('registerEmail').value,
            password: document.getElementById('registerPassword').value,
            full_name: document.getElementById('registerFullName').value,
            phone: document.getElementById('registerPhone').value
        };

        try {
            Utils.showLoading();
            
            const response = await AuthAPI.register(formData);
            
            if (response.success) {
                // 保存token和用户信息
                localStorage.setItem('token', response.data.token);
                this.currentUser = response.data.user;
                
                // 更新UI
                this.updateUI();
                
                // 关闭注册模态框
                this.closeModal('registerModal');
                
                // 清空表单
                document.getElementById('registerForm').reset();
                
                Utils.showMessage('注册成功！', 'success');
                
                // 刷新页面数据
                this.refreshPageData();
            }
        } catch (error) {
            console.error('注册失败:', error);
            Utils.showMessage(error.message || '注册失败', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // 登出
    logout() {
        // 清除本地存储
        localStorage.removeItem('token');
        this.currentUser = null;
        
        // 更新UI
        this.updateUI();
        
        // 清空购物车
        CartAPI.clearCart();
        
        Utils.showMessage('已退出登录', 'info');
    }

    // 更新UI
    updateUI() {
        const userInfo = document.getElementById('userInfo');
        const loginSection = document.getElementById('loginSection');
        const userName = document.getElementById('userName');

        if (this.currentUser) {
            // 显示用户信息
            if (userInfo) userInfo.style.display = 'flex';
            if (loginSection) loginSection.style.display = 'none';
            if (userName) userName.textContent = this.currentUser.full_name || this.currentUser.username;
        } else {
            // 显示登录按钮
            if (userInfo) userInfo.style.display = 'none';
            if (loginSection) loginSection.style.display = 'flex';
        }
    }

    // 显示登录模态框
    showLoginModal() {
        this.showModal('loginModal');
    }

    // 显示注册模态框
    showRegisterModal() {
        this.showModal('registerModal');
    }

    // 显示模态框
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    // 关闭模态框
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // 刷新页面数据
    async refreshPageData() {
        try {
            // 刷新首页统计
            if (typeof refreshHomeStats === 'function') {
                await refreshHomeStats();
            }
            
            // 刷新商品列表
            if (typeof loadProducts === 'function') {
                await loadProducts();
            }
            
            // 刷新订单列表
            if (typeof loadOrders === 'function') {
                await loadOrders();
            }
            
            // 刷新购物车
            if (typeof loadCart === 'function') {
                loadCart();
            }
        } catch (error) {
            console.error('刷新页面数据失败:', error);
        }
    }

    // 检查用户权限
    hasRole(role) {
        if (!this.currentUser) return false;
        return this.currentUser.role === role;
    }

    // 检查是否为管理员
    isAdmin() {
        return this.hasRole('admin');
    }

    // 检查是否为员工
    isStaff() {
        return this.hasRole('staff') || this.isAdmin();
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 检查是否已登录
    isLoggedIn() {
        return !!this.currentUser;
    }
}

// 创建全局认证管理器实例
const authManager = new AuthManager();

// 全局函数
window.showLoginModal = () => authManager.showLoginModal();
window.showRegisterModal = () => authManager.showRegisterModal();
window.logout = () => authManager.logout();
window.closeModal = (modalId) => authManager.closeModal(modalId);

// 点击模态框外部关闭
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        if (modalId) {
            authManager.closeModal(modalId);
        }
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                authManager.closeModal(modal.id);
            }
        });
    }
});

// 导出认证管理器
window.authManager = authManager;