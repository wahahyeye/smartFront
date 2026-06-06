<template>
	<div class="service-container">
		<el-card>
			<template #header>
				<div class="card-header">
					<h3>便民服务</h3>
				</div>
			</template>

			<el-tabs v-model="activeTab" type="border-card">
				<!-- Tab 1: 社区商铺服务 -->
				<el-tab-pane label="社区服务" name="services">
					<div class="service-panel">
						<!-- 服务分类筛选 -->
						<div class="filter-bar">
							<el-radio-group v-model="serviceCategory" size="small" @change="filterServices">
								<el-radio-button value="">全部</el-radio-button>
								<el-radio-button value="家政">家政服务</el-radio-button>
								<el-radio-button value="维修">维修服务</el-radio-button>
								<el-radio-button value="餐饮">餐饮美食</el-radio-button>
								<el-radio-button value="购物">便利购物</el-radio-button>
								<el-radio-button value="其他">其他服务</el-radio-button>
							</el-radio-group>
						</div>

						<!-- 服务列表 -->
						<el-row :gutter="20" v-loading="loadingServices" class="service-list">
							<el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in filteredMerchantList" :key="item.id" class="service-item-col">
								<el-card shadow="hover" class="service-card" @click="viewServiceDetail(item)">
									<div class="service-icon-wrapper">
										<span class="service-icon">{{ getCategoryIcon(item.category) }}</span>
									</div>
									<h4 class="service-name">{{ item.name || item.shopName || '未命名商家' }}</h4>
									<p class="service-desc">{{ item.description || item.introduce || '暂无介绍' }}</p>
									<div class="service-meta">
										<el-tag size="small" :type="getCategoryTagType(item.category)">
											{{ item.category || '其他' }}
										</el-tag>
										<span class="service-contact" v-if="item.phone || item.contactPhone">
											<i class="icon-phone"></i> {{ item.phone || item.contactPhone }}
										</span>
									</div>
									<div class="service-address" v-if="item.address">
										<i class="icon-addr"></i> {{ item.address }}
									</div>
								</el-card>
							</el-col>
						</el-row>

						<el-empty v-if="!loadingServices && filteredMerchantList.length === 0" description="暂无服务信息" />
					</div>
				</el-tab-pane>

				<!-- Tab 2: 车位申请 -->
				<el-tab-pane label="车位申请" name="parking">
					<div class="parking-panel">
						<el-row :gutter="20">
							<el-col :span="12">
								<el-card class="stat-card">
									<template #header>
										<span><i class="icon-car"></i> 车位概况</span>
									</template>
									<el-descriptions column="1">
										<el-descriptions-item label="总车位数">{{ parkingInfo.total || 0 }}</el-descriptions-item>
										<el-descriptions-item label="已使用">{{ parkingInfo.bound || 0 }}</el-descriptions-item>
										<el-descriptions-item label="可用车位">
											<span style="color: #67c23a; font-weight: bold;">{{ parkingInfo.available || 0 }}</span>
										</el-descriptions-item>
									</el-descriptions>
								</el-card>
							</el-col>

							<el-col :span="12">
								<el-card>
									<template #header><span>申请绑定车位</span></template>
									<el-form :model="parkingForm" :rules="parkingRules" ref="parkingFormRef" label-width="100px">
										<el-form-item label="车牌号" prop="carNumber">
											<el-input v-model="parkingForm.carNumber" placeholder="例如：辽A·12345" />
										</el-form-item>
										<el-form-item>
											<el-button type="primary" @click="handleBindLicense" :loading="submittingParking">
												申请绑定
											</el-button>
											<el-button @click="resetParkingForm">重置</el-button>
											<el-button type="success" @click="$router.push('/user/community/parkspace')">
												查看全部车位
											</el-button>
										</el-form-item>
									</el-form>
								</el-card>
							</el-col>
						</el-row>

						<!-- 我的车位申请记录 -->
						<div class="my-applications-section">
							<h4>我的申请记录</h4>
							<el-table :data="myApplications" border size="small" v-loading="loadingApps">
								<el-table-column prop="parkSpaceId" label="车位ID" width="100" align="center" />
								<el-table-column prop="plateNumber" label="车牌号" width="120" align="center" />
								<el-table-column prop="status" label="状态" width="100" align="center">
									<template #default="scope">
										<el-tag v-if="scope.row.status === 0" size="small" type="info">待审批</el-tag>
										<el-tag v-else-if="scope.row.status === 1" size="small" type="success">已同意</el-tag>
										<el-tag v-else-if="scope.row.status === 2" size="small" type="danger">已退回</el-tag>
										<el-tag v-else size="small">{{ scope.row.status }}</el-tag>
									</template>
								</el-table-column>
								<el-table-column prop="createTime" label="申请时间" align="center">
									<template #default="scope">
										{{ formatTime(scope.row.createTime) }}
									</template>
								</el-table-column>
							</el-table>
							<div class="more-link" v-if="myApplications.length > 0">
								<el-button link type="primary" @click="$router.push('/user/community/parking/apply/manage')">
								 查看全部申请记录 →
								</el-button>
							</div>
						</div>
					</div>
				</el-tab-pane>

				<!-- Tab 3: 住户信息管理 -->
				<el-tab-pane label="住户信息" name="resident">
					<div class="resident-panel">
						<el-card>
							<template #header>
								<span><i class="icon-user-info"></i> 房屋与住户信息</span>
							</template>
							<el-alert
								title="请如实填写您的住户信息，便于物业管理和紧急联系"
								type="info"
								:closable="false"
								show-icon
								style="margin-bottom: 20px;"
							/>
							<el-form :model="residentForm" :rules="residentRules" ref="residentFormRef" label-width="130px"
								v-loading="loadingResident">
								<el-divider content-position="left">基本信息</el-divider>
								<el-form-item label="姓名" prop="name">
									<el-input v-model="residentForm.name" placeholder="请输入真实姓名" />
								</el-form-item>
								<el-form-item label="手机号" prop="phone">
									<el-input v-model="residentForm.phone" placeholder="请输入手机号码" />
								</el-form-item>
								<el-form-item label="身份证号" prop="idCard">
									<el-input v-model="residentForm.idCard" placeholder="请输入身份证号（选填）" />
								</el-form-item>

								<el-divider content-position="left">房屋租赁信息</el-divider>
								<el-form-item label="是否为承租人" prop="isTenant">
									<el-switch
										v-model="residentForm.isTenant"
										active-text="是（租户）"
										inactive-text="否（业主）"
									/>
								</el-form-item>

								<template v-if="residentForm.isTenant">
									<el-form-item label="房东姓名" prop="landlordName">
										<el-input v-model="residentForm.landlordName" placeholder="请输入房东姓名" />
									</el-form-item>
									<el-form-item label="房东电话" prop="landlordPhone">
										<el-input v-model="residentForm.landlordPhone" placeholder="请输入房东联系电话" />
									</el-form-item>
									<el-form-item label="租期起始" prop="leaseStart">
										<el-date-picker
											v-model="residentForm.leaseStart"
											type="date"
											placeholder="选择起始日期"
											style="width: 100%;"
											value-format="YYYY-MM-DD"
										/>
									</el-form-item>
									<el-form-item label="租期结束" prop="leaseEnd">
										<el-date-picker
											v-model="residentForm.leaseEnd"
											type="date"
											placeholder="选择结束日期"
											style="width: 100%;"
											value-format="YYYY-MM-DD"
										/>
									</el-form-item>
								</template>

								<el-form-item label="备注">
									<el-input
										v-model="residentForm.remark"
										type="textarea"
										:rows="3"
										placeholder="其他需要说明的信息（选填）"
									/>
								</el-form-item>

								<el-form-item>
									<el-button type="primary" @click="saveResidentInfo" :loading="savingResident">
										保存信息
									</el-button>
									<el-button @click="loadResidentInfo">
										重新加载
									</el-button>
								</el-form-item>
							</el-form>
						</el-card>
					</div>
				</el-tab-pane>

				<!-- Tab 4: 投诉建议 -->
				<el-tab-pane label="投诉建议" name="complaint">
					<div class="complaint-panel">
						<el-card>
							<template #header>
								<span><i class="icon-feedback"></i> 提交投诉或建议</span>
							</template>

							<!-- 提交表单 -->
							<el-form :model="complaintForm" :rules="complaintRules" ref="complaintFormRef" label-width="100px"
								v-show="!showComplaintList">
								<el-form-item label="类型" prop="type">
									<el-radio-group v-model="complaintForm.type">
										<el-radio value="complaint">投诉</el-radio>
										<el-radio value="suggestion">建议</el-radio>
										<el-radio value="other">其他反馈</el-radio>
									</el-radio-group>
								</el-form-item>
								<el-form-item label="标题" prop="title">
									<el-input v-model="complaintForm.title" placeholder="请输入标题（简明扼要）" />
								</el-form-item>
								<el-form-item label="内容" prop="content">
									<el-input
										v-model="complaintForm.content"
										type="textarea"
										:rows="5"
										placeholder="请详细描述您的问题或建议..."
									/>
								</el-form-item>
								<el-form-item label="联系方式" prop="contactPhone">
									<el-input v-model="complaintForm.contactPhone" placeholder="方便我们回复您的电话/微信（选填）" />
								</el-form-item>
								<el-form-item>
									<el-button type="primary" @click="submitComplaint" :loading="submittingComplaint">
										提交
									</el-button>
									<el-button @click="resetComplaintForm">重置</el-button>
									<el-button type="success" @click="toggleComplaintList" v-if="myComplaints.length > 0">
										查看我的记录 ({{ myComplaints.length }})
									</el-button>
								</el-form-item>
							</el-form>

							<!-- 我的投诉建议列表 -->
							<div v-show="showComplaintList">
								<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
									<h4 style="margin: 0;">我的投诉建议记录</h4>
									<el-button size="small" @click="toggleComplaintList">返回提交页</el-button>
								</div>
								<el-table :data="myComplaints" border size="small" v-loading="loadingComplaints">
									<el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
									<el-table-column prop="type" label="类型" width="100" align="center">
										<template #default="scope">
											<el-tag :type="scope.row.type === 'complaint' ? 'danger' : scope.row.type === 'suggestion' ? 'warning' : 'info'" size="small">
												{{ scope.row.type === 'complaint' ? '投诉' : scope.row.type === 'suggestion' ? '建议' : '其他' }}
											</el-tag>
										</template>
									</el-table-column>
									<el-table-column prop="status" label="状态" width="100" align="center">
										<template #default="scope">
											<el-tag :type="scope.row.status === 1 ? 'success' : 'warning'" size="small">
												{{ scope.row.status === 1 ? '已处理' : '待处理' }}
											</el-tag>
										</template>
									</el-table-column>
									<el-table-column prop="handleResult" label="处理结果" min-width="150" show-overflow-tooltip>
										<template #default="scope">
											{{ scope.row.handleResult || '-' }}
										</template>
									</el-table-column>
									<el-table-column prop="createTime" label="提交时间" width="170" align="center">
										<template #default="scope">
											{{ formatTime(scope.row.createTime) }}
										</template>
									</el-table-column>
								</el-table>
								<el-empty v-if="!loadingComplaints && myComplaints.length === 0" description="暂无投诉建议记录" />
							</div>
						</el-card>
					</div>
				</el-tab-pane>
			</el-tabs>
		</el-card>

		<!-- 商家详情弹窗 -->
		<el-dialog v-model="serviceDetailVisible" title="服务详情" width="500px">
			<div class="service-detail" v-if="currentService">
				<div class="detail-header">
					<span class="detail-icon">{{ getCategoryIcon(currentService.category) }}</span>
					<div class="detail-title-area">
						<h3>{{ currentService.name || currentService.shopName }}</h3>
						<el-tag :type="getCategoryTagType(currentService.category)" size="small">
							{{ currentService.category || '其他' }}
						</el-tag>
					</div>
				</div>
				<el-descriptions :column="1" border size="small" style="margin-top: 15px;">
					<el-descriptions-item label="详细介绍">
						{{ currentService.description || currentService.introduce || '暂无详细描述' }}
					</el-descriptions-item>
					<el-descriptions-item label="联系电话" v-if="currentService.phone || currentService.contactPhone">
						{{ currentService.phone || currentService.contactPhone }}
					</el-descriptions-item>
					<el-descriptions-item label="地址" v-if="currentService.address">
						{{ currentService.address }}
					</el-descriptions-item>
					<el-descriptions-item label="营业时间" v-if="currentService.businessHours">
						{{ currentService.businessHours }}
					</el-descriptions-item>
				</el-descriptions>
			</div>
		</el-dialog>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getParkingInfo, bindParkingLicense, getNoticeList } from '@/api/community'
