import request from '../utils/request'

/**
 * 管理员登录
 */
export const adminLogin = (data) => {
  return request.post('/auth/admin/login', data)
}

/**
 * 获取管理员信息
 */
export const getAdminInfo = (adminId) => {
  return request.get('/auth/admin/info', { params: { adminId } })
}

// ========== 公告管理 ==========
export function createNotice(data) {
  return request({ url: '/community/notice/create', method: 'post', data })
}

export function updateNotice(data) {
  return request({ url: `/community/notice/update/${data.id}`, method: 'put', data })
}

export const deleteNotice = (id) => {
  return request({ url: `/community/notice/delete/${id}`, method: 'delete' })
}

export function getNoticeList(params) {
  return request({ url: '/community/notice/list', method: 'get' }).then(res => {
    if (res.code === 200) {
      const all = Array.isArray(res.data) ? res.data : []
      const p = params || {}
      const page = p.currentPage || 1
      const size = p.pageSize || 10
      // 客户端搜索过滤
      let filtered = all
      if (p.searchKeyword) {
        const kw = p.searchKeyword.toLowerCase()
        filtered = filtered.filter(n => 
          (n.title && n.title.toLowerCase().includes(kw)) || 
          (n.content && n.content.toLowerCase().includes(kw))
        )
      }
      if (p.filterStatus !== '' && p.filterStatus !== undefined && p.filterStatus !== null) {
        filtered = filtered.filter(n => String(n.status) === String(p.filterStatus))
      }
      const start = (page - 1) * size
      return { code: 200, data: { rows: filtered.slice(start, start + size), total: filtered.length } }
    }
    return res
  })
}

// getLatestNotices 是 getNoticeList 的别名（管理员首页用）
export const getLatestNotices = getNoticeList

// ========== 车位管理 ==========
export function getParkingSpaces(params) {
  return request({ url: '/community/park/list', method: 'get' }).then(res => {
    if (res.code === 200) {
      const all = Array.isArray(res.data) ? res.data : []
      const p = params || {}
      const page = p.currentPage || 1
      const size = p.pageSize || 10
      let filtered = all
      if (p.spaceNo) {
        const kw = p.spaceNo.toLowerCase()
        filtered = filtered.filter(s => s.spaceNo && s.spaceNo.toLowerCase().includes(kw))
      }
      const start = (page - 1) * size
      return { code: 200, data: { rows: filtered.slice(start, start + size), total: filtered.length } }
    }
    return res
  })
}

export function getAvailableParkingSpaces() {
  return request({ url: '/community/park/available', method: 'get' })
}

export function addParkingSpace(data) {
  return request({ url: '/community/park/create', method: 'post', data })
}

export function updateParkingSpace(data) {
  return request({ url: `/community/park/update/${data.id}`, method: 'put', data })
}

export function deleteParkingSpace(id) {
  return request({ url: `/community/park/delete/${id}`, method: 'delete' })
}

// 车位申请管理 - 获取全部申请（含所有状态）
export function getParkingApplications(params) {
  return request({ url: '/community/park/applications', method: 'get' }).then(res => {
    if (res.code === 200) {
      const all = Array.isArray(res.data) ? res.data : []
      const p = params || {}
      const page = p.currentPage || 1
      const size = p.pageSize || 10
      let filtered = all
      if (p.status !== '' && p.status !== undefined && p.status !== null) {
        filtered = filtered.filter(a => Number(a.status) === Number(p.status))
      }
      const start = (page - 1) * size
      return { code: 200, data: { rows: filtered.slice(start, start + size), total: filtered.length } }
    }
    return res
  })
}

export function updateParkingApplicationStatus(id, data) {
  return request({ url: `/community/park/approve/${id}`, method: 'put', data })
}

// ========== 报修管理 ==========
export function getRepairList(params) {
  return request({ url: '/community/repair/pending', method: 'get' }).then(res => {
    if (res.code === 200) {
      const all = Array.isArray(res.data) ? res.data : []
      const p = params || {}
      const page = p.currentPage || 1
      const size = p.pageSize || 10
      const start = (page - 1) * size
      return { code: 200, data: { rows: all.slice(start, start + size), total: all.length } }
    }
    return res
  })
}

export function updateRepair(data) {
  return request({ url: `/community/repair/handle/${data.id}`, method: 'put', data })
}

// ========== 投诉建议管理 ==========
export function getComplaintList(params) {
  return request({ url: '/community/complaint/list', method: 'get' }).then(res => {
    if (res.code === 200) {
      const all = Array.isArray(res.data) ? res.data : []
      const p = params || {}
      const page = p.currentPage || 1
      const size = p.pageSize || 10
      const start = (page - 1) * size
      return { code: 200, data: { rows: all.slice(start, start + size), total: all.length } }
    }
    return res
  })
}

export function updateComplaint(data) {
  // 后端字段: status, handleResult
  return request({
    url: `/community/complaint/handle/${data.id}`,
    method: 'put',
    data: { status: data.status != null ? data.status : data.isHandled, handleResult: data.handleResult }
  })
}

// ========== 物业缴费管理 ==========
export function getPropertyPaymentList(params) {
  return request({ url: '/community/payment/list', method: 'get' }).then(res => {
    if (res.code === 200) {
      const all = Array.isArray(res.data) ? res.data : []
      const p = params || {}
      const page = p.currentPage || 1
      const size = p.pageSize || 10
      let filtered = all
      if (p.type) filtered = filtered.filter(i => i.type === p.type)
      if (p.status) filtered = filtered.filter(i => String(i.status) === String(p.status))
      const start = (page - 1) * size
      return { code: 200, data: { rows: filtered.slice(start, start + size), total: filtered.length } }
    }
    return res
  })
}

export function updatePropertyPayment(data) {
  return request({ url: `/community/payment/update/${data.id}`, method: 'put', data })
}

export function deletePropertyPayment(id) {
  return request({ url: `/community/payment/delete/${id}`, method: 'delete' })
}

// Excel导出（模拟实现 - 后端暂无真实导出接口）
export function exportPropertyPaymentExcel(params) {
  console.warn('Excel导出功能后端暂未实现，使用前端导出')
  return Promise.reject(new Error('导出功能暂未实现'))
}

// ========== 费用配置 ==========
export function getFeeConfigList() {
  return request({ url: '/community/fee/config', method: 'get' })
}

// ========== 访客管理 ==========
export function getVisitorList(params) {
  return request({ url: '/community/visitor/list', method: 'get' }).then(res => {
    if (res.code === 200) {
      const all = Array.isArray(res.data) ? res.data : []
      const p = params || {}
      const page = p.currentPage || 1
      const size = p.pageSize || 10
      const start = (page - 1) * size
      return { code: 200, data: { rows: all.slice(start, start + size), total: all.length } }
    }
    return res
  })
}

export function approveVisitor(id) {
  return request({ url: `/community/visitor/approve/${id}`, method: 'put' })
}

export function addVisitor(data) {
  return request({ url: '/community/visitor/create', method: 'post', data })
}

export function deleteVisitor(id) {
  return request({ url: `/community/visitor/delete/${id}`, method: 'delete' })
}

// ========== 文件上传 ==========
export function imgUpload(data) {
  return request({
    url: '/file/upload',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ========== 仪表盘 ==========
export function getDashboardOverview() {
  return request({ url: '/admin/dashboard', method: 'get' })
}
