import request from '@/utils/request'

// 获取商家/商铺列表（便民服务用）
export function getMerchantList(params) {
  return request({
    url: '/auth/merchant/list',
    method: 'get',
    params
  })
}

// 获取商品列表
export function getProductList(params) {
  return request({
    url: '/mall/product/list',
    method: 'get',
    params
  })
}

// 获取商品详情
export function getProductDetail(id) {
  return request({
    url: `/mall/product/detail/${id}`,
    method: 'get'
  })
}

// 购物车相关接口
export function getCartList() {
  return request({
    url: '/mall/cart/list',
    method: 'get'
  })
}

export function addToCart(data) {
  return request({
    url: '/mall/cart/add',
    method: 'post',
    data
  })
}

export function removeFromCart(data) {
  return request({
    url: '/mall/cart/delete',
    method: 'post',
    data
  })
}

export function updateCart(data) {
  return request({
    url: '/mall/cart/update',
    method: 'post',
    data
  })
}

// 订单相关接口
export function createOrder(data) {
  return request({
    url: '/mall/order/create',
    method: 'post',
    data
  })
}

export function payOrder(data) {
  return request({
    url: `/mall/order/pay/${data.orderId || data.id}`,
    method: 'post'
  })
}

export function getOrderList(params) {
  return request({
    url: '/mall/order/list',
    method: 'get',
    params
  })
}

export function cancelOrder(orderId) {
  return request({
    url: `/mall/order/cancel/${orderId}`,
    method: 'post'
  })
}
