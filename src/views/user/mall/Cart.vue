<template>
  <div class="cart-page" v-loading="loading">
    <h2>🛒 购物车</h2>

    <div class="address-section" v-if="addresses.length > 0">
      <span class="label">配送地址：</span>
      <el-select v-model="selectedAddress" placeholder="请选择配送地址" class="address-select">
        <el-option v-for="addr in addresses" :key="addr" :label="addr" :value="addr" />
      </el-select>
    </div>

    <el-table :data="items" style="width: 100%" v-if="items.length > 0">
      <el-table-column label="商品图片" width="100">
        <template #default="{ row }">
          <img :src="row.images || row.image || '/static/images/default-product.png'" class="product-image" />
        </template>
      </el-table-column>
      <el-table-column prop="productName" label="商品" min-width="200" />
      <el-table-column label="单价" width="120">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column label="数量" width="160">
        <template #default="{ row }">
          <el-input-number v-model="row.quantity" :min="1" :max="row.stock" @change="updateQuantity(row)" />
        </template>
      </el-table-column>
      <el-table-column label="小计" width="120">
        <template #default="{ row }">¥{{ (row.price * row.quantity).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button type="danger" link @click="remove(row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-else description="购物车是空的，去逛逛吧~" />

    <div class="cart-footer" v-if="items.length > 0">
      <div class="total">合计：<span class="total-price">¥{{ total.toFixed(2) }}</span></div>
      <el-button type="primary" @click="checkout" :disabled="!selectedAddress">去结算</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getCartList, removeFromCart, createOrder, updateCart } from '@/api/mall'
import { getUserAddress } from '@/api/auth'

const loading = ref(false)
const items = ref([])
const addresses = ref([])
const selectedAddress = ref('')

const loadCart = async () => {
  loading.value = true
  try {
    const res = await getCartList()
    items.value = res.data || []
  } catch (err) {
    console.error('获取购物车失败:', err)
    ElMessage.error('获取购物车失败')
  } finally {
    loading.value = false
  }
}

const generateAddresses = () => {
  const addrList = []
  for (let building = 1; building <= 10; building++) {
    for (let floor = 1; floor <= 10; floor++) {
      for (let unit = 1; unit <= 3; unit++) {
        addrList.push(`${building}栋${floor}层${unit}户`)
      }
    }
  }
  return addrList
}

const loadAddresses = async () => {
  try {
    const res = await getUserAddress()
    const data = res.data || res
    const addrList = generateAddresses()
    
    if (data.roomNumber) {
      const userAddr = data.roomNumber
      const index = addrList.indexOf(userAddr)
      if (index > -1) {
        addrList.splice(index, 1)
        addrList.unshift(userAddr)
      }
      selectedAddress.value = userAddr
    } else {
      selectedAddress.value = addrList[0]
    }
    
    addresses.value = addrList
  } catch (err) {
    console.error('获取地址失败:', err)
    const addrList = generateAddresses()
    addresses.value = addrList
    selectedAddress.value = addrList[0]
  }
}

const updateQuantity = async (row) => {
  try {
    await updateCartItem(row.productId, row.quantity)
  } catch (err) {
    ElMessage.error('更新数量失败')
  }
}

const updateCartItem = async (productId, quantity) => {
  await updateCart({ productId, quantity })
}

const remove = async (row) => {
  try {
    await removeFromCart({ productId: row.productId })
    ElMessage.success('移除成功')
    loadCart()
  } catch (err) {
    ElMessage.error('移除失败')
  }
}

const total = computed(() => items.value.reduce((s, r) => s + r.price * r.quantity, 0))

const checkout = async () => {
  if (!selectedAddress.value) {
    ElMessage.warning('请先选择配送地址')
    return
  }
  
  try {
    const order = await createOrder({
      items: items.value.map(i => ({ productId: i.productId, quantity: i.quantity })),
      receiverAddress: selectedAddress.value
    })
    ElMessage.success('订单已创建')
    window.location.href = '/user/mall/orders'
  } catch (err) {
    ElMessage.error('结算失败')
  }
}

onMounted(() => {
  loadCart()
  loadAddresses()
})
</script>

<style scoped>
.cart-page { 
  padding: 20px; 
  background: #fff;
  min-height: 400px;
}
.cart-page h2 {
  margin-bottom: 20px;
  font-size: 20px;
}
.address-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
}
.label {
  display: inline-block;
  width: 80px;
  color: #606266;
}
.address-select {
  width: 300px;
}
.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}
.cart-footer { 
  display:flex; 
  justify-content:space-between; 
  align-items:center; 
  margin-top:20px;
  padding-top:20px;
  border-top: 1px solid #ebeef5;
}
.total { 
  font-size:18px; 
  font-weight:600;
}
.total-price {
  color: #f56c6c;
  font-size: 24px;
}
.cart-footer .el-button {
  padding: 12px 40px;
  font-size: 16px;
}
</style>