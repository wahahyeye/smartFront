<template>
  <div class="repair-container">
    <!-- 报修提交区域 -->
    <div class="repair-form">
      <h2><i class="icon-edit"></i> 提交报修</h2>
      <el-form
        ref="repairForm"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="标题" prop="title">
              <el-input v-model="formData.title" placeholder="请输入报修标题" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="formData.contactName" placeholder="请输入联系人姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述您遇到的问题，包括故障现象、发生时间等..."
            show-word-limit
            maxlength="500"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="方便维修人员联系您的电话号码">
                <template #prefix><span style="font-size: 14px;">📞</span></template>
              </el-input>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="报修地址" prop="address">
              <el-input v-model="formData.address" placeholder="请输入报修地址" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 图片上传 -->
        <el-form-item label="问题照片">
          <el-upload
            action="#"
            list-type="picture-card"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleImageChange"
            :on-remove="handleImageRemove"
            accept="image/*"
            :limit="1"
          >
            <img v-if="formData.images" :src="formData.images" class="avatar" />
            <el-icon v-else :size="28"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">支持 JPG、PNG 格式，最大 2MB，可上传一张现场照片</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" size="large" :loading="submitting">
            <i class="icon-submit"></i> 提交报修
          </el-button>
          <el-button @click="resetForm" size="large">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 报修记录列表 -->
    <div class="repair-list">
      <div class="list-header">
        <h2><i class="icon-list"></i> 我的报修记录</h2>
        <el-select v-model="recordFilterStatus" placeholder="筛选状态" clearable size="small" style="width: 120px;" @change="loadRepairList">
          <el-option label="全部状态" :value="-1" />
          <el-option label="待处理" :value="0" />
          <el-option label="处理中" :value="1" />
          <el-option label="已完成" :value="2" />
        </el-select>
      </div>

      <el-table
        :data="filteredRepairRecords"
        border
        style="width: 100%"
        v-loading="loadingRecords"
        :row-class-name="tableRowClassName"
        empty-text="暂无报修记录"
      >
        <el-table-column label="#" width="55" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="contactName" label="联系人" width="110" align="center" />
        <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="95" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="165" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">查看详情</el-button>
            <el-button
              link type="danger"
              size="small"
              @click="cancelRepair(row)"
              v-if="row.status === 0"
            >取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next"
          background
          small
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="dialogVisible" title="报修详情" width="560px">
      <div class="repair-detail" v-if="currentRepair">
        <el-descriptions :column="2" border size="medium">
          <el-descriptions-item label="联系人" :span="1">{{ currentRepair.contactName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前状态" :span="1">
            <el-tag :type="getStatusType(currentRepair.status)" size="small">{{ getStatusName(currentRepair.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ currentRepair.title }}</el-descriptions-item>
          <el-descriptions-item label="详细描述" :span="2">
            <div style="white-space: pre-wrap; line-height: 1.6;">{{ currentRepair.description }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="联系电话" :span="1">📞 {{ currentRepair.contactPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="1">{{ currentRepair.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间" :span="2">{{ formatDateTime(currentRepair.createTime) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 问题图片 -->
        <div class="detail-images" v-if="currentRepair.images">
          <h4>📸 现场照片</h4>
          <el-image
            :src="currentRepair.images"
            :preview-src-list="[currentRepair.images]"
            fit="cover"
            class="preview-image"
          />
        </div>

        <!-- 处理结果 -->
        <div class="handle-result" v-if="currentRepair.handleResult && (currentRepair.status === 2)">
          <el-divider content-position="left"><span>🔧 处理结果</span></el-divider>
          <div v-if="currentRepair.handleImages" class="handle-images">
            <el-image
              :src="currentRepair.handleImages"
              :preview-src-list="[currentRepair.handleImages]"
              fit="contain"
              class="preview-image handle-img"
            />
          </div>
          <div v-else class="handle-text">
            {{ currentRepair.handleResult }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="danger" plain v-if="currentRepair?.status === 0" @click="cancelRepair(currentRepair); dialogVisible = false">
          取消此报修
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { submitRepair, getUserRepairList as getRepairList, imgUpload } from '@/api/user'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 表单数据
const formData = reactive({
  title: '',
  description: '',
  contactName: '',
  contactPhone: '',
  address: '',
  images: '',
  userId: userStore.userInfo.id
})

// 表单校验规则
const rules = {
  title: [
    { required: true, message: '请输入报修标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在2-50个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入详细描述', trigger: 'blur' },
    { min: 10, message: '描述至少10个字符', trigger: 'blur' }
  ],
  contactName: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入报修地址', trigger: 'blur' }
  ]
}

const repairForm = ref(null)
const submitting = ref(false)
const tempFile = ref(null)

// 列表数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const repairRecords = ref([])
const loadingRecords = ref(false)
const recordFilterStatus = ref(-1)
const dialogVisible = ref(false)
const currentRepair = ref(null)

// 过滤后的列表（前端按状态过滤）
const filteredRepairRecords = computed(() => {
  if (recordFilterStatus.value === -1 || recordFilterStatus.value === null || recordFilterStatus.value === '') {
    return repairRecords.value
  }
  return repairRecords.value.filter(row => row.status === Number(recordFilterStatus.value))
})

// ========== 图片处理 ==========
const handleImageChange = (file) => {
  tempFile.value = file.raw
  formData.images = URL.createObjectURL(file.raw)
}

const handleImageRemove = () => {
  formData.images = ''
  tempFile.value = null
}

const disabledDate = (time) => time.getTime() < Date.now() - 8.64e7

// ========== 提交报修 ==========
const submitForm = async () => {
  if (!repairForm.value) return

  try {
    await repairForm.value.validate()

    submitting.value = true

    // 先上传图片
    if (tempFile.value) {
      const uploadData = new FormData()
      uploadData.append('file', tempFile.value)
      const res = await imgUpload(uploadData)
      formData.images = res.data
    }

    await submitRepair(formData)
    ElMessage.success('报修提交成功，我们将尽快安排处理')
    resetForm()
    loadRepairList()
  } catch (error) {
    console.error('提交失败:', error)
    if (error !== 'cancel') {
      ElMessage.error('提交失败，请检查信息后重试')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  if (repairForm.value) repairForm.value.resetFields()
  formData.images = ''
  tempFile.value = null
  formData.userId = userStore.userInfo.id
}

// ========== 取消报修 ==========
const cancelRepair = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认要取消报修「${row.title}」吗？取消后需重新提交。`,
      '确认取消',
      { confirmButtonText: '确认取消', cancelButtonText: '返回', type: 'warning' }
    )

    // 调用后端接口更新状态为已取消(3)
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/community/repair/handle/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 3 })
    }).then(r => r.json())

    if (res.code === 200) {
      ElMessage.success('报修已取消')
      loadRepairList()
    } else {
      ElMessage.error(res.message || '取消失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('操作失败，请重试')
    }
  }
}

// ========== 数据加载 ==========
const loadRepairList = async () => {
  loadingRecords.value = true
  try {
    const response = await getRepairList({
      current: currentPage.value,
      size: pageSize.value,
      userId: userStore.userInfo.id
    })

    if (response.data && response.data.rows) {
      repairRecords.value = response.data.rows
      total.value = response.data.total || 0
    } else {
      repairRecords.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取报修记录失败:', error)
    repairRecords.value = []
    total.value = 0
  } finally {
    loadingRecords.value = false
  }
}

// ========== 分页 ==========
const handleSizeChange = (val) => { pageSize.value = val; loadRepairList() }
const handleCurrentChange = (val) => { currentPage.value = val; loadRepairList() }

// ========== 查看详情 ==========
const viewDetail = (row) => { currentRepair.value = row; dialogVisible.value = true }

// ========== 工具函数 ==========
const tableRowClassName = ({ rowIndex }) => rowIndex % 2 === 0 ? 'even-row' : 'odd-row'

const getStatusName = (status) => ({
  0: '待处理',
  1: '处理中',
  2: '已完成',
  3: '已取消'
}[status] ?? '未知')

const getStatusType = (status) => ({
  0: 'warning',
  1: 'primary',
  2: 'success',
  3: 'info'
}[status] ?? '')

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
.repair-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
}

/* ====== 提交表单 ====== */
.repair-form,
.repair-list {
  background: #fff;
  padding: 22px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

h2 {
  margin-top: 0;
  margin-bottom: 18px;
  color: #303133;
  font-size: 17px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-edit::before { content: "✏️"; }
.icon-submit::before { content: "📤 "; margin-right: 4px; }
.icon-list::before { content: "📋"; }

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.upload-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #b0b0b0;
}

/* ====== 列表区域 ====== */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.list-header h2 {
  margin: 0;
  font-size: 17px;
}

/* ====== 详情弹窗 ====== */
.repair-detail {
  padding: 5px 0;
}

.detail-images,
.handle-result {
  margin-top: 16px;
}

.preview-image {
  max-width: 350px;
  max-height: 250px;
  border-radius: 6px;
  border: 1px solid #eee;
}

.handle-img {
  max-width: 400px;
}

.handle-text {
  padding: 12px 16px;
  background: #f0f9eb;
  border-radius: 6px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

/* ====== 表格样式 ====== */
:deep(.even-row) { background-color: #fafafa; }
:deep(.el-upload--picture-card) {
  width: 110px;
  height: 110px;
}
:deep(.el-upload--picture-card i) { font-size: 24px; }
</style>
