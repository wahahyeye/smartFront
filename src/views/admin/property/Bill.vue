<template>
  <div class="bill-management">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <div class="left-actions">
        <el-button type="primary" @click="openFeeSetting('property')" :loading="loading">
          <el-icon><Tools /></el-icon> 设置物业费
        </el-button>
        <el-button type="success" @click="openFeeSetting('parking')" :loading="loading">
          <el-icon><Tools /></el-icon> 设置停车费
        </el-button>
        <el-button type="warning" @click="openFeeSetting('other')" :loading="loading">
          <el-icon><Tools /></el-icon> 设置其他费用
        </el-button>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-bar">
        <div class="stat-item total">
          <span class="stat-label">总记录</span>
          <strong>{{ stats.total }}</strong>
        </div>
        <div class="stat-item paid">
          <span class="stat-label">已支付</span>
          <strong>{{ stats.paid }}</strong>
        </div>
        <div class="stat-item pending">
          <span class="stat-label">待支付</span>
          <strong>{{ stats.pending }}</strong>
        </div>
        <div class="stat-item amount">
          <span class="stat-label">总金额</span>
          <strong>¥{{ stats.totalAmount.toFixed(2) }}</strong>
        </div>
      </div>
    </div>

    <!-- 筛选与操作栏 -->
    <div class="operation-bar">
      <el-select v-model="filterStatus" placeholder="支付状态" clearable style="width: 130px;">
        <el-option label="全部状态" :value="-1" />
        <el-option label="待支付" :value="0" />
        <el-option label="已支付" :value="1" />
        <el-option label="已退款" :value="2" />
      </el-select>

      <el-button type="primary" @click="loadBills" :loading="loading" style="margin-left: 12px;">
        <el-icon><Search /></el-icon> 查询
      </el-button>

      <el-button type="success" @click="exportToExcel" :loading="exporting" :disabled="allBillList.length === 0">
        <el-icon><Download /></el-icon> 导出Excel
      </el-button>
    </div>

    <!-- 缴费表格 -->
    <div class="table-container">
      <el-table
        :data="filteredBillList"
        border
        v-loading="loading"
        style="width: 100%"
        :row-class-name="tableRowClassName"
        empty-text="暂无缴费记录"
      >
        <el-table-column label="#" width="55" align="center">
          <template #default="{ $index }">{{ (currentPage - 1) * pageSize + $index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="id" label="订单ID" width="80" align="center" />
        <el-table-column prop="userId" label="用户ID" width="80" align="center">
          <template #default="scope">
            {{ scope.row.userId || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="typeName" label="费用类型" width="130" align="center">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)" size="small" effect="dark">{{ scope.row.typeName || getTypeName(scope.row.type) || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(元)" width="110" align="center">
          <template #default="scope">
            <span style="font-weight: bold; color: #e6a23c;">¥{{ Number(scope.row.amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="支付状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)" size="small" effect="dark">{{ getStatusName(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payTime" label="支付时间" width="165" align="center">
          <template #default="scope">{{ scope.row.payTime || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="165" align="center">
          <template #default="scope">{{ formatTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="editBill(scope.row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="deleteBill(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          :page-sizes="[10, 20, 30, 50]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" title="编辑缴费订单" width="500px">
      <el-form ref="editFormRef" :model="editFormData" label-width="100px">
        <el-descriptions :column="1" border size="small" style="margin-bottom: 16px;" :label-width="90">
          <el-descriptions-item label="订单ID">{{ editFormData.id }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ editFormData.userId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ Number(editFormData.amount).toFixed(2) }}</el-descriptions-item>
        </el-descriptions>

        <el-form-item label="支付状态">
          <el-select v-model="editFormData.status" style="width: 100%;">
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已退款" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付时间">
          <el-input v-model="editFormData.payTime" placeholder="如：2024-01-01 12:00:00" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存修改</el-button>
      </template>
    </el-dialog>

    <!-- 费用设置对话框 -->
    <el-dialog v-model="feeDialogVisible" :title="`设置${feeTypeLabel}`" width="480px">
      <el-alert
        :title="`正在配置：${feeTypeLabel}`"
        description="修改后将影响用户的应缴费用显示"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 18px;"
      />
      <el-form ref="feeFormRef" :model="feeFormData" label-width="90px">
        <el-form-item label="费用名称">
          <el-input v-model="feeFormData.name" placeholder="请输入费用名称" />
        </el-form-item>
        <el-form-item label="费用金额" required>
          <el-input-number v-model="feeFormDataNum" :min="0" :precision="2" :step="10" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="feeFormData.unit" placeholder="如：元/月" />
        </el-form-item>
        <el-form-item label="描述说明">
          <el-input v-model="feeFormData.description" type="textarea" :rows="3" placeholder="请输入费用描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="feeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFeeSetting" :loading="savingFee">保存设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download, Tools } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import {
  getPropertyPaymentList,
  updatePropertyPayment,
  deletePropertyPayment
} from '@/api/admin'
import { getFeeByType, updateFee } from '@/api/fee'

// ========== 数据状态 ==========
const loading = ref(false)
const exporting = ref(false)
const savingFee = ref(false)
const billList = ref([])
const allBillList = ref([]) // 全量数据用于导出和前端过滤
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const filterStatus = ref(-1)
const dialogVisible = ref(false)
const editFormRef = ref(null)
const editFormData = ref({})

// 费用设置相关
const feeDialogVisible = ref(false)
const currentFeeType = ref('')
const feeFormData = reactive({ name: '', amount: '', unit: '', description: '' })
const feeFormDataNum = ref(0)
const feeFormRef = ref(null)

// ========== 统计计算（基于全量数据） ==========
const stats = computed(() => {
  const list = allBillList.value
  return {
    total: list.length,
    paid: list.filter(i => i.status === 1).length,
    pending: list.filter(i => i.status === 0).length,
    totalAmount: list.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  }
})

const feeTypeLabel = computed(() => {
  const labels = { property: '物业费', parking: '停车费', other: '其他费用' }
  return labels[currentFeeType.value] || '费用'
})

// 前端过滤（基于全量数据）
const filteredBillList = computed(() => {
  let list = billList.value

  // 如果有筛选条件，在前端二次过滤
  if (filterStatus.value !== -1 && filterStatus.value !== null && filterStatus.value !== undefined && filterStatus.value !== '') {
    list = list.filter(i => i.status === filterStatus.value)
  }

  // 分页截取
  const start = (currentPage.value - 1) * pageSize.value
  return list.slice(start, start + pageSize.value)
})

// ========== 数据加载 ==========
const loadBills = async () => {
  loading.value = true
  try {
    const res = await getPropertyPaymentList({
      currentPage: 1,
      pageSize: 9999 // 获取全部数据用于前端过滤和统计
    })
    if (res.code === 200) {
      allBillList.value = res.data?.rows || []
      billList.value = allBillList.value.slice(0, pageSize.value)
      total.value = allBillList.value.length
    } else {
      ElMessage.error(res.message || '获取缴费记录失败')
      allBillList.value = []
      billList.value = []
      total.value = 0
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('请求失败')
  } finally {
    loading.value = false
  }
}

// ========== 编辑操作 ==========
const editBill = (row) => {
  editFormData.value = { ...row }
  dialogVisible.value = true
}

const submitEdit = async () => {
  try {
    await updatePropertyPayment(editFormData.value)
    ElMessage.success('修改成功')
    dialogVisible.value = false
    loadBills()
  } catch (err) {
    console.error(err)
    ElMessage.error('修改失败')
  }
}

// ========== 删除操作 ==========
const deleteBill = async (row) => {
  ElMessageBox.confirm(`确认删除订单 ${row.id} 吗？`, '删除确认', { type: 'warning' })
    .then(async () => {
      await deletePropertyPayment(row.id)
      ElMessage.success('删除成功')
      loadBills()
    })
    .catch(() => {})
}

// ========== 费用设置 ==========
const openFeeSetting = async (feeType) => {
  currentFeeType.value = feeType
  try {
    const res = await getFeeByType(feeType)
    if (res.code === 200 && res.data) {
      feeFormData.name = res.data.name || ''
      feeFormDataNum.value = Number(res.data.amount || res.data.unitPrice || 0)
      feeFormData.unit = res.data.unit || ''
      feeFormData.description = res.data.description || ''
    } else {
      feeFormData.name = ''
      feeFormDataNum.value = 0
      feeFormData.unit = ''
      feeFormData.description = ''
    }
  } catch (err) {
    console.error('获取费用配置失败:', err)
  }
  feeDialogVisible.value = true
}

const submitFeeSetting = async () => {
  if (!feeFormDataNum.value) {
    ElMessage.warning('请输入费用金额')
    return
  }
  savingFee.value = true
  try {
    const data = {
      name: feeFormData.name,
      amount: feeFormDataNum.value.toString(),
      unit: feeFormData.unit,
      description: feeFormData.description
    }
    const res = await updateFee(currentFeeType.value, data)
    if (res.code === 200) {
      ElMessage.success('设置成功')
      feeDialogVisible.value = false
    } else {
      ElMessage.error(res.message || '设置失败')
    }
  } catch (err) {
    console.error('更新费用配置失败:', err)
    ElMessage.error('设置失败')
  } finally {
    savingFee.value = false
  }
}

// ========== Excel导出 ==========
const exportToExcel = async () => {
  exporting.value = true
  try {
    let rows = [...allBillList.value]
    if (filterStatus.value !== -1 && filterStatus.value !== '' && filterStatus.value != null) {
      rows = rows.filter(i => i.status === filterStatus.value)
    }
    if (rows.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    const exportData = rows.map((r, i) => ({
      '序号': i + 1,
      '订单ID': r.id,
      '用户ID': r.userId,
      '费用项目ID': r.feeConfigId || '-',
      '金额(元)': Number(r.amount).toFixed(2),
      '支付状态': getStatusName(r.status),
      '支付时间': r.payTime || '-',
      '创建时间': formatTime(r.createTime)
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '物业缴费账单')
    XLSX.writeFile(wb, `物业缴费账单_${new Date().toISOString().slice(0, 10)}.xlsx`)
    ElMessage.success(`成功导出 ${rows.length} 条记录`)
  } catch (err) {
    console.error('导出失败:', err)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// ========== 分页处理 ==========
const handleSizeChange = (val) => { pageSize.value = val; currentPage.value = 1 }
const handleCurrentChange = (val) => { currentPage.value = val }

// ========== 工具函数 ==========
const tableRowClassName = ({ rowIndex }) => rowIndex % 2 === 0 ? 'even-row' : 'odd-row'

const formatTime = (t) => t ? new Date(t).toLocaleString('zh-CN') : '-'

const getStatusName = (s) => ({
  0: '待支付',
  1: '已支付',
  2: '已退款'
}[s] || s || '-')

const getStatusTag = (s) => ({
  0: 'warning',
  1: 'success',
  2: 'info'
}[s] || '')

const getTypeName = (t) => ({
  property: '物业管理费',
  parking: '停车费',
  other: '其他费用'
}[t] || t || '-')

const getTypeTag = (t) => ({
  property: '',
  parking: 'success',
  other: 'warning'
}[t] || 'info')

onMounted(() => loadBills())
</script>

<style scoped>
.bill-management {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 120px);
}

/* ====== 顶部栏 ====== */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 14px;
}

.left-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stats-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-item {
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-item.total { background: linear-gradient(135deg, #e8f4fd, #d4e9fa); }
.stat-item.paid { background: linear-gradient(135deg, #f0f9eb, #e1f3d8); }
.stat-item.pending { background: linear-gradient(135deg, #fdf6ec, #faecd8); }
.stat-item.amount { background: linear-gradient(135deg, #fef0f0, #fde2e2); }

.stat-item .stat-label { font-size: 12px; color: #666; }
.stat-item strong { font-size: 17px; color: #303133; }
.stat-item.amount strong { color: #f56c6c; font-size: 18px; }

/* ====== 操作栏 ====== */
.operation-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  align-items: center;
  flex-wrap: wrap;
}

.table-container { width: 100%; }

/* ====== 表格样式 ====== */
:deep(.even-row) { background-color: #fafafa; }
:deep(.el-table) { border-radius: 4px; overflow: hidden; }
:deep(.el-table__header th) { background-color: #f5f7fa; font-weight: 500; }

.pagination { margin-top: 16px; text-align: right; }
.dialog-footer { text-align: right; }

@media (max-width: 768px) {
  .top-bar { flex-direction: column; align-items: stretch; }
  .stats-bar { justify-content: center; }
  .operation-bar { flex-direction: column; }
}
</style>
