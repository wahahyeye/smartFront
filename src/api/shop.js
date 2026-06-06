import request from '@/utils/request'

// 商家登录（与 merchant.js 合并，避免重复）
export function merchantLogin(data) {
  return request({
    url: '/auth/merchant/login',
    method: 'post',
    data
  })
}

// 商家注册（将前端字段名映射为后端期望的字段名）
export function merchantRegister(data) {
  return request({
    url: '/auth/merchant/register',
    method: 'post',
    data: {
      username: data.username,
      password: data.password,
      storeName: data.name,        // 前端用 name，后端期望 storeName
      phone: data.phone,
      address: data.address,
      description: data.description
    }
  })
}

// Register.vue 中 import { register } 使用的别名
export { merchantRegister as register }
