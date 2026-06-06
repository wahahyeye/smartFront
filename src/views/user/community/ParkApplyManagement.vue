<template>
  <div class="application-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button size="small" @click="goBack" plain>
        <el-icon><ArrowLeft /></el-icon> 返回上一级
      </el-button>
      <h2>我的车位申请</h2>
      <el-tag :type="stats.pending > 0 ? 'warning' : 'success'" effect="dark" size="large" v-if="stats.total > 0">
        共 {{ stats.total }} 条记录 · {{ stats.approved }} 已通过
      </el-tag>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" v-if="stats.total > 0" class="stat-row">
      <el-col :xs="8" :sm="6">
        <div class="stat-card pending">
          <span class="stat-num">{{ stats.pending }}</span>
          <span class="stat-label">待审批</span>
        </div>
      </el-col>
      <el-col :xs="8" :sm="6">
        <div class="stat-card approved">
          <span class="stat-num">{{ stats.approved }}</span>
          <span class="stat-label">已同意</span>
        </div>
      </el-col>
      <el-col :xs="8" :sm="6">
        <div class="stat-card rejected">
          <span class="stat-num">{{ stats.rejected }}</span>
          <span class="stat-label">已退回</span>
        </div>
      </el-col>
    </el-row>

    <!-- 申请列表表格 -->
    <el-table
      :data="applications"
      border
      style="width: 100%"
      v-loading="loading"
      :row-class-name="tableRowClassName"
      empty-text="暂无车位申请记录，请前往车位列表申请"
    >
      <el-table-column label="#" width="55" align="center">
        <template #default="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>

      <el-table-column prop="parkSpaceId" label="车位ID" width="100" align="center" />

      <el-table-column prop="plateNumber" label="车牌号" width="130" align="center">
        <template #default="scope">
          <strong>{{ scope.row.plateNumber || '-' }}</strong>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag
            v-if="scope.row.status === 0"
            size="small"
            type="warning"
            effect="dark"
          >⏳ 待审批</el-tag>
          <el-tag
            v-else-if="scope.row.status === 1"
            size="small"
            type="success"
            effect="dark"
          >✓ 已同意</el-tag>
          <el-tag
            v-else-if="scope.row.status === 2"
            size="small"
            type="danger"
            effect="dark"
          >✗ 已退回</el-tag>
          <el-tag v-else size="small">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="申请时间" width="175" align="center">
        <template #default="scope">{{ formatTime(scope.row.createTime) }}</template>
      </el-table-column>

      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            size="small"
            @click="handleEdit(scope.row)"
            :disabled="scope.row.status !== 0"
          >
            修改信息
          </el-button>
          <el-button
            link
            type="danger"
            size="small"
            @click="handleWithdraw(scope.row)"
            :disabled="scope.row.status !== 0"
          >
            撤回
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态提示 -->
    <div class="empty-action" v-if="!loading && applications.length === 0">
      <el-empty description="您还没有提交过车位申请">
        <el-button type="primary" @click="$router.push('/user/community/parkspace')">
          去申请车位
        </el-button>
      </el-empty>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="修改车位申请" width="450px" :close-on-click-modal="false">
      <el-form :model="editForm" ref="editFormRef" :rules="editRules" label-width="90px">
        <el-form-item label="车位ID">
          <el-input :value="editForm.parkSpaceId" disabled />
        </el-form-item>
        <el-form-item label="车牌号" prop="plateNumber">
          <el-input v-model="editForm.plateNumber" placeholder="请输入车牌号（如：粤A12345）" />
        </el-form-item>
        <el-alert type="info" :closable="false" show-icon style="margin-top: 10px;">
          提示：修改后需重新等待管理员审批
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="editing">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getParkSpaceApplication, createParkSpaceApplication } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { ArrowLeft } from '@element-plus/icons-vue'

const userStore = useUserStore()
const applications = ref([])
const loading = ref(false)

