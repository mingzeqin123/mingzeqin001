// 购物车管理功能
class CartManager {
    constructor() {
        this.init();
    }

    // 初始化
    init() {
        this.bindEvents();
        this.loadCart();
    }

    // 绑定事件监听器
    bindEvents() {
        // 清空购物车按钮
        const clearCartBtn = document.querySelector('[onclick="clearCart()"]');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }
    }

    // 加载购物车
    loadCart() {
        const cart = CartAPI.getCart();
        this.renderCart(cart);
        this.updateCartCounter();
    }

    // 渲染购物车
    renderCart(cart) {
        const container = document.getElementById('cartContainer');
        if (!container) return;

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>购物车为空</h3>
                    <p>快去添加一些商品吧！</p>
                    <button class="btn btn-primary" onclick="switchSection('products')">
                        <i class="fas fa-shopping-bag"></i> 去购物
                    </button>
                </div>
            `;
            return;
        }

        const total = CartAPI.getCartTotal();
        
        container.innerHTML = `
            <div class="cart-items">
                ${cart.map(item => `
                    <div class="cart-item" data-product-id="${item.product_id}">
                        <div class="cart-item-image">
                            ${item.image_url 
                                ? `<img src="${item.image_url}" alt="${item.name}" onerror="this.style.display='none'">`
                                : `<i class="fas fa-image"></i>`
                            }
                        </div>
                        <div class="cart-item-info">
                            <h4 class="cart-item-name">${item.name}</h4>
                            <div class="cart-item-price">${Utils.formatPrice(item.price)}</div>
                        </div>
                        <div class="cart-item-controls">
                            <div class="quantity-control">
                                <button onclick="updateCartQuantity(${item.product_id}, ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" value="${item.quantity}" min="1" 
                                       onchange="updateCartQuantity(${item.product_id}, this.value)">
                                <button onclick="updateCartQuantity(${item.product_id}, ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.product_id})">
                                <i class="fas fa-trash"></i> 删除
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="cart-total">
                <h3>总计: ${Utils.formatPrice(total)}</h3>
                <div class="cart-actions">
                    <button class="btn btn-primary" onclick="checkout()">
                        <i class="fas fa-credit-card"></i> 结算
                    </button>
                    <button class="btn btn-outline" onclick="clearCart()">
                        <i class="fas fa-trash"></i> 清空购物车
                    </button>
                </div>
            </div>
        `;
    }

    // 更新购物车商品数量
    updateCartQuantity(productId, quantity) {
        const cart = CartAPI.updateCartItem(productId, parseInt(quantity));
        this.renderCart(cart);
        this.updateCartCounter();
    }

    // 从购物车移除商品
    removeFromCart(productId) {
        if (!confirm('确定要从购物车中移除这个商品吗？')) {
            return;
        }

        const cart = CartAPI.removeFromCart(productId);
        this.renderCart(cart);
        this.updateCartCounter();
        Utils.showMessage('商品已从购物车移除', 'info');
    }

    // 清空购物车
    clearCart() {
        if (!confirm('确定要清空购物车吗？')) {
            return;
        }

        CartAPI.clearCart();
        this.renderCart([]);
        this.updateCartCounter();
        Utils.showMessage('购物车已清空', 'info');
    }

    // 更新购物车计数器
    updateCartCounter() {
        const count = CartAPI.getCartItemCount();
        const cartLink = document.querySelector('[data-section="cart"]');
        if (cartLink) {
            const existingBadge = cartLink.querySelector('.cart-badge');
            if (count > 0) {
                if (!existingBadge) {
                    const badge = document.createElement('span');
                    badge.className = 'cart-badge';
                    badge.textContent = count;
                    cartLink.appendChild(badge);
                } else {
                    existingBadge.textContent = count;
                }
            } else if (existingBadge) {
                existingBadge.remove();
            }
        }
    }

    // 结算
    async checkout() {
        if (!authManager.isLoggedIn()) {
            Utils.showMessage('请先登录', 'warning');
            authManager.showLoginModal();
            return;
        }

        const cart = CartAPI.getCart();
        if (cart.length === 0) {
            Utils.showMessage('购物车为空', 'warning');
            return;
        }

        // 获取收货地址
        const shippingAddress = prompt('请输入收货地址:');
        if (!shippingAddress) {
            Utils.showMessage('请输入收货地址', 'warning');
            return;
        }

        const paymentMethod = prompt('请选择支付方式 (credit_card/debit_card/paypal/alipay/wechat_pay):');
        if (!paymentMethod) {
            Utils.showMessage('请选择支付方式', 'warning');
            return;
        }

        try {
            Utils.showLoading();

            const orderData = {
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                shipping_address: shippingAddress,
                payment_method: paymentMethod,
                notes: '来自购物车的订单'
            };

            const response = await OrderAPI.createOrder(orderData);

            if (response.success) {
                Utils.showMessage('订单创建成功！', 'success');
                CartAPI.clearCart();
                this.loadCart();
                this.updateCartCounter();
                
                // 切换到订单页面
                switchSection('orders');
            }
        } catch (error) {
            console.error('创建订单失败:', error);
            Utils.showMessage(error.message || '创建订单失败', 'error');
        } finally {
            Utils.hideLoading();
        }
    }
}

// 创建全局购物车管理器实例
const cartManager = new CartManager();

// 全局函数
window.loadCart = () => cartManager.loadCart();
window.updateCartQuantity = (productId, quantity) => cartManager.updateCartQuantity(productId, quantity);
window.removeFromCart = (productId) => cartManager.removeFromCart(productId);
window.clearCart = () => cartManager.clearCart();
window.checkout = () => cartManager.checkout();

// 添加商品到购物车
async function addToCart(productId) {
    if (!authManager.isLoggedIn()) {
        Utils.showMessage('请先登录', 'warning');
        authManager.showLoginModal();
        return;
    }

    try {
        const response = await ProductAPI.getProductById(productId);
        if (response.success) {
            const product = response.data;
            
            // 检查库存
            if (product.stock_quantity <= 0) {
                Utils.showMessage('商品库存不足', 'warning');
                return;
            }

            CartAPI.addToCart(product);
            cartManager.updateCartCounter();
            Utils.showMessage('商品已添加到购物车', 'success');
        }
    } catch (error) {
        console.error('添加商品到购物车失败:', error);
        Utils.showMessage('添加商品失败', 'error');
    }
}

// 切换页面区域
function switchSection(sectionName) {
    // 隐藏所有区域
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // 显示目标区域
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
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
}

// 导出购物车管理器
window.cartManager = cartManager;