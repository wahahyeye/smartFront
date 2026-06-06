<template>
  <div class="product-detail" v-loading="loading">
    <el-row :gutter="20">
      <el-col :span="10">
        <el-image :src="product.images || product.image || '/static/images/default-product.png'" fit="contain" style="width:100%;height:400px;" />
      </el-col>
      <el-col :span="14">
        <h2>{{ product.name }}</h2>
        <div class="price">¥{{ product.price }}</div>
        <div class="stock">库存：{{ product.stock }}</div>
        <div class="store">门店：{{ product.storeName }}</div>

        <div class="quantity-section">
          <span class="label">数量：</span>
          <el-input-number v-model="quantity" :min="1" :max="product.stock" />
        </div>

        <div class="address-section">
          <span class="label">配送地址：</span>
          <el-select v-model="selectedAddress" placeholder="请选择配送地址" class="address-select">
            <el-option v-for="addr in addresses" :key="addr" :label="addr" :value="addr" />
          </el-select>
        </div>

        <div class="button-group">
          <el-button type="primary" @click="handleAddToCart">加入购物车</el-button>
          <el-button type="success" @click="handleBuyNow">立即购买</el-button>
        </div>

        <div class="description" v-html="product.description || '暂无商品描述'" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getProductDetail, addToCart, createOrder } from '@/api/mall';
import { getUserAddress } from '@/api/auth';
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const product = ref({});
const quantity = ref(1);
const addresses = ref([]);
const selectedAddress = ref('');
const loadProduct = async () => {
 loading.value = true;
 try {
 const id = route.params.id;
 const res = await getProductDetail(id);
 product.value = res.data || res;
 }
 catch (err) {
 console.error('获取商品详情失败:', err);
 ElMessage.error('获取商品详情失败');
 }
 finally {
 loading.value = false;
 }
};
const generateAddresses = () => {
 const addrList = [];
 for (let building = 1; building <= 10; building++) {
 for (let floor = 1; floor <= 10; floor++) {
 for (let unit = 1; unit <= 3; unit++) {
 addrList.push(`${building}栋${floor}层${unit}户`);
 }
 }
 }
 return addrList;
};

const loadAddresses = async () => {
 try {
 const res = await getUserAddress();
 const data = res.data || res;
 const addrList = generateAddresses();
 
 if (data.roomNumber) {
 const userAddr = data.roomNumber;
 const index = addrList.indexOf(userAddr);
 if (index > -1) {
 addrList.splice(index, 1);
 addrList.unshift(userAddr);
 }
 selectedAddress.value = userAddr;
 } else {
 selectedAddress.value = addrList[0];
 }
 
 addresses.value = addrList;
 }
 catch (err) {
 console.error('获取地址失败:', err);
 const addrList = generateAddresses();
 addresses.value = addrList;
 selectedAddress.value = addrList[0];
 }
};
const handleAddToCart = async () => {
 if (!selectedAddress.value) {
 ElMessage.warning('请先选择配送地址');
 return;
 }
 try {
 await addToCart({
 productId: product.value.id,
 quantity: quantity.value
 });
 ElMessage.success('已加入购物车');
 }
 catch (err) {
 ElMessage.error('加入购物车失败');
 }
};
const handleBuyNow = async () => {
 if (!selectedAddress.value) {
 ElMessage.warning('请先选择配送地址');
 return;
 }
 try {
 const order = await createOrder({
 items: [{ productId: product.value.id, quantity: quantity.value }],
 address: selectedAddress.value
 });
 ElMessage.success('订单创建成功');
 router.push('/user/mall/orders');
 }
 catch (err) {
 ElMessage.error('购买失败');
 }
};
onMounted(() => {
 loadProduct();
 loadAddresses();
});
</script>

<style scoped>
.product-detail { 
  padding: 20px; 
  background: #fff; 
}
.price { 
  font-size: 28px; 
  color: #f56c6c; 
  margin: 15px 0; 
  font-weight: bold;
}
.stock, .store { 
  color: #909399; 
  margin-bottom: 10px;
  font-size: 14px;
}
.quantity-section, .address-section {
  margin: 20px 0;
}
.label {
  display: inline-block;
  width: 80px;
  color: #606266;
}
.address-select {
  width: 300px;
}
.button-group {
  margin: 25px 0;
}
.button-group .el-button {
  margin-right: 15px;
  padding: 12px 30px;
  font-size: 16px;
}
.description { 
  margin-top: 30px; 
  color: #606266;
  line-height: 1.8;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>