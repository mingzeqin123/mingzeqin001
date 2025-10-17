// API配置
const API_BASE_URL = 'http://localhost:3000/api';

// 通用API请求函数
class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('token');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    // GET请求
    static async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url);
    }

    // POST请求
    static async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT请求
    static async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE请求
    static async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// 认证相关API
const AuthAPI = {
    // 用户注册
    register: (userData) => API.post('/auth/register', userData),
    
    // 用户登录
    login: (credentials) => API.post('/auth/login', credentials),
    
    // 获取用户信息
    getProfile: () => API.get('/auth/profile'),
    
    // 更新用户信息
    updateProfile: (userData) => API.put('/auth/profile', userData),
    
    // 刷新令牌
    refreshToken: () => API.post('/auth/refresh')
};

// 商品相关API
const ProductAPI = {
    // 获取商品列表
    getProducts: (params = {}) => API.get('/products', params),
    
    // 获取商品详情
    getProductById: (id) => API.get(`/products/${id}`),
    
    // 创建商品
    createProduct: (productData) => API.post('/products', productData),
    
    // 更新商品
    updateProduct: (id, productData) => API.put(`/products/${id}`, productData),
    
    // 删除商品
    deleteProduct: (id) => API.delete(`/products/${id}`),
    
    // 更新商品库存
    updateStock: (id, quantity) => API.put(`/products/${id}/stock`, { quantity }),
    
    // 获取商品分类
    getCategories: () => API.get('/products/categories/list'),
    
    // 创建商品分类
    createCategory: (categoryData) => API.post('/products/categories', categoryData)
};

// 订单相关API
const OrderAPI = {
    // 创建订单
    createOrder: (orderData) => API.post('/orders', orderData),
    
    // 获取订单详情
    getOrderById: (id) => API.get(`/orders/${id}`),
    
    // 根据订单号获取订单
    getOrderByNumber: (orderNumber) => API.get(`/orders/number/${orderNumber}`),
    
    // 获取用户订单列表
    getUserOrders: (params = {}) => API.get('/orders', params),
    
    // 获取所有订单列表（管理员）
    getAllOrders: (params = {}) => API.get('/orders/admin/all', params),
    
    // 更新订单状态
    updateOrderStatus: (id, status, notes) => API.put(`/orders/${id}/status`, { status, notes }),
    
    // 取消订单
    cancelOrder: (id) => API.put(`/orders/${id}/cancel`),
    
    // 获取订单状态历史
    getOrderStatusHistory: (id) => API.get(`/orders/${id}/history`),
    
    // 获取订单统计
    getOrderStats: (params = {}) => API.get('/orders/admin/stats', params)
};

// 购物车相关API（本地存储实现）
const CartAPI = {
    // 获取购物车
    getCart: () => {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    },
    
    // 保存购物车
    saveCart: (cart) => {
        localStorage.setItem('cart', JSON.stringify(cart));
    },
    
    // 添加商品到购物车
    addToCart: (product, quantity = 1) => {
        const cart = CartAPI.getCart();
        const existingItem = cart.find(item => item.product_id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                product_id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                quantity: quantity
            });
        }
        
        CartAPI.saveCart(cart);
        return cart;
    },
    
    // 更新购物车商品数量
    updateCartItem: (productId, quantity) => {
        const cart = CartAPI.getCart();
        const item = cart.find(item => item.product_id === productId);
        
        if (item) {
            if (quantity <= 0) {
                CartAPI.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                CartAPI.saveCart(cart);
            }
        }
        
        return CartAPI.getCart();
    },
    
    // 从购物车移除商品
    removeFromCart: (productId) => {
        const cart = CartAPI.getCart();
        const filteredCart = cart.filter(item => item.product_id !== productId);
        CartAPI.saveCart(filteredCart);
        return filteredCart;
    },
    
    // 清空购物车
    clearCart: () => {
        CartAPI.saveCart([]);
        return [];
    },
    
    // 获取购物车总金额
    getCartTotal: () => {
        const cart = CartAPI.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    // 获取购物车商品数量
    getCartItemCount: () => {
        const cart = CartAPI.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    }
};

// 工具函数
const Utils = {
    // 显示加载状态
    showLoading: () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'block';
        }
    },
    
    // 隐藏加载状态
    hideLoading: () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },
    
    // 显示消息提示
    showMessage: (message, type = 'info') => {
        const container = document.getElementById('messageContainer');
        if (!container) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        container.appendChild(messageEl);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    },
    
    // 格式化价格
    formatPrice: (price) => {
        return `¥${parseFloat(price).toFixed(2)}`;
    },
    
    // 格式化日期
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    },
    
    // 格式化订单状态
    formatOrderStatus: (status) => {
        const statusMap = {
            'pending': '待确认',
            'confirmed': '已确认',
            'processing': '处理中',
            'shipped': '已发货',
            'delivered': '已送达',
            'cancelled': '已取消',
            'refunded': '已退款'
        };
        return statusMap[status] || status;
    },
    
    // 获取状态样式类
    getStatusClass: (status) => {
        return `status-${status}`;
    },
    
    // 防抖函数
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// 导出API对象
window.API = API;
window.AuthAPI = AuthAPI;
window.ProductAPI = ProductAPI;
window.OrderAPI = OrderAPI;
window.CartAPI = CartAPI;
window.Utils = Utils;