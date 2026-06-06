import request from '@/utils/request'

// 获取用户信息（认证服务）
export function getUserInfo(userId) {
  return request({
    url: '/auth/user/info',
    method: 'get',
    params: { userId }
  })
}

// 更新用户信息（认证服务 - User 表：用户名、邮箱、头像）
export function updateUserInfo(data) {
  return request({
    url: '/auth/user/info',
    method: 'put',
    data
  })
}

// 修改密码
export function updatePassword(data) {
  return request({
    url: '/auth/user/change-password',
    method: 'post',
    data
  })
}

// 获取用户地址信息（暂无后端接口，预留）
export function getUserAddress() {
  // 后端暂无地址表，返回 mock
  return Promise.resolve({ data: { code: 200, data: { address: '', phone: '' } } })
}
