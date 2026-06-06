import request from '../utils/request'

/**
 * 用户登录
 */
export const login = (data) => {
  return request.post('/auth/user/login', data)
}

/**
 * 用户注册
 */
export const register = (data) => {
  return request.post('/auth/user/register', data)
}

/**
 * 获取用户信息（从认证服务）
 */
export const getUserInfo = (userId) => {
  return request.get('/auth/user/info', { params: { userId } })
}

/**
 * 获取用户资料（从用户服务）
 */
export const getUserProfile = () => {
  return request.get('/user/profile')
}

/**
 * 更新用户资料
 */
export const updateUserProfile = (data) => {
  return request.put('/user/profile', data)
}

/**
 * 修改密码
 */
export const updatePassword = (data) => {
  return request.post('/auth/user/change-password', data)
}

/**
 * 获取钱包信息
 */
export const getWallet = () => {
  return request.get('/user/wallet')
}

/**
 * 钱包充值
 */
export const rechargeWallet = (data) => {
  return request.post('/user/wallet/recharge', data)
}

/**
 * 获取钱包交易明细
 */
export const getWalletTransactions = () => {
  return request.get('/user/wallet/transactions')
}

// ========== 社区服务相关 ==========

// 车位申请
export function createParkSpaceApplication(data) {
  return request({ url: '/community/park/apply', method: 'post', data })
}

// 用户车位申请查询
export function getParkSpaceApplication() {
  return request({ url: '/community/park/my-applications', method: 'get' })
}

// 获取车位列表（用户端）
export function getParkingInfo() {
  return request({ url: '/community/park/list', method: 'get' })
}

// 兼容旧函数名
export const getUserParkingSpaces = getParkingInfo

// 获取可用车位
export function getAvailableParkingSpaces() {
  return request({ url: '/community/park/available', method: 'get' })
}

// 申请车位（对应用户车位页面的 bindParkingLicense）
export function bindParkingLicense(data) {
  return request({ url: '/community/park/apply', method: 'post', data })
}

// 报事报修
export function submitRepair(data) {
  return request({ url: '/community/repair/apply', method: 'post', data })
}

export function getUserRepairList(params) {
  return request({ url: '/community/repair/my', method: 'get' }).then(res => {
    if (res.code === 200) {
      const all = Array.isArray(res.data) ? res.data : []
      const p = params || {}
      const page = p.current || 1
      const size = p.size || 10
      const start = (page - 1) * size
      return { code: 200, data: { rows: all.slice(start, start + size), total: all.length } }
    }
    return res
  })
}

// 为了兼容，也保留 getUserRepairsList 别名
export const getUserRepairsList = getUserRepairList

// 社区公告
export function getNoticeList() {
  return request({ url: '/community/notice/list', method: 'get' })
}

// 生活缴费
export function getPaymentList() {
  return request({ url: '/community/payment/my', method: 'get' })
}

// 兼容旧函数名 getPaymentHistory（返回分页格式）
export function getPaymentHistory(params) {
  return request({ url: '/community/payment/my', method: 'get' }).then(res => {
    if (res.code === 200) {
      const all = Array.isArray(res.data) ? res.data : []
      const page = params?.page || 1
      const size = params?.size || 10
      const start = (page - 1) * size
      return { code: 200, data: { records: all.slice(start, start + size), total: all.length } }
    }
    return res
  })
}

// 支付账单
export function payBill(data) {
  return request({ url: '/community/payment/pay', method: 'post', data })
}

// 一键缴纳全部费用
export function payAllBills(data) {
  return request({ url: '/community/payment/payAll', method: 'post', data })
}

// 获取缴费账单详情（前端 Profile 页使用，返回费用配置列表）
export function getPaymentBill() {
  return request({ url: '/community/fee/config', method: 'get' })
}

// 访客登记
export function registerVisitor(data) {
  return request({ url: '/community/visitor/register', method: 'post', data })
}

export function getMyVisitors() {
  return request({ url: '/community/visitor/my', method: 'get' })
}

// 投诉建议
export function submitComplaint(data) {
  return request({ url: '/community/complaint/create', method: 'post', data })
}

export function getMyComplaints() {
  return request({ url: '/community/complaint/my', method: 'get' })
}

// ========== 图片上传 ==========
export function imgUpload(data) {
  return request({
    url: '/file/upload',
    method: 'post',
    data
    // 不要手动设置 Content-Type，axios 会自动为 FormData 添加 boundary
  })
}
