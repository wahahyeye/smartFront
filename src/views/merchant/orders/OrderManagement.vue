<template>
  <div class="order-management">
    <div class="page-header">
      <h2>订单管理</h2>
    </div>

    <div class="filter-container">
      <el-form :inline="true" :model="filters">
        <el-form-item label="订单号">
          <el-input v-model="filters.orderNo" placeholder="请输入订单号" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="filters.status" placeholder="请选择" clearable @change="handleSearch">
            <el-option label="全部" :value="null" />
            <el-option label="待付款" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="orders" style="width: 100%; margin-top: 20px" v-loading="loading">
      <el-table-column prop="orderNo" label="订单号" width="180" />
      <el-table-column prop="createTime" label="下单时间" width="180" />
      <el-table-column prop="total" label="订单金额">
        <template #default="{ row }">
          ¥{{ (row.totalAmount || row.total || 0).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" size="small" @click="handleDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 1"
              type="success"
              size="small"
              @click="handleShip(row)"
            >
              发货
            </el-button>
            <el-button
              v-if="row.status === 0 || row.status === 1"
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination" style="margin-top: 20px; text-align: right;">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadOrders"
        @current-change="loadOrders"
      />
    </div>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="订单详情"
      width="800px"
    >
      <template v-if="currentOrder">
        <div class="order-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ currentOrder.createTime }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getStatusType(currentOrder.status)">
                {{ getStatusText(currentOrder.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="订单金额">¥{{ (currentOrder.total || 0).toFixed(2) }}</el-descriptions-item>
          </el-descriptions>

          <h4 style="margin: 20px 0 12px; color: #1f2f3d;">商品信息</h4>
          <el-table :data="currentOrder.items" border style="width: 100%">
            <el-table-column prop="productName" label="商品名称" />
            <el-table-column prop="price" label="单价">
              <template #default="{ row }">¥{{ (row.price || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100" />
            <el-table-column label="小计">
              <template #default="{ row }">
                ¥{{ ((row.price || 0) * (row.quantity || 0)).toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>

          <h4 style="margin: 20px 0 12px; color: #1f2f3d;">收货信息</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="收货人">{{ currentOrder.address?.name }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentOrder.address?.phone }}</el-descriptions-item>
            <el-descriptions-item label="收货地址">{{ currentOrder.address?.fullAddress }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </template>
    </el-dialog>

    <!-- 发货对话框 -->
    <el-dialog
      v-model="shipDialogVisible"
      title="订单发货"
      width="500px"
    >
      <el-form :model="shipForm" label-width="100px">
        <el-form-item label="快递公司" required>
          <el-select v-model="shipForm.company" placeholder="请选择快递公司">
            <el-option label="顺丰速运" value="SF" />
            <el-option label="中通快递" value="ZTO" />
            <el-option label="圆通速递" value="YTO" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" required>
          <el-input v-model="shipForm.trackingNo" placeholder="请输入快递单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shipDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmShip">确认发货</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMerchantOrders, getMerchantOrderDetail, shipMerchantOrder, cancelMerchantOrder } from '@/api/merchant.js'

const filters = ref({
  orderNo: '',
  status: null
})

const orders = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const detailVisible = ref(false)
const currentOrder = ref(null)
const shipDialogVisible = ref(false)
const shipForm = ref({
  company: '',
  trackingNo: ''
})
const currentShipOrder = ref(null)

const getStatusType = (status) => {
  const types = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info', 4: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { 0: '待付款', 1: '待发货', 2: '已发货', 3: '已完成', 4: '已取消' }
  return texts[status] || ('状态' + status)
}

const loadOrders = async () => {
  loading.value = true
  try {
    const res = await getMerchantOrders({
      page: currentPage.value,
      size: pageSize.value,
      status: filters.value.status || undefined,
      orderNo: filters.value.orderNo || undefined
    })
    const data = res.data || []
    const list = Array.isArray(data) ? data : (data.records || data.rows || [])
    // 前端筛选：按状态过滤
    let filtered = list
    if (filters.value.status !== null && filters.value.status !== undefined && filters.value.status !== '') {
      filtered = list.filter(o => o.status === filters.value.status)
    }
    // 前端筛选：按订单号过滤
    if (filters.value.orderNo) {
      filtered = filtered.filter(o => o.orderNo && o.orderNo.includes(filters.value.orderNo))
    }
    orders.value = filtered
    total.value = filtered.length
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadOrders()
}

const resetFilters = () => {
  filters.value = {
    orderNo: '',
    status: null
  }
  currentPage.value = 1
  loadOrders()
}

const handleDetail = async (row) => {
  try {
    const res = await getMerchantOrderDetail(row.id)
    const data = res.data || {}
    const order = data.order || data
    currentOrder.value = {
      ...order,
      items: data.items || order.items || [],
      address: {
        name: order.receiverName,
        phone: order.receiverPhone,
        fullAddress: order.receiverAddress
      }
    }
    detailVisible.value = true
  } catch (error) {
    currentOrder.value = row
    detailVisible.value = true
  }
}

const handleShip = (row) => {
  currentShipOrder.value = row
  shipForm.value = {
    company: '',
    trackingNo: ''
  }
  shipDialogVisible.value = true
}

const confirmShip = async () => {
  if (!shipForm.value.company || !shipForm.value.trackingNo) {
    ElMessage.warning('请填写完整的发货信息')
    return
  }
  try {
    await shipMerchantOrder(currentShipOrder.value.id, shipForm.value)
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error('发货失败')
  }
}

const handleCancel = (row) => {
  ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await cancelMerchantOrder(row.id)
      ElMessage.success('订单已取消')
      loadOrders()
    } catch (error) {
      ElMessage.error('取消订单失败')
    }
  })
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-management {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2f3d;
}

.filter-container {
  margin: 20px 0;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