import { getUserInfo, submitRepair, getPaymentHistory, getParkSpaceApplication, submitComplaint as apiSubmitComplaint, getMyComplaints } from '@/api/user'
import { getMerchantList } from '@/api/mall'
import { updateUserProfile } from '@/api/user'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const activeTab = ref('services')

// ========== 社区服务相关 ==========
const loadingServices = ref(false)
const serviceCategory = ref('')
const merchantList = ref([])
const serviceDetailVisible = ref(false)
const currentService = ref(null)

const filteredMerchantList = computed(() => {
	if (!serviceCategory.value) return merchantList.value
	return merchantList.value.filter(item => (item.category || '其他') === serviceCategory.value)
})

// 加载社区商铺列表
const loadMerchantServices = async () => {
	loadingServices.value = true
	try {
		const res = await getMerchantList({ status: 1 })
		if (res.code === 200 && res.data) {
			merchantList.value = Array.isArray(res.data) ? res.data : (res.data.records || [])
		}
	} catch (err) {
		console.error('获取服务列表失败:', err)
	} finally {
		loadingServices.value = false
	}
}

const filterServices = () => {
	// 已通过 computed 实现
}

const viewServiceDetail = (item) => {
	currentService.value = item
	serviceDetailVisible.value = true
}

const getCategoryIcon = (category) => {
	const icons = {
		'家政': '🏠',
		'维修': '🔧',
		'餐饮': '🍜',
		'购物': '🛒',
		'其他': '📋'
	}
	return icons[category] || '📌'
}

