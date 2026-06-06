<template>
  <div class="mall-home" v-loading="loading">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
          v-model="searchQuery"
          placeholder="搜索商品..."
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button :icon="Search" @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 促销专区 -->
    <div class="promotion-section" v-if="promotionProducts.length">
      <h2 class="section-title">🔥 促销商品</h2>
      <el-row :gutter="20">
        <el-col :span="6" v-for="product in promotionProducts" :key="'promo-'+product.id">
          <el-card shadow="hover" class="product-card" @click="goToDetail(product.id)">
            <img :src="product.images || product.image || '/static/images/default-product.png'" class="product-image" alt="商品图片" />
            <div class="product-info">
              <h3 :title="product.name">{{ product.name }}</h3>
              <div class="price">
                <span class="promotion-price">¥{{ product.price }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 全部商品 -->
    <div class="all-products">
      <h2 class="section-title">🛒 全部商品</h2>

      <!-- 空状态处理 -->
      <el-empty v-if="!loading && products.length === 0" description="暂无相关商品" />

      <el-row :gutter="20" v-else>
        <el-col :span="6" v-for="product in products" :key="product.id">
          <el-card shadow="hover" class="product-card" @click="goToDetail(product.id)">
            <img :src="product.images || product.image || '/static/images/default-product.png'" class="product-image" alt="商品图片" />
            <div class="product-info">
              <h3 :title="product.name">{{ product.name }}</h3>
              <div class="price">¥{{ product.price }}</div>
              <div class="store" v-if="product.storeName">{{ product.storeName }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 分页 -->
      <div class="pagination" v-if="total > 0">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[12, 24, 36, 48]"
            layout="total, sizes, prev, pager, next"
            background
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getProductList } from '@/api/mall'

const router = useRouter()
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const products = ref([])
const promotionProducts = ref([])

// 获取普通商品列表
const loadProducts = async () => {
  loading.value = true
  try {
    const res = await getProductList({
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchQuery.value
    })
    // 后端 PageResult 返回 rows 和 total
    const data = res.data || res
    products.value = data.rows || data.records || []
    total.value = data.total || 0
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 获取促销商品
const loadPromotionProducts = async () => {
  try {
    const res = await getProductList({
      page: 1,
      size: 4,
      isPromotion: true
    })
    const data = res.data || res
    promotionProducts.value = data.rows || data.records || []
  } catch (error) {
    console.error('获取促销商品失败:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadProducts()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 改变每页条数时，重置到第一页
  loadProducts()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadProducts()
}

const goToDetail = (id) => {
  router.push(`/user/mall/product/${id}`)
}

onMounted(() => {
  loadProducts()
  loadPromotionProducts()
})
</script>

<style scoped>
.mall-home {
  padding: 20px;
  max-width: 1200px; /* 限制最大宽度，居中显示更美观 */
  margin: 0 auto;
}

.search-bar {
  margin-bottom: 30px;
}

.search-input {
  width: 500px;
  margin: 0 auto;
  display: block;
}

.section-title {
  margin-bottom: 15px;
  font-size: 20px;
  color: #333;
}

.product-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
  background-color: #f5f7fa; /* 图片加载前的占位背景色 */
}

.product-info {
  padding: 10px 0 0;
}

.product-info h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price {
  margin-top: 10px;
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.promotion-price {
  color: #f56c6c;
  margin-right: 10px;
}

.original-price {
  color: #999;
  text-decoration: line-through;
  font-size: 14px;
  font-weight: normal;
}

.store {
  margin-top: 5px;
  font-size: 12px;
  color: #999;
}

.pagination {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}
</style>