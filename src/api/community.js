import request from '@/utils/request'

// 车位列表
export function getParkingInfo() {
  return request({
    url: '/community/park/list',
    method: 'get'
  })
}

// 可用车位
export function getAvailableParkingSpaces() {
  return request({
    url: '/community/park/available',
    method: 'get'
  })
}

// 车位申请
export function bindParkingLicense(data) {
  return request({
    url: '/community/park/apply',
    method: 'post',
    data
  })
}

// 公告列表
export function getNoticeList() {
  return request({
    url: '/community/notice/list',
    method: 'get'
  })
}

// 访客登记
export function registerVisitor(data) {
  return request({
    url: '/community/visitor/register',
    method: 'post',
    data
  })
}