const getCategoryTagType = (category) => {
	const types = {
		'家政': '',
		'maintenance': '', // 兼容英文
		'维修': 'warning',
		'餐饮': 'danger',
		'购物': 'success',
		'其他': 'info'
	}
	return types[category] || ''
}

// ========== 车位相关 ==========
const parkingInfo = ref({ total: 0, bound: 0, available: 0 })
const parkingForm = ref({ carNumber: '' })
const parkingFormRef = ref(null)
const submittingParking = ref(false)
const myApplications = ref([])
const loadingApps = ref(false)

const parkingRules = {
	carNumber: [{ required: true, message: '请输入车牌号', trigger: 'blur' }]
}

async function fetchParking() {
	try {
		const res = await getParkingInfo()
		if (res.code === 200 && Array.isArray(res.data)) {
			const list = res.data
			const total = list.length
			const bound = list.filter(item => item.status === 1).length
			parkingInfo.value = { total, bound, available: total - bound }
		}
	} catch (err) {
		ElMessage.error('获取车位信息失败')
	}
}

async function handleBindLicense() {
	if (!parkingFormRef.value) return
	parkingFormRef.value.validate(async (valid) => {
		if (!valid) return
		submittingParking.value = true
		try {
			const res = await bindParkingLicense({
				plateNumber: parkingForm.value.carNumber,
				userId: userStore.userInfo?.id
			})
			ElMessage.success(res?.data?.message || '申请已提交，等待审批')
			fetchParking()
			loadMyApplications()
			parkingForm.value.carNumber = ''
		} catch (err) {
			ElMessage.error(err?.message || '绑定失败')
		} finally {
			submittingParking.value = false
		}
	})
}

