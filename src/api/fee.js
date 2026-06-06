import request from '@/utils/request'

// 获取费用配置（用户端/管理员端共用）
export function getFeeConfigList() {
  return request({ url: '/community/fee/config', method: 'get' })
}

// 按类型获取费用配置（转换字段名以兼容前端）
export function getFeeByType(type) {
  return request({ url: `/community/fee/config/type/${type}`, method: 'get' }).then(res => {
    if (res.code === 200 && res.data) {
      return {
        code: 200,
        data: {
          name: res.data.feeName || res.data.name,
          amount: res.data.unitPrice || res.data.amount,
          unit: res.data.unit,
          description: res.data.description || ''
        }
      }
    }
    return res
  })
}

// 创建费用配置
export function createFeeConfig(data) {
  return request({ url: '/community/fee/config', method: 'post', data })
}

// 更新费用配置（按ID）
export function updateFeeConfig(id, data) {
  return request({ url: `/community/fee/config/${id}`, method: 'put', data })
}

// 按类型更新费用配置
export function updateFee(type, data) {
  return request({ url: `/community/fee/config/type/${type}`, method: 'put', data })
}

// 用户获取费用信息（剩余待缴金额 = 配置金额 - 已缴金额）
export function getUserFees() {
  return request({ url: '/community/fee/my', method: 'get' }).then(res => {
    if (res.code === 200 && res.data) {
      // 后端已按类型聚合，直接返回
      return { code: 200, data: res.data }
    }
    return res
  })
}
