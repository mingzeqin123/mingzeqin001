// 订单管理功能
class OrderManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentStatus = '';
        this.isAdmin = false;
        this.init();
    }

    // 初始化
    init() {
        this.isAdmin = authManager.isAdmin();
        this.bindEvents();
        this.loadOrders();
    }

    // 绑定事件监听器
    bindEvents() {
        // 状态筛选
        const statusFilter = document.getElementById('orderStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentStatus = e.target.value;
                this.currentPage = 1;
                this.loadOrders();
            });
        }

        // 刷新按钮
        const refreshBtn = document.querySelector('[onclick="refreshOrders()"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadOrders());
        }
    }

    // 加载订单列表
    async loadOrders() {
        try {
            Utils.showLoading();
            
            const params = {
                page: this.currentPage,
                limit: this.pageSize,
                ...(this.currentStatus && { status: this.currentStatus })
            };

            const response = this.isAdmin 
                ? await OrderAPI.getAllOrders(params)
                : await OrderAPI.getUserOrders(params);
                
            this.renderOrders(response.data.orders);
            this.renderPagination(response.data.pagination, 'ordersPagination');
        } catch (error) {
            console.error('加载订单失败:', error);
            Utils.showMessage('加载订单失败', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // 渲染订单列表
    renderOrders(orders) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-file-invoice"></i>
                        <p>暂无订单</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>
                    <a href="#" onclick="viewOrderDetail('${order.order_number}')" class="order-link">
                        ${order.order_number}
                    </a>
                </td>
                <td>${order.full_name || order.username}</td>
                <td>${Utils.formatPrice(order.total_amount)}</td>
                <td>
                    <span class="status-badge ${Utils.getStatusClass(order.status)}">
                        ${Utils.formatOrderStatus(order.status)}
                    </span>
                </td>
                <td>${Utils.formatDate(order.created_at)}</td>
                <td>
                    <div class="order-actions">
                        <button class="btn btn-primary btn-sm" onclick="viewOrderDetail('${order.order_number}')">
                            <i class="fas fa-eye"></i> 查看
                        </button>
                        ${this.isAdmin ? `
                            <button class="btn btn-warning btn-sm" onclick="updateOrderStatus(${order.id})">
                                <i class="fas fa-edit"></i> 更新状态
                            </button>
                        ` : ''}
                        ${['pending', 'confirmed'].includes(order.status) ? `
                            <button class="btn btn-danger btn-sm" onclick="cancelOrder(${order.id})">
                                <i class="fas fa-times"></i> 取消
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // 渲染分页
    renderPagination(pagination, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !pagination) return;

        const { page, pages, total } = pagination;
        
        if (pages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // 上一页按钮
        paginationHTML += `
            <button ${page <= 1 ? 'disabled' : ''} onclick="goToOrderPage(${page - 1})">
                <i class="fas fa-chevron-left"></i> 上一页
            </button>
        `;

        // 页码按钮
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        if (startPage > 1) {
            paginationHTML += `<button onclick="goToOrderPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span>...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="${i === page ? 'active' : ''}" onclick="goToOrderPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < pages) {
            if (endPage < pages - 1) {
                paginationHTML += `<span>...</span>`;
            }
            paginationHTML += `<button onclick="goToOrderPage(${pages})">${pages}</button>`;
        }

        // 下一页按钮
        paginationHTML += `
            <button ${page >= pages ? 'disabled' : ''} onclick="goToOrderPage(${page + 1})">
                下一页 <i class="fas fa-chevron-right"></i>
            </button>
        `;

        container.innerHTML = paginationHTML;
    }

    // 查看订单详情
    async viewOrderDetail(orderNumber) {
        try {
            Utils.showLoading();
            
            const response = await OrderAPI.getOrderByNumber(orderNumber);
            
            if (response.success) {
                this.renderOrderDetail(response.data);
                authManager.showModal('orderDetailModal');
            }
        } catch (error) {
            console.error('获取订单详情失败:', error);
            Utils.showMessage('获取订单详情失败', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // 渲染订单详情
    renderOrderDetail(order) {
        const content = document.getElementById('orderDetailContent');
        if (!content) return;

        content.innerHTML = `
            <div class="order-detail">
                <div class="order-header">
                    <h3>订单信息</h3>
                    <div class="order-status">
                        <span class="status-badge ${Utils.getStatusClass(order.status)}">
                            ${Utils.formatOrderStatus(order.status)}
                        </span>
                    </div>
                </div>
                
                <div class="order-info">
                    <div class="info-row">
                        <label>订单号:</label>
                        <span>${order.order_number}</span>
                    </div>
                    <div class="info-row">
                        <label>客户:</label>
                        <span>${order.full_name || order.username} (${order.email})</span>
                    </div>
                    <div class="info-row">
                        <label>电话:</label>
                        <span>${order.phone || '未提供'}</span>
                    </div>
                    <div class="info-row">
                        <label>总金额:</label>
                        <span class="price">${Utils.formatPrice(order.total_amount)}</span>
                    </div>
                    <div class="info-row">
                        <label>支付方式:</label>
                        <span>${order.payment_method || '未选择'}</span>
                    </div>
                    <div class="info-row">
                        <label>创建时间:</label>
                        <span>${Utils.formatDate(order.created_at)}</span>
                    </div>
                </div>

                <div class="shipping-info">
                    <h4>收货地址</h4>
                    <p>${order.shipping_address}</p>
                </div>

                <div class="order-items">
                    <h4>商品清单</h4>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>商品名称</th>
                                <th>单价</th>
                                <th>数量</th>
                                <th>小计</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.product_name}</td>
                                    <td>${Utils.formatPrice(item.unit_price)}</td>
                                    <td>${item.quantity}</td>
                                    <td>${Utils.formatPrice(item.total_price)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${order.notes ? `
                    <div class="order-notes">
                        <h4>备注</h4>
                        <p>${order.notes}</p>
                    </div>
                ` : ''}

                <div class="order-actions">
                    ${this.isAdmin ? `
                        <button class="btn btn-warning" onclick="updateOrderStatus(${order.id})">
                            <i class="fas fa-edit"></i> 更新状态
                        </button>
                    ` : ''}
                    ${['pending', 'confirmed'].includes(order.status) ? `
                        <button class="btn btn-danger" onclick="cancelOrder(${order.id})">
                            <i class="fas fa-times"></i> 取消订单
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // 更新订单状态
    async updateOrderStatus(orderId) {
        if (!this.isAdmin) {
            Utils.showMessage('权限不足', 'error');
            return;
        }

        const status = prompt('请输入新状态 (pending/confirmed/processing/shipped/delivered/cancelled):');
        if (!status) return;

        const notes = prompt('请输入备注 (可选):');

        try {
            Utils.showLoading();
            
            const response = await OrderAPI.updateOrderStatus(orderId, status, notes);
            
            if (response.success) {
                Utils.showMessage('订单状态更新成功！', 'success');
                this.loadOrders();
                authManager.closeModal('orderDetailModal');
            }
        } catch (error) {
            console.error('更新订单状态失败:', error);
            Utils.showMessage(error.message || '更新订单状态失败', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // 取消订单
    async cancelOrder(orderId) {
        if (!confirm('确定要取消这个订单吗？')) {
            return;
        }

        try {
            Utils.showLoading();
            
            const response = await OrderAPI.cancelOrder(orderId);
            
            if (response.success) {
                Utils.showMessage('订单取消成功！', 'success');
                this.loadOrders();
                authManager.closeModal('orderDetailModal');
            }
        } catch (error) {
            console.error('取消订单失败:', error);
            Utils.showMessage(error.message || '取消订单失败', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // 跳转到指定页面
    goToPage(page) {
        this.currentPage = page;
        this.loadOrders();
    }
}

// 创建全局订单管理器实例
const orderManager = new OrderManager();

// 全局函数
window.loadOrders = () => orderManager.loadOrders();
window.refreshOrders = () => orderManager.loadOrders();
window.viewOrderDetail = (orderNumber) => orderManager.viewOrderDetail(orderNumber);
window.updateOrderStatus = (orderId) => orderManager.updateOrderStatus(orderId);
window.cancelOrder = (orderId) => orderManager.cancelOrder(orderId);
window.goToOrderPage = (page) => orderManager.goToPage(page);

// 导出订单管理器
window.orderManager = orderManager;