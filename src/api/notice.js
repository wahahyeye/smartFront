import request from '@/utils/request'

// 最新公告
export function getLatestNotices() {
  return request({
    url: '/community/notice/list',
    method: 'get'
  })
}
