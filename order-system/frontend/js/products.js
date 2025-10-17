// 商品管理功能
class ProductManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 12;
        this.currentCategory = '';
        this.currentSearch = '';
        this.categories = [];
        this.init();
    }

    // 初始化
    init() {
        this.bindEvents();
        this.loadCategories();
        this.loadProducts();
    }

    // 绑定事件监听器
    bindEvents() {
        // 搜索框
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.currentSearch = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            }, 500));
        }

        // 分类筛选
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            });
        }

        // 添加商品表单
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', (e) => this.handleAddProduct(e));
        }
    }

    // 加载商品分类
    async loadCategories() {
        try {
            const response = await ProductAPI.getCategories();
            this.categories = response.data;
            this.renderCategoryFilter();
            this.renderAddProductCategories();
        } catch (error) {
            console.error('加载分类失败:', error);
            Utils.showMessage('加载分类失败', 'error');
        }
    }

    // 渲染分类筛选器
    renderCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        categoryFilter.innerHTML = '<option value="">所有分类</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    // 渲染添加商品分类选择器
    renderAddProductCategories() {
        const productCategory = document.getElementById('productCategory');
        if (!productCategory) return;

        productCategory.innerHTML = '<option value="">选择分类</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            productCategory.appendChild(option);
        });
    }

    // 加载商品列表
    async loadProducts() {
        try {
            Utils.showLoading();
            
            const params = {
                page: this.currentPage,
                limit: this.pageSize,
                ...(this.currentCategory && { category_id: this.currentCategory }),
                ...(this.currentSearch && { search: this.currentSearch })
            };

            const response = await ProductAPI.getProducts(params);
            this.renderProducts(response.data.products);
            this.renderPagination(response.data.pagination, 'productsPagination');
        } catch (error) {
            console.error('加载商品失败:', error);
            Utils.showMessage('加载商品失败', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // 渲染商品列表
    renderProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (products.length === 0) {
            productsGrid.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-box-open"></i>
                    <p>暂无商品</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    ${product.image_url 
                        ? `<img src="${product.image_url}" alt="${product.name}" onerror="this.style.display='none'">`
                        : `<i class="fas fa-image"></i>`
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description || '暂无描述'}</p>
                    <div class="product-price">${Utils.formatPrice(product.price)}</div>
                    <div class="product-stock">库存: ${product.stock_quantity}</div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-sm" onclick="addToCart(${product.id})">
                            <i class="fas fa-cart-plus"></i> 加入购物车
                        </button>
                        ${authManager.isAdmin() ? `
                            <button class="btn btn-warning btn-sm" onclick="editProduct(${product.id})">
                                <i class="fas fa-edit"></i> 编辑
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i> 删除
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
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
            <button ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})">
                <i class="fas fa-chevron-left"></i> 上一页
            </button>
        `;

        // 页码按钮
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        if (startPage > 1) {
            paginationHTML += `<button onclick="goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span>...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="${i === page ? 'active' : ''}" onclick="goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < pages) {
            if (endPage < pages - 1) {
                paginationHTML += `<span>...</span>`;
            }
            paginationHTML += `<button onclick="goToPage(${pages})">${pages}</button>`;
        }

        // 下一页按钮
        paginationHTML += `
            <button ${page >= pages ? 'disabled' : ''} onclick="goToPage(${page + 1})">
                下一页 <i class="fas fa-chevron-right"></i>
            </button>
        `;

        container.innerHTML = paginationHTML;
    }

    // 处理添加商品
    async handleAddProduct(e) {
        e.preventDefault();
        
        if (!authManager.isAdmin()) {
            Utils.showMessage('权限不足', 'error');
            return;
        }

        const formData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock_quantity: parseInt(document.getElementById('productStock').value),
            category_id: document.getElementById('productCategory').value || null,
            sku: document.getElementById('productSku').value || null,
            image_url: document.getElementById('productImageUrl').value || null
        };

        try {
            Utils.showLoading();
            
            const response = await ProductAPI.createProduct(formData);
            
            if (response.success) {
                Utils.showMessage('商品添加成功！', 'success');
                authManager.closeModal('addProductModal');
                document.getElementById('addProductForm').reset();
                this.loadProducts();
            }
        } catch (error) {
            console.error('添加商品失败:', error);
            Utils.showMessage(error.message || '添加商品失败', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // 显示添加商品模态框
    showAddProductModal() {
        if (!authManager.isAdmin()) {
            Utils.showMessage('权限不足', 'error');
            return;
        }
        authManager.showModal('addProductModal');
    }

    // 编辑商品
    async editProduct(productId) {
        if (!authManager.isAdmin()) {
            Utils.showMessage('权限不足', 'error');
            return;
        }

        try {
            const response = await ProductAPI.getProductById(productId);
            if (response.success) {
                // 填充编辑表单（这里可以创建一个编辑模态框）
                Utils.showMessage('编辑功能开发中...', 'info');
            }
        } catch (error) {
            console.error('获取商品详情失败:', error);
            Utils.showMessage('获取商品详情失败', 'error');
        }
    }

    // 删除商品
    async deleteProduct(productId) {
        if (!authManager.isAdmin()) {
            Utils.showMessage('权限不足', 'error');
            return;
        }

        if (!confirm('确定要删除这个商品吗？')) {
            return;
        }

        try {
            Utils.showLoading();
            
            const response = await ProductAPI.deleteProduct(productId);
            
            if (response.success) {
                Utils.showMessage('商品删除成功！', 'success');
                this.loadProducts();
            }
        } catch (error) {
            console.error('删除商品失败:', error);
            Utils.showMessage(error.message || '删除商品失败', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // 跳转到指定页面
    goToPage(page) {
        this.currentPage = page;
        this.loadProducts();
    }
}

// 创建全局商品管理器实例
const productManager = new ProductManager();

// 全局函数
window.loadProducts = () => productManager.loadProducts();
window.showAddProductModal = () => productManager.showAddProductModal();
window.editProduct = (id) => productManager.editProduct(id);
window.deleteProduct = (id) => productManager.deleteProduct(id);
window.goToPage = (page) => productManager.goToPage(page);

// 导出商品管理器
window.productManager = productManager;