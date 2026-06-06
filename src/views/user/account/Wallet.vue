<template>
  <div class="wallet-page" v-loading="loading">
    <h2>钱包管理</h2>

    <!-- 余额卡片 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="balance-card">
          <div class="balance-label">可用余额</div>
          <div class="balance-value">¥{{ wallet.balance.toFixed(2) }}</div>
          <div class="balance-label">冻结余额：¥{{ wallet.frozenBalance.toFixed(2) }}</div>
        </el-card>
      </el-col>

      <!-- 充值区域 -->
      <el-col :span="16">
        <el-card shadow="hover" class="recharge-card">
          <template #header>
            <span class="card-title">余额充值</span>
          </template>
          <div class="recharge-form">
            <span class="label">充值金额：</span>
            <el-input-number
              v-model="rechargeAmount"
              :min="1"
              :max="10000"
              :step="10"
              size="large"
              controls-position="right"
              style="width: 200px"
            />
            <el-button
              type="primary"
              size="large"
              :loading="recharging"
              @click="handleRecharge"
              style="margin-left: 16px"
            >
              立即充值
            </el-button>
          </div>
          <div class="quick-amounts" style="margin-top: 12px">
            <el-button
              v-for="amt in [10, 50, 100, 200, 500]"
              :key="amt"
              size="small"
              :type="rechargeAmount === amt ? 'primary' : ''"
              @click="rechargeAmount = amt"
            >
              ¥{{ amt }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 账单明细 -->
    <div style="margin-top: 24px">
      <el-card>
        <template #header>
          <div class="card-header-row">
            <span class="card-title">账单明细</span>
            <el-button @click="refreshWallet">刷新</el-button>
          </div>
        </template>
        <el-table :data="records" style="width: 100%" empty-text="暂无交易记录">
          <el-table-column prop="orderNo" label="交易单号" width="220" />
          <el-table-column label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="row.type === '充值' ? 'success' : 'primary'" size="small">
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="140">
            <template #default="{ row }">
              <span :style="{ color: row.type === '充值' ? '#67c23a' : '#e6a23c' }">
                {{ row.type === '充值' ? '+' : '-' }}¥{{ row.amount.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="time" label="时间" min-width="180" />
          <el-table-column prop="remark" label="备注" min-width="120">
            <template #default="{ row }">
              {{ row.remark || '-' }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getWallet, rechargeWallet, getWalletTransactions } from '@/api/user'
import { getPaymentHistory } from '@/api/user'
import { getOrderList } from '@/api/mall'

const loading = ref(false)
const recharging = ref(false)
const rechargeAmount = ref(100)

const wallet = reactive({
  balance: 0,
  frozenBalance: 0
})

const records = ref([])

// 获取钱包余额
const fetchWallet = async () => {
  try {
    const res = await getWallet()
    const data = res.data || res || {}
    wallet.balance = parseFloat(data.balance) || 0
    wallet.frozenBalance = parseFloat(data.frozenBalance) || 0
  } catch (err) {
    console.error('获取钱包失败:', err)
    // 首次使用钱包可能不存在，后端会自动创建
  }
}

// 获取交易记录（钱包交易 + 缴费记录 + 商城订单）
const fetchRecords = async () => {
  try {
    const list = []

    // 1. 获取钱包交易明细（充值+扣款）
    try {
      const txRes = await getWalletTransactions()
      const txs = Array.isArray(txRes?.data) ? txRes.data : []
      txs.forEach(tx => {
        const amount = parseFloat(tx.amount) || 0
        list.push({
          orderNo: tx.orderNo || `TX${tx.id}`,
          type: tx.type === 'recharge' ? '充值' : (tx.type === 'deduct' ? '缴费支出' : '交易'),
          amount: amount,
          time: tx.createTime || '-',
          remark: tx.remark || (tx.type === 'recharge' ? '钱包充值' : '余额支付'),
          raw: tx
        })
      })
    } catch (e) {
      console.warn('钱包交易明细获取失败:', e)
    }

    // 2. 获取物业缴费记录
    try {
      const payRes = await getPaymentHistory({ page: 1, size: 100 })
      const payments = payRes?.data?.records || payRes?.data?.rows || payRes?.data || []
      const payList = Array.isArray(payments) ? payments : []
      payList.forEach(p => {
        if (p.status === 1) {
          const amount = parseFloat(p.amount) || 0
          list.push({
            orderNo: p.id ? `PAY${p.id}` : 'PAY',
            type: '缴费支出',
            amount: amount,
            time: p.payTime || p.createTime || '-',
            remark: p.typeName || p.remark || '物业费缴纳',
            raw: p
          })
        }
      })
    } catch (e) {
      console.warn('缴费记录获取失败:', e)
    }

    // 3. 获取商城订单
    try {
      const orderRes = await getOrderList({ page: 1, size: 50 })
      const orders = Array.isArray(orderRes?.data)
        ? orderRes.data
        : (orderRes?.data?.records || orderRes?.data?.rows || orderRes?.data || [])
      orders.forEach(o => {
        const amount = parseFloat(o.totalAmount) || 0
        if (o.status !== 4) {
          list.push({
            orderNo: o.orderNo || `ORD${o.id}`,
            type: '商城消费',
            amount: amount,
            time: o.createTime || '-',
            remark: '便民超市购物',
            raw: o
          })
        }
      })
    } catch (e) {
      console.warn('商城订单记录获取失败:', e)
    }

    // 按时间倒序排列
    list.sort((a, b) => {
      const ta = typeof a.time === 'string' ? a.time : ''
      const tb = typeof b.time === 'string' ? b.time : ''
      return tb.localeCompare(ta)
    })

    records.value = list
  } catch (err) {
    console.error('获取交易记录失败:', err)
  }
}

// 充值
const handleRecharge = async () => {
  if (rechargeAmount.value < 1) {
    ElMessage.warning('充值金额不能小于1')
    return
  }

  recharging.value = true
  try {
    const res = await rechargeWallet({ amount: rechargeAmount.value })
    const data = res.data || res || {}
    wallet.balance = parseFloat(data.balance) || wallet.balance

    ElMessage.success(`成功充值 ¥${rechargeAmount.value}！`)
    rechargeAmount.value = 100
    // 刷新交易明细
    await fetchRecords()
  } catch (err) {
    ElMessage.error('充值失败，请稍后重试')
    console.error('充值失败:', err)
  } finally {
    recharging.value = false
  }
}

// 刷新
const refreshWallet = async () => {
  loading.value = true
  await Promise.all([fetchWallet(), fetchRecords()])
  loading.value = false
}

onMounted(() => {
  refreshWallet()
})
</script>

<style scoped>
.wallet-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 400px;
}

.wallet-page h2 {
  margin-bottom: 20px;
  font-size: 22px;
  color: #1f2f3d;
}

.balance-card {
  text-align: center;
  padding: 20px 0;
  border-radius: 8px;
}

.balance-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.balance-value {
  font-size: 36px;
  font-weight: 700;
  color: #303133;
  margin: 12px 0;
}

.recharge-card {
  border-radius: 8px;
}

.recharge-form {
  display: flex;
  align-items: center;
}

.recharge-form .label {
  font-size: 15px;
  color: #606266;
  margin-right: 12px;
}

.quick-amounts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2f3d;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
