<template>
  <div class="orders-page" v-loading="loading">
    <h2>📦 我的订单</h2>

    <el-table :data="orders" style="width: 100%" v-if="orders.length > 0">
      <el-table-column prop="orderNo" label="订单号" width="220" />
      <el-table-column label="金额" width="120">
        <template #default="{ row }">¥{{ row.totalAmount }}</template>
      </el-table-column>
      <el-table-column prop="statusText" label="状态" width="120" />
      <el-table-column prop="receiverAddress" label="配送地址" min-width="180" />
      <el-table-column prop="createTime" label="下单时间" width="180" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button v-if="row.status === 0" type="primary" size="small" @click="pay(row)">去支付</el-button>
            <el-button v-if="row.status === 1 || row.status === 2" type="success" size="small" @click="viewDetail(row)">查看详情</el-button>
            <el-button v-if="row.status === 0 || row.status === 1" type="danger" size="small" @click="handleCancelOrder(row)">取消订单</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-else description="暂无订单，去逛逛吧~" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOrderList, payOrder, cancelOrder as cancelOrderApi } from '@/api/mall'

const loading = ref(false)
const orders = ref([])

const formatStatus = (status) => {
  const map = { 0: '待付款', 1: '待发货', 2: '已发货', 3: '已完成', 4: '已取消' }
  return map[status] || '未知'
}

const load = async () => {
  loading.value = true
  try {
    const res = await getOrderList({ page: 1, size: 20 })
    const data = res.data || res
    const list = Array.isArray(data) ? data : (data.records || data.rows || [])
    orders.value = list.map(o => ({
      ...o,
      statusText: formatStatus(o.status)
    }))
  } catch (err) {
    console.error('获取订单失败:', err)
    ElMessage.error('获取订单失败')
  } finally {
    loading.value = false
  }
}

const pay = async (row) => {
  try {
    await payOrder({ orderId: row.id })
    ElMessage.success('支付成功')
    load()
  } catch (err) {
    ElMessage.error('支付失败')
  }
}

const viewDetail = (row) => {
  ElMessage.info(`订单 ${row.orderNo} 详情`)
}

const handleCancelOrder = async (row) => {
  try {
    await cancelOrderApi(row.id)
    ElMessage.success('订单已取消')
    load()
  } catch (err) {
    ElMessage.error('取消失败')
  }
}

onMounted(load)
</script>

<style scoped>
.orders-page { 
  padding: 20px; 
  background: #fff;
  min-height: 400px;
}
.orders-page h2 {
  margin-bottom: 20px;
  font-size: 20px;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
</style>