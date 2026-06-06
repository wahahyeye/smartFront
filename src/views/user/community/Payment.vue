<template>
  <div class="payment-container">
    <!-- 费用总览卡片 -->
    <div class="payment-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="8">
          <el-card class="overview-card property-card" :class="{ 'has-debt': bills.property > 0 }">
            <div class="card-icon">🏢</div>
            <div class="card-info">
              <h4>物业管理费</h4>
              <p class="amount" :class="{ 'due': bills.property > 0 }">
                ¥{{ bills.property?.toFixed(2) || '0.00' }}
              </p>
              <el-tag :type="bills.property > 0 ? 'danger' : 'success'" size="small" effect="dark">
                {{ bills.property > 0 ? '待缴费' : '已缴清' }}
              </el-tag>
            </div>
            <el-button
              type="primary"
              size="small"
              @click="handlePay('property')"
              :disabled="bills.property <= 0"
              class="pay-btn"
            >
              立即缴费
            </el-button>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="8">
          <el-card class="overview-card parking-card" :class="{ 'has-debt': bills.parking > 0 }">
            <div class="card-icon">🅿️</div>
            <div class="card-info">
              <h4>停车费</h4>
              <p class="amount" :class="{ 'due': bills.parking > 0 }">
                ¥{{ bills.parking?.toFixed(2) || '0.00' }}
              </p>
              <el-tag :type="bills.parking > 0 ? 'danger' : 'success'" size="small" effect="dark">
                {{ bills.parking > 0 ? '待缴费' : '已缴清' }}
              </el-tag>
            </div>
            <el-button
              type="primary"
              size="small"
              @click="handlePay('parking')"
              :disabled="bills.parking <= 0"
              class="pay-btn"
            >
              立即缴费
            </el-button>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="8">
          <el-card class="overview-card other-card" :class="{ 'has-debt': bills.other > 0 }">
            <div class="card-icon">📋</div>
            <div class="card-info">
              <h4>其他费用</h4>
              <p class="amount" :class="{ 'due': bills.other > 0 }">
                ¥{{ bills.other?.toFixed(2) || '0.00' }}
              </p>
              <el-tag :type="bills.other > 0 ? 'danger' : 'success'" size="small" effect="dark">
                {{ bills.other > 0 ? '待缴费' : '已缴清' }}
              </el-tag>
            </div>
            <el-button
              type="primary"
              size="small"
              @click="handlePay('other')"
              :disabled="bills.other <= 0"
              class="pay-btn"
            >
              立即缴费
            </el-button>
          </el-card>
        </el-col>
      </el-row>

      <!-- 汇总信息 -->
      <div class="summary-bar">
        <span class="summary-item">
          <i class="icon-total"></i> 应缴总额：
          <strong style="color: #f56c6c; font-size: 18px;">¥{{ totalDue.toFixed(2) }}</strong>
        </span>
        <span class="summary-item" v-if="totalDue === 0">
          <el-tag type="success" effect="dark">✓ 所有费用已缴清</el-tag>
        </span>
        <el-button type="danger" size="small" @click="handlePayAll" v-if="totalDue > 0" :loading="payingAll">
          一键缴纳全部费用
        </el-button>
      </div>
    </div>

    <!-- 缴费记录 -->
    <div class="payment-history">
      <div class="section-header">
        <h2><i class="icon-history"></i> 缴费记录</h2>
        <div class="header-actions">
          <el-select v-model="historyFilterType" placeholder="费用类型" clearable size="small" style="width: 120px;" @change="loadPaymentHistory">
            <el-option label="全部类型" value="" />
            <el-option label="物业费" value="property" />
            <el-option label="停车费" value="parking" />
            <el-option label="其他" value="other" />
          </el-select>
          <el-select v-model="historyFilterStatus" placeholder="支付状态" clearable size="small" style="width: 110px;" @change="loadPaymentHistory">
            <el-option label="全部状态" :value="-1" />
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已退款" :value="2" />
          </el-select>
        </div>
      </div>

      <el-table :data="paymentHistory" border style="width: 100%" v-loading="loadingHistory" :row-class-name="tableRowClassName">
        <el-table-column label="序号" width="60">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="id" label="订单号" width="170" />
        <el-table-column prop="type" label="费用类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">{{ row.typeName || getPaymentTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="110" align="center">
          <template #default="{ row }">
            <span style="font-weight: 600; color: #e6a23c;">¥{{ Number(row.amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payMethod" label="支付方式" width="100" align="center">
          <template #default="{ row }">
            {{ getPayMethodName(row.payMethod) }}
          </template>
        </el-table-column>
        <el-table-column prop="payTime" label="支付时间" width="175" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.payTime) || formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.note || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 支付弹窗 -->
    <el-dialog v-model="payDialogVisible" title="费用支付" width="420px" :close-on-click-modal="false">
      <div class="pay-dialog-content">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="费用类型" :label-width="100">
            <strong>{{ getPaymentTypeName(payForm.type) }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="应付金额" :label-width="100">
            <span class="pay-amount">¥{{ Number(payForm.amount).toFixed(2) }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">选择支付方式</el-divider>

        <el-form :model="payForm" label-position="top">
          <el-form-item label="">
            <el-radio-group v-model="payForm.method" class="pay-method-group">
              <el-radio value="wallet" class="method-option" :class="{ active: payForm.method === 'wallet' }">
                <span class="method-icon">💰</span>
                <span class="method-text">钱包支付</span>
                <span class="method-desc">使用余额支付</span>
              </el-radio>
              <el-radio value="alipay" class="method-option" :class="{ active: payForm.method === 'alipay' }">
                <span class="method-icon">🔵</span>
                <span class="method-text">支付宝</span>
                <span class="method-desc">扫码支付</span>
              </el-radio>
              <el-radio value="wechat" class="method-option" :class="{ active: payForm.method === 'wechat' }">
                <span class="method-icon">🟢</span>
                <span class="method-text">微信支付</span>
                <span class="method-desc">扫码支付</span>
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注（选填）">
            <el-input v-model="payForm.note" placeholder="请输入备注信息" maxlength="50" show-word-limit />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="payDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmPay" :loading="paying" :disabled="!payForm.method">
            确认支付 ¥{{ Number(payForm.amount).toFixed(2) }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="缴费详情" width="500px">
      <div class="payment-detail" v-if="currentDetail">
        <el-descriptions :column="1" border size="medium">
          <el-descriptions-item label="订单号" :label-width="100">{{ currentDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="费用类型" :label-width="100">
            <el-tag :type="getTypeTag(currentDetail.type)" size="small">{{ getPaymentTypeName(currentDetail.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付金额" :label-width="100">
            <span style="font-size: 18px; font-weight: bold; color: #f56c6c;">
              ¥{{ Number(currentDetail.amount).toFixed(2) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="支付状态" :label-width="100">
            <el-tag :type="getStatusType(currentDetail.status)" size="small">
              {{ getStatusName(currentDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式" :label-width="100">{{ getPayMethodName(currentDetail.payMethod) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间" :label-width="100">{{ formatDateTime(currentDetail.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" :label-width="100">{{ formatDateTime(currentDetail.updateTime) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :label-width="100" v-if="currentDetail.note">{{ currentDetail.note }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPaymentBill, payBill, payAllBills, getPaymentHistory as fetchPaymentHistory } from '@/api/user'
import { getUserFees } from '@/api/fee'

// ========== 数据状态 ==========
const bills = reactive({ property: 0, parking: 0, other: 0 })
const billMeta = reactive({ property: { id: null, name: '' }, parking: { id: null, name: '' }, other: { id: null, name: '' } })

const totalDue = computed(() => (bills.property || 0) + (bills.parking || 0) + (bills.other || 0))

// 支付表单
const payForm = reactive({ type: '', amount: 0, method: 'wallet', note: '', feeConfigId: null })
const paying = ref(false)
const payingAll = ref(false)

// 分页与历史记录
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const paymentHistory = ref([])
const loadingHistory = ref(false)
const historyFilterType = ref('')
const historyFilterStatus = ref(-1)

// 对话框控制
const payDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentDetail = ref(null)

// ========== 加载函数 ==========
const loadBills = async () => {
  try {
    const response = await getUserFees()
    if (response.code === 200) {
      const feeData = response.data
      const getAmount = (item) => item ? (Number(item.amount) || 0) : 0
      bills.property = getAmount(feeData.property)
      bills.parking = getAmount(feeData.parking)
      bills.other = getAmount(feeData.other)
      // 存储费用配置ID用于支付时关联
      if (feeData.property) billMeta.property = { id: feeData.property.id, name: feeData.property.name }
      if (feeData.parking) billMeta.parking = { id: feeData.parking.id, name: feeData.parking.name }
      if (feeData.other) billMeta.other = { id: feeData.other.id, name: feeData.other.name }
    }
  } catch (error) {
    console.error('获取账单失败:', error)
  }
}

const loadPaymentHistory = async () => {
  loadingHistory.value = true
  try {
    const response = await fetchPaymentHistory({
      page: currentPage.value,
      size: pageSize.value
    })
    let records = response.data?.records || []
    // 前端过滤
    if (historyFilterType.value) {
      records = records.filter(r => r.type === historyFilterType.value)
    }
    if (historyFilterStatus.value !== -1 && historyFilterStatus.value !== '' && historyFilterStatus.value != null) {
      records = records.filter(r => r.status === historyFilterStatus.value)
    }
    paymentHistory.value = records
    total.value = response.data?.total || 0
  } catch (error) {
    console.error('获取缴费记录失败:', error)
    paymentHistory.value = []
  } finally {
    loadingHistory.value = false
  }
}

// ========== 支付处理 ==========
const handlePay = (type) => {
  payForm.type = type
  payForm.amount = bills[type]
  payForm.method = 'wallet'
  payForm.note = ''
  payForm.feeConfigId = billMeta[type]?.id || null
  payDialogVisible.value = true
}

const handlePayAll = async () => {
  try {
    await ElMessageBox.confirm(`确认缴纳全部费用共 ¥${totalDue.value.toFixed(2)} 吗？`, '一键缴费', {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'warning'
    })
    payingAll.value = true

    // 收集所有待缴费项
    const fees = []
    if (bills.property > 0) fees.push({ type: 'property', amount: bills.property, feeConfigId: billMeta.property?.id })
    if (bills.parking > 0) fees.push({ type: 'parking', amount: bills.parking, feeConfigId: billMeta.parking?.id })
    if (bills.other > 0) fees.push({ type: 'other', amount: bills.other, feeConfigId: billMeta.other?.id })

    if (fees.length === 0) {
      ElMessage.warning('没有待缴纳的费用')
      return
    }

    // 调用批量缴费接口（后端一次性扣款 + 批量创建记录）
    const res = await payAllBills({ fees, method: 'wallet' })
    if (res.code === 200) {
      ElMessage.success(res.data || `成功缴纳 ${fees.length} 项费用，共计 ¥${totalDue.value.toFixed(2)}`)
    } else {
      ElMessage.error(res.message || '缴费失败')
      return
    }

    await loadBills()
    await loadPaymentHistory()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('一键缴费失败:', error)
      const msg = error?.response?.data?.message || error?.message || '缴费失败，请重试'
      ElMessage.error(msg)
    }
  } finally {
    payingAll.value = false
  }
}

const confirmPay = async () => {
  try {
    await ElMessageBox.confirm(
      `确认支付${getPaymentTypeName(payForm.type)} ¥${Number(payForm.amount).toFixed(2)} 吗？`,
      '确认支付',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )

    paying.value = true
    await payBill({
      type: payForm.type,
      amount: payForm.amount,
      method: payForm.method,
      note: payForm.note,
      feeConfigId: payForm.feeConfigId
    })

    ElMessage.success('支付成功')
    payDialogVisible.value = false
    await loadBills()
    await loadPaymentHistory()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('支付失败:', error)
      ElMessage.error('支付失败，请重试')
    }
  } finally {
    paying.value = false
  }
}

// ========== 详情查看 ==========
const viewDetail = (row) => {
  currentDetail.value = row
  detailDialogVisible.value = true
}

// ========== 分页处理 ==========
const handleSizeChange = (val) => {
  pageSize.value = val
  loadPaymentHistory()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadPaymentHistory()
}

// ========== 工具函数 ==========
const tableRowClassName = ({ rowIndex }) => rowIndex % 2 === 0 ? 'even-row' : 'odd-row'

const getPaymentTypeName = (type) => ({
  property: '物业管理费',
  parking: '停车费',
  other: '其他费用',
  物业费: '物业管理费',
  停车费: '停车费'
}[type] || type || '-')

const getStatusName = (status) => ({
  0: '待支付',
  1: '已支付',
  2: '已退款',
  pending: '待支付',
  paid: '已支付',
  cancelled: '已取消',
  refunded: '已退款',
  待支付: '待支付',
  已支付: '已支付'
}[status] || status || '-')

const getStatusType = (status) => ({
  0: 'warning',
  1: 'success',
  2: 'danger',
  pending: 'warning',
  paid: 'success',
  cancelled: 'info',
  refunded: 'danger',
  待支付: 'warning',
  已支付: 'success'
}[status] || '')

const getTypeTag = (t) => ({ property: '', parking: 'success', other: 'info', 物业费: '', 停车费: 'success' }[t] || '')

const getPayMethodName = (method) => ({
  wallet: '钱包余额',
  alipay: '支付宝',
  wechat: '微信支付',
  admin: '线下现金',
  '-': '-'
}[method] || method || '-')

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

onMounted(() => {
  loadBills()
  loadPaymentHistory()
})
</script>

<style scoped>
.payment-container {
  padding: 20px;
}

/* ====== 费用总览卡片 ====== */
.payment-overview {
  margin-bottom: 30px;
}

.overview-card {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.3s;
  border-left: 4px solid transparent;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.overview-card.has-debt {
  border-left-color: #f56c6c;
}

.property-card.has-debt { border-left-color: #409eff; }
.parking-card.has-debt { border-left-color: #67c23a; }
.other-card.has-debt { border-left-color: #e6a23c; }

.card-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-info h4 {
  margin: 0 0 4px;
  font-size: 15px;
  color: #606266;
}

.card-info .amount {
  margin: 6px 0;
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}

.card-info .amount.due {
  color: #f56c6c;
}

.pay-btn {
  flex-shrink: 0;
}

/* ====== 汇总栏 ====== */
.summary-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.icon-total::before { content: "💳 "; }

/* ====== 缴费记录区域 ====== */
.payment-history {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.section-header h2 {
  margin: 0;
  font-size: 17px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-history::before { content: "📊"; }

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 表格样式 */
:deep(.even-row) { background-color: #fafafa; }

.pagination {
  margin-top: 18px;
  text-align: right;
}

/* ====== 支付弹窗 ====== */
.pay-dialog-content {
  padding: 5px 0;
}

.pay-amount {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

.pay-method-group {
  display: flex;
  gap: 12px;
  width: 100%;
}

.method-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
  height: auto;
  margin-right: 0;
}

:deep(.method-option.is-checked),
.method-option.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.method-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.method-text {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.method-desc {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.dialog-footer {
  text-align: right;
}

/* 响应式 */
@media (max-width: 768px) {
  .overview-card {
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
  }
  .pay-method-group {
    flex-direction: column;
  }
  .summary-bar {
    justify-content: center;
  }
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    justify-content: flex-start;
  }
}
</style>
