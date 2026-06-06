<template>
  <div class="profile-container">
    <el-card class="profile-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">个人资料管理</span>
          <el-tag
              v-if="userForm.status !== undefined"
              :type="userForm.status === 1 ? 'success' : 'danger'"
              size="small"
          >
            {{ userForm.status === 1 ? '正常' : '已冻结' }}
          </el-tag>
        </div>
      </template>

      <!-- 骨架屏加载状态 -->
      <div v-if="loading" class="loading-wrapper">
        <el-skeleton style="width: 100%" :rows="6" animated />
      </div>

      <!-- 主体表单 -->
      <el-form
          v-else
          ref="formRef"
          :model="userForm"
          :rules="rules"
          label-width="100px"
          class="profile-form"
      >
        <!-- 头像上传区域 -->
        <el-form-item label="头像">
          <div class="avatar-wrapper">
            <div class="avatar-upload-box" @click="triggerUpload">
              <el-avatar
                  :size="80"
                  :src="userForm.avatar || defaultAvatar"
                  alt="用户头像"
              />
              <div v-if="avatarUploading" class="avatar-upload-mask">
                <el-icon class="is-loading"><svg viewBox="0 0 1024 1024" width="24" height="24"><path d="M512 64a448 448 0 1 0 448 448A448 448 0 0 0 512 64z m0 832a384 384 0 1 1 384-384 384 384 0 0 1-384 384z" fill="currentColor" opacity=".2"/><path d="M512 128a384 384 0 0 0-384 384h64a320 320 0 0 1 640 0h64a384 384 0 0 0-384-384z" fill="currentColor"/></svg></el-icon>
              </div>
            </div>
            <div class="upload-tip">
              <el-button type="primary" link @click="triggerUpload" :loading="avatarUploading">
                {{ avatarUploading ? '上传中...' : '更换头像' }}
              </el-button>
              <span class="text-muted">支持 JPG/PNG 格式</span>
            </div>
            <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleAvatarChange"
            />
          </div>
        </el-form-item>

        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username">
          <el-input
              v-model="userForm.username"
              placeholder="请输入用户名"
              clearable
          />
        </el-form-item>

        <!-- 真实姓名 -->
        <el-form-item label="真实姓名">
          <el-input
              v-model="userForm.realName"
              placeholder="请输入真实姓名"
              clearable
          />
        </el-form-item>

        <!-- 手机号 (不可修改) -->
        <el-form-item label="手机号">
          <el-input
              v-model="userForm.phone"
              disabled
              placeholder="暂无数据"
          />
        </el-form-item>

        <!-- 邮箱 -->
        <el-form-item label="邮箱" prop="email">
          <el-input
              v-model="userForm.email"
              placeholder="请输入邮箱地址"
              type="email"
              clearable
          />
        </el-form-item>

        <!-- 房屋信息分组 -->
        <el-divider content-position="left">房屋信息</el-divider>

        <el-form-item label="房间号">
          <el-tag type="info" effect="plain">
            {{ userForm.roomNumber || '未分配房间' }}
          </el-tag>
        </el-form-item>

        <el-form-item label="户型">
          <span class="text-muted">{{ userForm.houseType || '未知户型' }}</span>
        </el-form-item>

      <!-- 注册时间 -->
      <el-form-item label="注册时间">
        <span class="text-muted">{{ formatDate(userForm.createTime) }}</span>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button
            type="primary"
            @click="handleSave"
            :loading="isSaving"
        >
          保存修改
        </el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserInfo, updateUserInfo } from '@/api/auth'
import { getUserProfile, updateUserProfile, imgUpload } from '@/api/user'
import { useUserStore } from '@/stores/user'

// 1. 数据定义
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1e.png';
const userStore = useUserStore()

const loading = ref(false);
const isSaving = ref(false);
const avatarUploading = ref(false);
const formRef = ref(null);
const fileInputRef = ref(null);

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

// 用户表单数据模型
const userForm = reactive({
  userId: null,
  username: '',
  phone: '',
  email: '',
  avatar: '',
  realName: '',
  roomNumber: '',
  houseType: '',
  gender: '',
  status: 1,
  createTime: null,
});

