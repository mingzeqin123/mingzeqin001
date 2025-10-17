/**
 * 商品数据模型
 * 商品管理相关数据结构定义
 */

// 商品状态枚举
const PRODUCT_STATUS = {
  DRAFT: 'draft',           // 草稿
  ACTIVE: 'active',         // 上架
  INACTIVE: 'inactive',     // 下架
  DELETED: 'deleted'        // 已删除
}

// 商品类型枚举
const PRODUCT_TYPE = {
  PHYSICAL: 'physical',     // 实物商品
  VIRTUAL: 'virtual',       // 虚拟商品
  SERVICE: 'service'        // 服务商品
}

/**
 * 商品模型类
 */
class Product {
  constructor(data = {}) {
    this.id = data.id || this.generateProductId()
    this.name = data.name || ''
    this.description = data.description || ''
    this.shortDescription = data.shortDescription || ''
    this.categoryId = data.categoryId || ''
    this.categoryName = data.categoryName || ''
    this.brand = data.brand || ''
    this.type = data.type || PRODUCT_TYPE.PHYSICAL
    this.status = data.status || PRODUCT_STATUS.DRAFT
    this.images = data.images || []
    this.mainImage = data.mainImage || ''
    this.price = data.price || 0
    this.originalPrice = data.originalPrice || 0
    this.costPrice = data.costPrice || 0
    this.stock = data.stock || 0
    this.minStock = data.minStock || 0
    this.maxPurchase = data.maxPurchase || 999
    this.weight = data.weight || 0
    this.volume = data.volume || 0
    this.specifications = data.specifications || []
    this.skus = data.skus || []
    this.attributes = data.attributes || []
    this.tags = data.tags || []
    this.seoTitle = data.seoTitle || ''
    this.seoKeywords = data.seoKeywords || ''
    this.seoDescription = data.seoDescription || ''
    this.salesCount = data.salesCount || 0
    this.viewCount = data.viewCount || 0
    this.favoriteCount = data.favoriteCount || 0
    this.rating = data.rating || 0
    this.reviewCount = data.reviewCount || 0
    this.isRecommended = data.isRecommended || false
    this.isHot = data.isHot || false
    this.isNew = data.isNew || false
    this.sortOrder = data.sortOrder || 0
    this.createTime = data.createTime || new Date().toISOString()
    this.updateTime = data.updateTime || new Date().toISOString()
    this.publishTime = data.publishTime || null
  }

  /**
   * 生成商品ID
   */
  generateProductId() {
    return 'PRD' + Date.now().toString() + Math.random().toString(36).substr(2, 6)
  }

  /**
   * 添加商品图片
   */
  addImage(imageUrl) {
    if (!this.images.includes(imageUrl)) {
      this.images.push(imageUrl)
      if (!this.mainImage) {
        this.mainImage = imageUrl
      }
      this.updateTime = new Date().toISOString()
    }
  }

  /**
   * 设置主图
   */
  setMainImage(imageUrl) {
    if (this.images.includes(imageUrl)) {
      this.mainImage = imageUrl
      this.updateTime = new Date().toISOString()
    }
  }

  /**
   * 添加SKU
   */
  addSku(sku) {
    const existingSku = this.skus.find(s => s.id === sku.id)
    if (!existingSku) {
      this.skus.push(new ProductSku(sku))
      this.updateTime = new Date().toISOString()
    }
  }

  /**
   * 更新库存
   */
  updateStock(quantity, skuId = null) {
    if (skuId) {
      const sku = this.skus.find(s => s.id === skuId)
      if (sku) {
        sku.updateStock(quantity)
      }
    } else {
      this.stock = Math.max(0, this.stock + quantity)
    }
    this.updateTime = new Date().toISOString()
  }

  /**
   * 检查库存是否充足
   */
  checkStock(quantity = 1, skuId = null) {
    if (skuId) {
      const sku = this.skus.find(s => s.id === skuId)
      return sku ? sku.stock >= quantity : false
    }
    return this.stock >= quantity
  }

  /**
   * 获取可用库存
   */
  getAvailableStock(skuId = null) {
    if (skuId) {
      const sku = this.skus.find(s => s.id === skuId)
      return sku ? sku.stock : 0
    }
    return this.stock
  }

  /**
   * 获取商品价格
   */
  getPrice(skuId = null) {
    if (skuId) {
      const sku = this.skus.find(s => s.id === skuId)
      return sku ? sku.price : this.price
    }
    return this.price
  }

  /**
   * 获取商品原价
   */
  getOriginalPrice(skuId = null) {
    if (skuId) {
      const sku = this.skus.find(s => s.id === skuId)
      return sku ? sku.originalPrice : this.originalPrice
    }
    return this.originalPrice
  }

  /**
   * 计算折扣率
   */
  getDiscountRate(skuId = null) {
    const price = this.getPrice(skuId)
    const originalPrice = this.getOriginalPrice(skuId)
    if (originalPrice > 0 && price < originalPrice) {
      return Math.round((1 - price / originalPrice) * 100)
    }
    return 0
  }

  /**
   * 上架商品
   */
  publish() {
    if (this.status === PRODUCT_STATUS.DRAFT) {
      this.status = PRODUCT_STATUS.ACTIVE
      this.publishTime = new Date().toISOString()
      this.updateTime = new Date().toISOString()
    }
  }

