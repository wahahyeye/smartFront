<template>
  <div class="repair-admin">
    <div class="page-header">
      <h2><i class="icon-repair"></i> 报修管理</h2>
      <div class="header-right">
        <!-- 统计标签 -->
        <div class="stat-tags">
          <el-tag type="warning" effect="dark" round size="large">待处理: {{ statPending }}</el-tag>
          <el-tag type="primary" effect="dark" round size="large">处理中: {{ statProcessing }}</el-tag>
          <el-tag type="success" effect="dark" round size="large">已完成: {{ statDone }}</el-tag>
          <el-tag type="info" effect="dark" round size="large">总计: {{ total }}</el-tag>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 140px;" @change="loadRepairList">
        <el-option label="全部状态" :value="-1" />
        <el-option label="待处理" :value="0" />
        <el-option label="处理中" :value="1" />
        <el-option label="已完成" :value="2" />
      </el-select>

      <div class="header-actions">
        <el-button type="primary" @click="loadRepairList" :loading="loading">
          <el-icon><Search /></el-icon> 查询
        </el-button>
      </div>
    </div>

    <!-- 报修列表 -->
    <el-table
      :data="filteredRepairRecords"
      border
      style="width: 100%"
      v-loading="loading"
      :row-class-name="tableRowClassName"
    >
      <el-table-column label="#" width="55" align="center">
        <template #default="{ $index }">{{ (currentPage - 1) * pageSize + $index + 1 }}</template>
      </el-table-column>
      <el-table-column prop="contactName" label="联系人" width="110" align="center" />
      <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="95" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small" effect="dark">{{ getStatusName(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="contactPhone" label="联系电话" width="125" align="center">
        <template #default="{ row }">{{ row.contactPhone || '-' }}</template>
      </el-table-column>
      <el-table-column prop="address" label="地址" width="160" align="center">
        <template #default="{ row }">{{ row.address || '-' }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="提交时间" width="165" align="center">
        <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="info" size="small" @click="viewDetail(row)">详情</el-button>
          <el-button
            link type="primary"
            size="small"
            @click="openEditDialog(row)"
            :disabled="row.status === 2"
          >处理</el-button>
          <el-button
            link type="danger"
            size="small"
            @click="deleteRepair(row)"
            v-if="row.status === 0 || row.status === 3"
          >删除</el-button>
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="报修详情" width="600px">
      <div class="detail-content" v-if="currentRepair">
        <el-descriptions :column="2" border size="medium">
          <el-descriptions-item label="联系人" :span="1">{{ currentRepair.contactName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前状态" :span="1">
            <el-tag :type="getStatusType(currentRepair.status)" size="small">{{ getStatusName(currentRepair.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ currentRepair.title }}</el-descriptions-item>
          <el-descriptions-item label="详细描述" :span="2">
            <div style="white-space: pre-wrap; line-height: 1.6;">{{ currentRepair.description }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="联系电话" :span="1">{{ currentRepair.contactPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="1">{{ currentRepair.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间" :span="2">{{ formatDateTime(currentRepair.createTime) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 现场照片 -->
        <div class="detail-section" v-if="currentRepair.images">
          <h4>📸 现场照片</h4>
          <el-image :src="currentRepair.images" :preview-src-list="[currentRepair.images]" fit="cover" class="preview-img" />
        </div>

        <!-- 处理结果（文字或图片） -->
        <div class="detail-section" v-if="currentRepair.handleResult && currentRepair.status >= 1">
          <h4>🔧 处理结果</h4>
          <div v-if="currentRepair.handleImages">
            <el-image
              :src="currentRepair.handleImages"
              :preview-src-list="[currentRepair.handleImages]"
              fit="contain"
              class="preview-img result-img"
            />
          </div>
          <div v-else class="result-text">{{ currentRepair.handleResult }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="detailVisible = false; openEditDialog(currentRepair)" v-if="currentRepair?.status !== 2">去处理</el-button>
      </template>
    </el-dialog>

    <!-- 处理/编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="处理报修" width="550px" :close-on-click-modal="false">
      <el-form ref="editFormRef" :model="editFormData" label-width="100px">
        <el-alert :title="`处理报修：${editFormData.title}`" type="info" :closable="false" show-icon style="margin-bottom: 18px;" />

        <el-form-item label="当前状态">
          <el-select v-model="editFormData.status" placeholder="请选择状态" style="width: 100%;">
            <el-option label="待处理" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="已完成" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="处理结果说明">
          <el-input
            v-model="editFormData.handleResultText"
            type="textarea"
            :rows="3"
            placeholder="请填写处理情况说明..."
          />
        </el-form-item>

        <el-form-item label="处理完成照片">
          <el-upload
            action="#"
            list-type="picture-card"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleImageChange"
            :on-remove="handleImageRemove"
            accept="image/*"
          >
            <img v-if="editFormPreviewImg" :src="editFormPreviewImg" class="avatar" />
            <el-icon v-else :size="26"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">可选：上传处理后现场照片作为凭证</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="saving">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { imgUpload, getRepairList, updateRepair } from '@/api/admin'

// ========== 数据状态 ==========
const loading = ref(false)
const saving = ref(false)
const repairRecords = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterStatus = ref(-1)
const filterType = ref('')

// 弹窗控制
const detailVisible = ref(false)
const editDialogVisible = ref(false)
const currentRepair = ref(null)
const editFormRef = ref(null)

// 统计数据
const statPending = computed(() => repairRecords.value.filter(r => r.status === 0).length)
const statProcessing = computed(() => repairRecords.value.filter(r => r.status === 1).length)
const statDone = computed(() => repairRecords.value.filter(r => r.status === 2).length)

// 编辑表单数据
const editFormData = reactive({
  id: '',
  title: '',
  status: 0,
  handleResult: '',
  handleResultText: ''
})
const editFormPreviewImg = ref('')
const tempHandleFile = ref(null)

// 过滤后的记录列表
const filteredRepairRecords = computed(() => {
  let records = repairRecords.value

  // 前端状态过滤
  if (filterStatus.value !== null && filterStatus.value !== undefined && filterStatus.value !== -1) {
    records = records.filter(row => row.status === Number(filterStatus.value))
  }

  return records
})

// ========== 数据加载 ==========
const loadRepairList = async () => {
  loading.value = true
  try {
    const response = await getRepairList({
      current: currentPage.value,
      size: pageSize.value
    })
    if (response.data && response.data.rows) {
      repairRecords.value = response.data.rows
      total.value = response.data.total || 0
    } else {
      repairRecords.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取记录失败:', error)
    ElMessage.error('获取报修记录失败')
    repairRecords.value = []
  } finally {
    loading.value = false
  }
}

// ========== 分页 ==========
const handleSizeChange = (val) => { pageSize.value = val; loadRepairList() }
const handleCurrentChange = (val) => { currentPage.value = val; loadRepairList() }

// ========== 详情查看 ==========
const viewDetail = (row) => {
  currentRepair.value = row
  detailVisible.value = true
}

// 判断是否为图片URL
const isImageUrl = (url) => url && (url.startsWith('http://') || url.startsWith('https://'))

// ========== 编辑/处理 ==========
const openEditDialog = (row) => {
  currentRepair.value = row
  editFormData.id = row.id
  editFormData.title = row.title
  editFormData.status = row.status ?? 0
  editFormData.handleResult = row.handleResult || ''
  editFormData.handleResultText = row.handleResult || ''

  // 区分文字和图片类型的 handleResult
  if (row.handleImages) {
    editFormPreviewImg.value = row.handleImages
    tempHandleFile.value = null
  } else if (row.handleResult && !isImageUrl(row.handleResult)) {
    editFormData.handleResultText = row.handleResult
    editFormPreviewImg.value = ''
  } else {
    editFormData.handleResultText = ''
    editFormPreviewImg.value = ''
  }

  editDialogVisible.value = true
}

const handleImageChange = (file) => {
  tempHandleFile.value = file.raw
  editFormPreviewImg.value = URL.createObjectURL(file.raw)
}

const handleImageRemove = () => {
  editFormPreviewImg.value = ''
  tempHandleFile.value = null
}

const submitEdit = async () => {
  saving.value = true
  try {
    let handleResult = editFormData.handleResultText || ''

    // 如果有新上传的图片，先上传再使用URL
    if (tempHandleFile.value) {
      const uploadData = new FormData()
      uploadData.append('file', tempHandleFile.value)
      const res = await imgUpload(uploadData)
      handleResult = res.data // 使用图片URL作为handleResult
    }

    const updateData = {
      id: editFormData.id,
      status: parseInt(editFormData.status),
      handleResult: handleResult
    }

    await updateRepair(updateData)
    ElMessage.success('操作成功')
    editDialogVisible.value = false
    loadRepairList()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    saving.value = false
  }
}

// ========== 删除报修 ==========
const deleteRepair = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认删除报修「${row.title}」吗？此操作不可恢复。`,
      '确认删除',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
    const token = localStorage.getItem('token')
    await fetch(`/api/community/repair/handle/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 3 })
    }).then(r => r.json())
    ElMessage.success('已标记为已取消')
    loadRepairList()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('操作失败')
  }
}

// ========== 工具函数 ==========
const tableRowClassName = ({ rowIndex }) => rowIndex % 2 === 0 ? 'even-row' : 'odd-row'

const getStatusName = (s) => ({ 0: '待处理', 1: '处理中', 2: '已完成' }[s] ?? '未知')
const getStatusType = (s) => ({ 0: 'warning', 1: 'primary', 2: 'success' }[s] ?? '')

const formatDateTime = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

onMounted(() => { loadRepairList() })
</script>

<style scoped>
.repair-admin {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 120px);
}

/* ====== 页面头部 ====== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header h2 {
  margin: 0;
  font-size: 19px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-repair::before { content: "🔧"; }

.stat-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ====== 筛选栏 ====== */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.header-actions {
  margin-left: auto;
}

/* ====== 表格样式 ====== */
:deep(.even-row) { background-color: #fafafa; }
:deep(.el-table) { border-radius: 4px; overflow: hidden; }
:deep(.el-table__header th) { background-color: #f5f7fa; font-weight: 500; }

.pagination { margin-top: 16px; text-align: right; }

/* ====== 详情弹窗 ====== */
.detail-content { padding: 5px 0; }

.detail-section {
  margin-top: 18px;
}
.detail-section h4 {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.preview-img {
  max-width: 350px;
  max-height: 250px;
  border-radius: 6px;
  border: 1px solid #eee;
}

.result-img { max-width: 420px; }

.result-text {
  padding: 12px 16px;
  background: #f0f9eb;
  border-radius: 6px;
  line-height: 1.7;
  white-space: pre-wrap;
  color: #303133;
}

/* ====== 编辑弹窗 ====== */
.avatar { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
.upload-tip { margin-top: 6px; font-size: 12px; color: #b0b0b0; }
:deep(.el-upload--picture-card) { width: 105px; height: 105px; }
</style>
