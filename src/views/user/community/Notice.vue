<template>
  <div class="notice-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <h1>社区公告</h1>
      <div class="header-divider"></div>
    </div>

    <!-- 搜索框 -->
    <el-input v-model="searchKeyword" placeholder="请输入标题或内容关键字" style="width: 250px; "
      @keyup.enter="loadNotices" />
    <el-button type="primary" @click="loadNotices" style="margin-left: 20px;">
      <el-icon>
        <Search />
      </el-icon>
      查询
    </el-button>

    <!-- 公告详情弹窗 -->
    <el-dialog v-model="dialogVisible" :title="currentNotice.title" width="70%" destroy-on-close>
      <div class="dialog-meta">
        <span class="meta-item time">
          <i class="icon-time"></i> {{ formatDate(currentNotice.updateTime) }}
        </span>
        <span class="meta-item publisher">
          <i class="icon-user"></i> {{ currentNotice.publisherName }}
        </span>
      </div>
      <div class="dialog-content" v-html="currentNotice.content"></div>
    </el-dialog>

    <!-- 公告列表区 -->
    <div class="notice-list">
      <div class="notice-card" v-for="notice in notices" :key="notice.id" @click="openDetail(notice)"
        :class="{ 'clickable': true }">
        <div class="card-header">
          <h2 class="notice-title">{{ notice.title }}</h2>
        </div>
        <div class="card-meta">
          <span class="meta-item time">
            <i class="icon-time"></i> {{ formatDate(notice.updateTime) }}
          </span>
          <span class="meta-item publisher">
            <i class="icon-user"></i> {{ notice.publisherName }}
          </span>
        </div>
        <div class="card-content">
          <!-- 显示截断的内容 -->
          <p v-if="shouldTruncate(notice.content)">
            {{ truncateContent(notice.content) }}
            <span class="read-more">... 查看全文</span>
          </p>
          <p v-else v-html="notice.content"></p>
        </div>
      </div>
    </div>

    <!-- 分页控件 -->
    <div class="pagination-container">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
        layout="total, prev, pager, next" @size-change="loadNotices" @current-change="loadNotices" background
        :pager-count="5" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getNoticeList } from '@/api/community'
import { ElDialog } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)
const dialogVisible = ref(false)
const currentNotice = ref({})
// 内容显示的最大字数限制
const MAX_CONTENT_LENGTH = 150

//模糊搜索数据和选择的状态数据
const searchKeyword = ref('')
const filterStatus = ref(1)

// 日期格式化
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

// 移除HTML标签并截断内容
const truncateContent = (htmlContent) => {
  // 移除HTML标签
  const textContent = htmlContent.replace(/<[^>]+>/g, '')
  // 截断内容
  return textContent.length > MAX_CONTENT_LENGTH
    ? textContent.substring(0, MAX_CONTENT_LENGTH)
    : textContent
}

// 判断是否需要截断
const shouldTruncate = (htmlContent) => {
  const textContent = htmlContent.replace(/<[^>]+>/g, '')
  return textContent.length > MAX_CONTENT_LENGTH
}

// 打开详情弹窗
const openDetail = (notice) => {
  currentNotice.value = { ...notice }
  dialogVisible.value = true
}

// 加载全部公告（后端一次性返回所有已发布公告）
const allNotices = ref([])

const loadNotices = async () => {
  try {
    const res = await getNoticeList()
    // 后端返回 Result<List<Notice>>，data 是数组
    const list = Array.isArray(res?.data) ? res.data : []
    allNotices.value = list
  } catch (error) {
    allNotices.value = []
    console.error('获取公告列表失败:', error)
  }
}

// 客户端过滤 + 分页 + 搜索
const notices = computed(() => {
  let list = allNotices.value
  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(n =>
      (n.title && n.title.toLowerCase().includes(kw)) ||
      (n.content && n.content.toLowerCase().includes(kw))
    )
  }
  // 按状态筛选（status=1 已发布）
  if (filterStatus.value != null) {
    list = list.filter(n => n.status === filterStatus.value)
  }
  total.value = list.length
  // 手动分页
  const start = (currentPage.value - 1) * pageSize.value
  return list.slice(start, start + pageSize.value)
})

onMounted(() => {
  loadNotices()
})
</script>

<style scoped>
.notice-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
}

/* 页面标题 */
.page-header {
  margin-bottom: 40px;
  text-align: center;
}

.page-header h1 {
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 12px;
  font-weight: 600;
}

.header-divider {
  width: 80px;
  height: 3px;
  background-color: #3498db;
  margin: 0 auto;
  border-radius: 3px;
}

/* 公告列表 */
.notice-list {
  display: grid;
  gap: 25px;
  margin-top: 20px;
}

/* 公告卡片 */
.notice-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 25px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.clickable {
  cursor: pointer;
}

.notice-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-header .notice-title {
  font-size: 20px;
  color: #2c3e50;
  margin: 0 0 15px 0;
  font-weight: 500;
  line-height: 1.4;
}

/* 元信息区域 */
.card-meta,
.dialog-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 18px;
  color: #7f8c8d;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-time::before {
  content: "⏰";
}

.icon-user::before {
  content: "👤";
}

/* 内容区域 */
.card-content {
  color: #34495e;
  line-height: 1.8;
  font-size: 16px;
  padding-top: 15px;
  border-top: 1px solid #f1f1f1;
  /* 允许在单词内换行（针对长串字符） */
  word-break: break-all;
  /* 或针对中文优化的换行规则 */
  word-wrap: break-word;
}



.read-more {
  color: #3498db;
  font-weight: 500;
  margin-left: 5px;
}

/* 弹窗内容 */
.dialog-content {
  color: #34495e;
  line-height: 1.8;
  font-size: 16px;
  padding: 15px 0;
  /* 允许在单词内换行（针对长串字符） */
  word-break: break-all;
  /* 或针对中文优化的换行规则 */
  word-wrap: break-word;
}

/* 分页容器 */
.pagination-container {
  margin-top: 40px;
  display: flex;
  justify-content: center;
  padding: 10px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .notice-container {
    padding: 20px 15px;
  }

  .page-header h1 {
    font-size: 24px;
  }

  .notice-card {
    padding: 20px 15px;
  }

  .card-header .notice-title {
    font-size: 18px;
  }

  .card-content,
  .dialog-content {
    font-size: 15px;
  }

  .card-meta,
  .dialog-meta {
    flex-direction: column;
    gap: 5px;
    margin-bottom: 15px;
  }
}
</style>