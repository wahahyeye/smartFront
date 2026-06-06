<template>
  <div class="user-index">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <h3>欢迎使用智慧社区用户端</h3>
          <p>查看您的社区信息与服务</p>
        </div>
      </template>

      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-statistic title="我的物业账单" :value="unpaidBills" :precision="0" />
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-title">车位状态</div>
            <div class="stat-value">{{ parkingStatus }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <el-statistic title="社区公告" :value="noticesCount" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="待处理报修" :value="pendingRepairs" />
        </el-col>
      </el-row>

      <el-divider />

      <h4>最新社区公告</h4>
      <el-timeline>
        <el-timeline-item
          v-for="notice in latestNotices"
          :key="notice.id"
          :timestamp="formatDate(notice.createTime)"
          placement="top"
        >
          <el-card>
            <h4>{{ notice.title }}</h4>
            <p>{{ stripHtml(notice.content) }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-divider />

      <h4>便民服务</h4>
      <el-row :gutter="20" class="service-row">
        <el-col :span="6">
          <el-card @click="goTo('/user/community/payment')" class="service-card">
            <h4>物业缴费</h4>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card @click="goTo('/user/community/repair')" class="service-card">
            <h4>报事维修</h4>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card @click="goTo('/user/community/service')" class="service-card">
            <h4>社区服务</h4>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card @click="goTo('/user/community/notice')" class="service-card">
            <h4>查看公告</h4>
          </el-card>
        </el-col>
      </el-row>

    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { getLatestNotices } from '@/api/notice'

const router = useRouter()
const loading = ref(false)

// 统计卡片数据（从后端获取）
const unpaidBills = ref(0)
const parkingStatus = ref('未绑定')
const noticesCount = ref(0)
const pendingRepairs = ref(0)

// 最新公告（限制6条）
const latestNotices = ref([])

// 获取仪表盘统计 + 公告
const fetchDashboard = async () => {
  loading.value = true
  try {
    const [statsRes, noticeRes] = await Promise.all([
      request.get('/community/dashboard/stats'),
      getLatestNotices()
    ])

    // 填充统计卡片
    if (statsRes.code === 200 && statsRes.data) {
      const s = statsRes.data
      unpaidBills.value = s.unpaidBills ?? 0
      parkingStatus.value = s.parkingStatus || '未绑定'
      noticesCount.value = s.noticesCount ?? 0
      pendingRepairs.value = s.pendingRepairs ?? 0
    }

    // 最新公告（最多6条）
    if (noticeRes.code === 200 && Array.isArray(noticeRes.data)) {
      latestNotices.value = noticeRes.data.slice(0, 6)
    }
  } catch (error) {
    console.error('获取首页数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

// 移除 HTML 标签，截断显示
const stripHtml = (html) => {
  if (!html) return ''
  const text = html.replace(/<[^>]+>/g, '')
  return text.length > 80 ? text.substring(0, 80) + '...' : text
}

onMounted(() => {
  fetchDashboard()
})

const goTo = (path) => {
  router.push(path)
}
</script>

<style scoped>
.card-header h3 {
  margin: 0;
}

.card-header p {
  margin: 4px 0 0;
  color: #888;
}

.user-index {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.service-row {
  margin-top: 10px;
}

.service-card {
  cursor: pointer;
  text-align: center;
  padding: 20px 0;
  transition: all 0.3s;
}

.service-card:hover {
  background-color: #f0f2f5;
  transform: translateY(-2px);
}
</style>