// 2. 辅助函数
// 格式化日期（兼容数组格式 [2026,6,5,10,30,0] 和字符串）
const formatDate = (val) => {
  if (!val) return '---';
  try {
    let dateStr = val;
    if (Array.isArray(val) && val.length >= 3) {
      const [y, m, d, h = 0, min = 0] = val;
      dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return val?.toString() || '---';
    return d.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return val?.toString() || '---';
  }
};

const normalizeDate = (val) => formatDate(val) // alias

// 头像上传：触发隐藏的 file input
const triggerUpload = () => {
  if (avatarUploading.value) return
  fileInputRef.value?.click()
}

// 头像上传：选择文件后自动上传
const handleAvatarChange = async (e) => {
  const file = e.target?.files?.[0]
  if (!file) return

  // 校验文件类型和大小
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    ElMessage.warning('仅支持 JPG、PNG、GIF、WebP 格式的图片')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }

  avatarUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await imgUpload(formData)
    if (res.code === 200 && res.data) {
      userForm.avatar = res.data
      ElMessage.success('头像上传成功，点击"保存修改"即可生效')
    } else {
      // 后端返回的错误信息已在 request 拦截器中提示，此处仅重置 input
      if (fileInputRef.value) fileInputRef.value.value = ''
    }
  } catch (err) {
    // 网络错误/HTTP 错误已在 request 拦截器中提示，此处仅记录日志
    console.error('头像上传失败:', err)
    if (fileInputRef.value) fileInputRef.value.value = ''
  } finally {
    avatarUploading.value = false
  }
}

// 3. 加载用户信息（合并 auth User + user UserProfile）
const loadUserInfo = async () => {
  loading.value = true;
  try {
    const userId = userStore.userInfo?.id;
    if (!userId) {
      ElMessage.error('未登录，请重新登录');
      return;
    }

    // 并行请求两个接口
    const [authRes, profileRes] = await Promise.allSettled([
      getUserInfo(userId),
      getUserProfile()
    ]);

    // 解析 auth 用户信息
    if (authRes.status === 'fulfilled') {
      const data = authRes.value?.data || authRes.value || {};
      console.log('[Profile] Auth user data:', data);
      userForm.userId = data.id || userId;
      userForm.username = data.username || '';
      userForm.phone = data.phone || '';
      userForm.email = data.email || '';
      userForm.avatar = data.avatar || '';
      userForm.status = data.status ?? 1;
      userForm.createTime = data.createTime || null;
    } else {
      console.warn('[Profile] Auth info fetch failed:', authRes.reason);
    }

    // 解析 user profile 扩展信息
    if (profileRes.status === 'fulfilled') {
      const pData = profileRes.value?.data || profileRes.value || {};
      console.log('[Profile] Profile data:', pData);
      userForm.avatar = pData.avatar || userForm.avatar;
      userForm.realName = pData.realName || '';
      userForm.gender = pData.gender || '';
      userForm.roomNumber = pData.buildingInfo || '';
      userForm.houseType = pData.address || '';
    } else {
      console.warn('[Profile] Profile fetch failed:', profileRes.reason);
    }
  } catch (err) {
    console.error('获取用户信息失败:', err);
    ElMessage.error('数据加载失败，请检查网络或重新登录');
  } finally {
    loading.value = false;
  }
};

// 4. 保存修改
const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    await ElMessageBox.confirm('确定要更新个人资料吗？', '确认修改', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    isSaving.value = true;

    // 更新 auth 用户基础信息
    const authPayload = {
      username: userForm.username,
      email: userForm.email,
      avatar: userForm.avatar,
    };
    await updateUserInfo(authPayload);

    // 更新 user profile 扩展信息
    const profilePayload = {
      realName: userForm.realName || userForm.username,
      avatar: userForm.avatar,
      gender: userForm.gender,
      buildingInfo: userForm.roomNumber,
      address: userForm.houseType,
    };
    try {
      await updateUserProfile(profilePayload);
    } catch (e) {
      console.warn('[Profile] 扩展信息更新失败（可忽略）:', e);
    }

    ElMessage.success('资料更新成功！');
    await loadUserInfo();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(`更新失败: ${err.message || '未知错误'}`);
    }
  } finally {
    isSaving.value = false;
  }
};

// 5. 重置
const resetForm = () => {
  loadUserInfo();
};

// 6. 生命周期
onMounted(() => {
  loadUserInfo();
});
</script>

<style scoped>
.profile-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.profile-card {
  max-width: 600px;
  margin: 20px auto;
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-upload-box {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  transition: opacity 0.3s;
}

.avatar-upload-box:hover {
  opacity: 0.85;
}

.avatar-upload-mask {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
}

.upload-tip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 12px;
  color: #909399;
}

.text-muted {
  color: #909399;
  font-size: 13px;
}

.form-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>