  /**
   * 下架商品
   */
  unpublish() {
    if (this.status === PRODUCT_STATUS.ACTIVE) {
      this.status = PRODUCT_STATUS.INACTIVE
      this.updateTime = new Date().toISOString()
    }
  }

  /**
   * 增加销量
   */
  increaseSales(quantity = 1) {
    this.salesCount += quantity
    this.updateTime = new Date().toISOString()
  }

  /**
   * 增加浏览量
   */
  increaseViews() {
    this.viewCount += 1
    this.updateTime = new Date().toISOString()
  }

  /**
   * 更新评分
   */
  updateRating(newRating, reviewCount) {
    this.rating = newRating
    this.reviewCount = reviewCount
    this.updateTime = new Date().toISOString()
  }

  /**
   * 验证商品数据
   */
  validate() {
    const errors = []
    
    if (!this.name.trim()) {
      errors.push('商品名称不能为空')
    }
    
    if (this.price < 0) {
      errors.push('商品价格不能为负数')
    }
    
    if (this.stock < 0) {
      errors.push('商品库存不能为负数')
    }
    
    if (!this.categoryId) {
      errors.push('商品分类不能为空')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      shortDescription: this.shortDescription,
      categoryId: this.categoryId,
      categoryName: this.categoryName,
      brand: this.brand,
      type: this.type,
      status: this.status,
      images: this.images,
      mainImage: this.mainImage,
      price: this.price,
      originalPrice: this.originalPrice,
      costPrice: this.costPrice,
      stock: this.stock,
      minStock: this.minStock,
      maxPurchase: this.maxPurchase,
      weight: this.weight,
      volume: this.volume,
      specifications: this.specifications,
      skus: this.skus.map(sku => sku.toJSON()),
      attributes: this.attributes,
      tags: this.tags,
      seoTitle: this.seoTitle,
      seoKeywords: this.seoKeywords,
      seoDescription: this.seoDescription,
      salesCount: this.salesCount,
      viewCount: this.viewCount,
      favoriteCount: this.favoriteCount,
      rating: this.rating,
      reviewCount: this.reviewCount,
      isRecommended: this.isRecommended,
      isHot: this.isHot,
      isNew: this.isNew,
      sortOrder: this.sortOrder,
      createTime: this.createTime,
      updateTime: this.updateTime,
      publishTime: this.publishTime
    }
  }
}

/**
 * 商品SKU模型类
 */
class ProductSku {
  constructor(data = {}) {
    this.id = data.id || this.generateSkuId()
    this.productId = data.productId || ''
    this.skuCode = data.skuCode || ''
    this.name = data.name || ''
    this.image = data.image || ''
    this.price = data.price || 0
    this.originalPrice = data.originalPrice || 0
    this.costPrice = data.costPrice || 0
    this.stock = data.stock || 0
    this.weight = data.weight || 0
    this.volume = data.volume || 0
    this.specifications = data.specifications || []
    this.barcode = data.barcode || ''
    this.status = data.status || PRODUCT_STATUS.ACTIVE
    this.createTime = data.createTime || new Date().toISOString()
    this.updateTime = data.updateTime || new Date().toISOString()
  }

  /**
   * 生成SKU ID
   */
  generateSkuId() {
    return 'SKU' + Date.now().toString() + Math.random().toString(36).substr(2, 6)
  }

  /**
   * 更新库存
   */
  updateStock(quantity) {
    this.stock = Math.max(0, this.stock + quantity)
    this.updateTime = new Date().toISOString()
  }

  /**
   * 获取规格描述
   */
  getSpecificationText() {
    return this.specifications.map(spec => `${spec.name}:${spec.value}`).join('; ')
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      id: this.id,
      productId: this.productId,
      skuCode: this.skuCode,
      name: this.name,
      image: this.image,
      price: this.price,
      originalPrice: this.originalPrice,
      costPrice: this.costPrice,
      stock: this.stock,
      weight: this.weight,
      volume: this.volume,
      specifications: this.specifications,
      barcode: this.barcode,
      status: this.status,
      createTime: this.createTime,
      updateTime: this.updateTime
    }
  }
}

/**
 * 商品分类模型类
 */
class ProductCategory {
  constructor(data = {}) {
    this.id = data.id || this.generateCategoryId()
    this.name = data.name || ''
    this.description = data.description || ''
    this.parentId = data.parentId || ''
    this.level = data.level || 1
    this.image = data.image || ''
    this.icon = data.icon || ''
    this.sortOrder = data.sortOrder || 0
    this.isVisible = data.isVisible !== undefined ? data.isVisible : true
    this.seoTitle = data.seoTitle || ''
    this.seoKeywords = data.seoKeywords || ''
    this.seoDescription = data.seoDescription || ''
    this.createTime = data.createTime || new Date().toISOString()
    this.updateTime = data.updateTime || new Date().toISOString()
  }

  /**
   * 生成分类ID
   */
  generateCategoryId() {
    return 'CAT' + Date.now().toString() + Math.random().toString(36).substr(2, 6)
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      parentId: this.parentId,
      level: this.level,
      image: this.image,
      icon: this.icon,
      sortOrder: this.sortOrder,
      isVisible: this.isVisible,
      seoTitle: this.seoTitle,
      seoKeywords: this.seoKeywords,
      seoDescription: this.seoDescription,
      createTime: this.createTime,
      updateTime: this.updateTime
    }
  }
}

module.exports = {
  Product,
  ProductSku,
  ProductCategory,
  PRODUCT_STATUS,
  PRODUCT_TYPE
}