function resetParkingForm() {
	if (parkingFormRef.value) parkingFormRef.value.resetFields()
}

async function loadMyApplications() {
	loadingApps.value = true
	try {
		const res = await getParkSpaceApplication()
		if (res.code === 200) {
			myApplications.value = Array.isArray(res.data) ? res.data : []
		}
	} catch (err) {
		console.error('获取申请列表失败:', err)
	} finally {
		loadingApps.value = false
	}
}

// ========== 住户信息相关 ==========
const residentForm = ref({
	name: '',
	phone: '',
	idCard: '',
	isTenant: false,
	landlordName: '',
	landlordPhone: '',
	leaseStart: '',
	leaseEnd: '',
	remark: ''
})
const residentFormRef = ref(null)
const loadingResident = ref(false)
const savingResident = ref(false)

const residentRules = {
	name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
	phone: [
		{ required: true, message: '请输入手机号', trigger: 'blur' },
		{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
	]
}

async function loadResidentInfo() {
	loadingResident.value = true
	try {
		const res = await getUserInfo(userStore.userInfo?.id)
		const info = res.data || {}
		residentForm.value.name = info.name || info.username || ''
		residentForm.value.phone = info.phone || ''
		// 从 localStorage 恢复扩展字段
		const local = JSON.parse(localStorage.getItem('residentInfo') || '{}')
		Object.assign(residentForm.value, local)
		ElMessage.success('用户信息已刷新')
	} catch (err) {
		ElMessage.error('获取用户信息失败')
	} finally {
		loadingResident.value = false
	}
}

function saveResidentInfo() {
	if (!residentFormRef.value) return
	residentFormRef.value.validate((valid) => {
		if (!valid) return
		savingResident.value = true
		// 保存到 localStorage 并尝试同步到后端用户资料
		const saveData = { ...residentForm.value }
		localStorage.setItem('residentInfo', JSON.stringify(saveData))

		// 同时尝试更新用户基础资料到后端
		updateUserProfile({
			name: saveData.name,
			phone: saveData.phone
		}).then(() => {
			ElMessage.success('住户信息已保存')
		}).catch(() => {
			ElMessage.success('住户信息已本地保存（部分信息待后端接口支持）')
		}).finally(() => {
			savingResident.value = false
		})
	})
}

// ========== 投诉建议相关 ==========
const complaintForm = ref({
	type: 'complaint',
	title: '',
	content: '',
	contactPhone: ''
})
const complaintFormRef = ref(null)
const submittingComplaint = ref(false)
const showComplaintList = ref(false)
const myComplaints = ref([])
const loadingComplaints = ref(false)

const complaintRules = {
	type: [{ required: true, message: '请选择类型', trigger: 'change' }],
	title: [
		{ required: true, message: '请输入标题', trigger: 'blur' },
		{ min: 2, max: 50, message: '标题长度在2-50个字符之间', trigger: 'blur' }
	],
	content: [
		{ required: true, message: '请输入内容', trigger: 'blur' },
		{ min: 10, message: '内容不少于10个字符', trigger: 'blur' }
	]
}

async function submitComplaint() {
	if (!complaintFormRef.value) return
	await complaintFormRef.value.validate()
	submittingComplaint.value = true
	try {
		const typeLabel = complaintForm.value.type === 'complaint' ? '投诉' : complaintForm.value.type === 'suggestion' ? '建议' : '其他'
		const res = await apiSubmitComplaint({
			content: `[${typeLabel}] ${complaintForm.value.title}\n\n${complaintForm.value.content}`
		})
		if (res.code === 200) {
			ElMessage.success('提交成功，我们会尽快处理')
			resetComplaintForm()
			loadMyComplaints()
		} else {
			ElMessage.error(res.message || '提交失败')
		}
	} catch (err) {
		ElMessage.error('网络错误：' + err.message)
	} finally {
		submittingComplaint.value = false
	}
}

function resetComplaintForm() {
	if (complaintFormRef.value) complaintFormRef.value.resetFields()
	complaintForm.value = { type: 'complaint', title: '', content: '', contactPhone: '' }
}

function toggleComplaintList() {
	showComplaintList.value = !showComplaintList.value
	if (showComplaintList.value && myComplaints.value.length === 0) {
		loadMyComplaints()
	}
}

async function loadMyComplaints() {
	loadingComplaints.value = true
	try {
		const res = await getMyComplaints()
		if (res.code === 200) {
			myComplaints.value = Array.isArray(res.data) ? res.data : []
		}
	} catch (err) {
		console.error('获取投诉列表失败:', err)
	} finally {
		loadingComplaints.value = false
	}
}

// ========== 工具函数 ==========
const formatTime = (timeStr) => {
	if (!timeStr) return '-'
	return new Date(timeStr).toLocaleString('zh-CN', {
		year: 'numeric', month: '2-digit', day: '2-digit',
		hour: '2-digit', minute: '2-digit'
	})
}

onMounted(() => {
	loadMerchantServices()
	fetchParking()
	loadMyApplications()
	loadResidentInfo()
	loadMyComplaints()
})
</script>

<style scoped>
.service-container {
	padding: 5px;
}

.card-header h3 {
	margin: 0;
	font-size: 18px;
	color: #303133;
}

/* 服务列表 */
.service-panel {
	margin-top: 12px;
}

.filter-bar {
	margin-bottom: 20px;
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.service-list {
	min-height: 300px;
}

.service-item-col {
	margin-bottom: 16px;
}

.service-card {
	cursor: pointer;
	transition: all 0.3s ease;
	border: 1px solid #e8e8e8;
	height: 100%;
}

.service-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	border-color: #409eff;
}

.service-card :deep(.el-card__body) {
	padding: 18px;
	text-align: center;
}

.service-icon-wrapper {
	width: 56px;
	height: 56px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 12px;
}

.service-icon {
	font-size: 28px;
}

.service-name {
	font-size: 16px;
	color: #303133;
	margin: 8px 0 6px;
	font-weight: 600;
}

.service-desc {
	font-size: 13px;
	color: #909399;
	line-height: 1.5;
	margin-bottom: 12px;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.service-meta {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
	margin-bottom: 8px;
}

.service-contact {
	font-size: 12px;
	color: #606266;
}

.icon-phone::before {
	content: "📞 ";
}

.service-address {
	font-size: 12px;
	color: #b0b0b0;
}

.icon-addr::before {
	content: "📍 ";
}

/* 车位面板 */
.parking-panel {
	margin-top: 12px;
}

.stat-card :deep(.el-card__header) {
	background-color: #f0f9eb;
}

.stat-card .icon-car::before {
	content: "🚗 ";
}

.my-applications-section {
	margin-top: 20px;
}

.my-applications-section h4 {
	margin-bottom: 12px;
	color: #303133;
}

.more-link {
	text-align: right;
	margin-top: 10px;
}

/* 住户信息 */
.resident-panel {
	margin-top: 12px;
}

.icon-user-info::before {
	content: "👤 ";
}

.icon-feedback::before {
	content: "💬 ";
}

.complaint-panel {
	margin-top: 12px;
}

/* 响应式调整 */
@media (max-width: 768px) {
	.service-item-col {
		max-width: 100%;
		flex: 0 0 100%;
	}
}
</style>