// 统计数据
const stats = computed(() => {
  const total = applications.value.length
  const pending = applications.value.filter(a => a.status === 0 || a.status === '0').length
  const approved = applications.value.filter(a => a.status === 1 || a.status === '1').length
  const rejected = applications.value.filter(a => a.status === 2 || a.status === '2').length
  return { total, pending, approved, rejected }
})

// ========== 数据加载 ==========
const fetchApplications = async () => {
  if (!userStore.userInfo?.id) {
    ElMessage.warning('请先登录')
    return
  }
  loading.value = true
  try {
    const res = await getParkSpaceApplication({ userId: userStore.userInfo.id })
    if (res.code === 200) {
      applications.value = Array.isArray(res.data) ? res.data : []
    } else {
      ElMessage.error(res.message || '获取申请列表失败')
      applications.value = []
    }
  } catch (error) {
    console.error('获取申请列表失败:', error)
    ElMessage.error('加载数据失败')
    applications.value = []
  } finally {
    loading.value = false
  }
}

// ========== 修改申请 ==========
const editDialogVisible = ref(false)
const editing = ref(false)
const editFormRef = ref(null)
const editForm = reactive({ id: '', parkSpaceId: '', plateNumber: '' })
const editRules = {
  plateNumber: [
    { required: true, message: '请输入车牌号', trigger: 'blur' },
    { pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼A-Z]{1}[A-Z]{1}[A-HJN-P-Z0-9]{5}$/, message: '格式错误（如：粤A12345）', trigger: 'blur' }
  ]
}

const handleEdit = (row) => {
  editForm.id = row.id
  editForm.parkSpaceId = row.parkSpaceId || row.spaceNumber || ''
  editForm.plateNumber = row.plateNumber || row.carNumber || ''
  editDialogVisible.value = true
}

const submitEdit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate()

  editing.value = true
  try {
    // 通过重新提交来实现修改（后端暂无独立更新接口）
    await createParkSpaceApplication({
      userId: userStore.userInfo?.id,
      parkSpaceId: editForm.parkSpaceId,
      plateNumber: editForm.plateNumber
    })
    ElMessage.success('修改已提交，等待重新审批')
    editDialogVisible.value = false
    fetchApplications()
  } catch (err) {
    console.error('修改失败:', err)
    ElMessage.error('修改失败，请重试')
  } finally {
    editing.value = false
  }
}

// ========== 撤回申请 ==========
const handleWithdraw = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要撤回车位「${row.parkSpaceId || row.id}」的申请吗？`,
      '确认撤回',
      { confirmButtonText: '确认撤回', cancelButtonText: '返回', type: 'warning' }
    )

    const token = localStorage.getItem('token')
    const res = await fetch(`/api/community/park/approve/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 2 })
    }).then(r => r.json())

    if (res.code === 200) {
      ElMessage.success('申请已撤回')
      fetchApplications()
    } else {
      ElMessage.error(res.message || '撤回失败')
    }
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('撤回失败')
  }
}

// ========== 工具函数 ==========
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const tableRowClassName = ({ rowIndex }) => rowIndex % 2 === 0 ? 'even-row' : 'odd-row'

const goBack = () => window.history.back()

onMounted(() => { fetchApplications() })
</script>

<style scoped>
.application-management {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 120px);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  flex: 1;
}

/* ====== 统计卡片 ====== */
.stat-row {
  margin-bottom: 18px;
}

.stat-card {
  text-align: center;
  padding: 14px 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card.pending { background: linear-gradient(135deg, #fff3e0, #ffe0b2); }
.stat-card.approved { background: linear-gradient(135deg, #e8f5e9, #c8e6c9); }
.stat-card.rejected { background: linear-gradient(135deg, #fbe9e7, #ffccbc); }

.stat-num {
  font-size: 26px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

/* ====== 表格样式 ====== */
:deep(.even-row) { background-color: #fafafa; }
:deep(.el-table) { border-radius: 4px; overflow: hidden; }
:deep(.el-table__header th) { background-color: #f5f7fa; font-weight: 500; }

.empty-action {
  text-align: center;
  padding: 30px 0;
}
</style>
