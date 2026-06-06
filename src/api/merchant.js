import request from '@/utils/request'

// ========== 认证相关 ==========
export function merchantLogin(data) {
  return request({ url: '/auth/merchant/login', method: 'post', data })
}

export function merchantRegister(data) {
  return request({ url: '/auth/merchant/register', method: 'post', data })
}

export function merchantLogout() {
  return request({ url: '/auth/logout', method: 'post' })
}

// ========== 商品管理（mall-service）==========
export function getProducts(params) {
  return request({ url: '/mall/product/merchant', method: 'get', params: params || {} })
}

export function createProduct(data) {
  return request({ url: '/mall/product/create', method: 'post', data })
}

export function updateProduct(id, data) {
  return request({ url: `/mall/product/update/${id}`, method: 'put', data })
}

export function deleteProduct(id) {
  return request({ url: `/mall/product/delete/${id}`, method: 'delete' })
}

// 切换商品上架/下架状态
export function toggleProductStatus(id) {
  // 先获取当前商品信息再翻转状态
  // 简化实现：直接调用 update 并翻转 status
  return request({ url: `/mall/product/detail/${id}`, method: 'get' }).then(res => {
    const product = res.data
    const newStatus = product.status === 1 ? 0 : 1
    return request({
      url: `/mall/product/update/${id}`,
      method: 'put',
      data: { ...product, status: newStatus }
    })
  })
}

// ========== 订单管理（mall-service）==========
export function getMerchantOrders(params) {
  return request({ url: '/mall/order/list', method: 'get', params: params || {} })
}

export function getMerchantOrderDetail(orderId) {
  return request({ url: `/mall/order/detail/${orderId}`, method: 'get' })
}

export function shipMerchantOrder(orderId) {
  return request({ url: `/mall/order/ship/${orderId}`, method: 'post' })
}

export function cancelMerchantOrder(orderId) {
  return request({ url: `/mall/order/cancel/${orderId}`, method: 'post' })
}

// ========== 统计数据（商家首页仪表盘，后端暂无独立接口）==========

// 将后端返回的 createTime 统一转为 ISO 日期字符串 "YYYY-MM-DD"
function normalizeDate(ct) {
  if (!ct) return null
  // 数组格式 [2026,6,5,10,30,0] (Jackson 默认序列化)
  if (Array.isArray(ct) && ct.length >= 3) {
    const [y, m, d] = ct
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  // 字符串格式 "2026-06-05T10:30:00" 或 "2026-06-05"
  if (typeof ct === 'string') {
    return ct.substring(0, 10)
  }
  return null
}

export function getMerchantStats() {
  // 聚合商品和订单信息生成统计
  return Promise.all([
    request({ url: '/mall/product/merchant', method: 'get' }),
    request({ url: '/mall/order/list', method: 'get' })
  ]).then(([productRes, orderRes]) => {
    const products = productRes.data || []
    const orders = orderRes.data || []
    const today = new Date().toISOString().split('T')[0]

    // 过滤已取消的订单（status=4 或 status='cancelled'）
    const validOrders = orders.filter(o => o.status !== 4 && o.status !== 'cancelled')
    // 今日订单（非取消）
    const todayOrders = validOrders.filter(o => {
      const dateStr = normalizeDate(o.createTime)
      return dateStr === today
    })
    // 本月收入：只计算本月的非取消订单
    const thisMonth = today.substring(0, 7) // "YYYY-MM"
    const monthlyRevenue = validOrders
      .filter(o => {
        const dateStr = normalizeDate(o.createTime)
        return dateStr && dateStr.startsWith(thisMonth)
      })
      .reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0)

    return {
      code: 200,
      data: {
        todayOrders: todayOrders.length,
        pendingOrders: orders.filter(o => o.status === 0 || o.status === 'pending').length,
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 1).length,
        monthlyRevenue,
        monthlyGrowth: 0,
        totalRevenue: validOrders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0)
      }
    }
  })
}

export function getRecentOrderStats(days) {
  // 返回最近N天的订单统计
  return request({ url: '/mall/order/list', method: 'get' }).then(res => {
    const orders = (res.data || []).filter(o => o.status !== 4 && o.status !== 'cancelled')
    const result = { dates: [], counts: [] }
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      result.dates.push(dateStr)
      result.counts.push(orders.filter(o => normalizeDate(o.createTime) === dateStr).length)
    }
    return { code: 200, data: result }
  })
}

export function getProductRanking() {
  // 返回商品销量排行
  return request({ url: '/mall/product/merchant', method: 'get' }).then(res => {
    const products = (res.data || []).slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      sales: p.sales || p.soldCount || 0
    }))
    return { code: 200, data: products }
  })
}

export function getRevenueTrend(type) {
  // 返回收入趋势数据
  const days = type === 'week' ? 7 : type === 'month' ? 30 : 365
  return request({ url: '/mall/order/list', method: 'get' }).then(res => {
    const orders = (res.data || []).filter(o => o.status !== 4 && o.status !== 'cancelled')
    const result = { dates: [], values: [] }
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      result.dates.push(dateStr)
      result.values.push(
        orders
          .filter(o => normalizeDate(o.createTime) === dateStr)
          .reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0)
      )
    }
    return { code: 200, data: result }
  })
}
