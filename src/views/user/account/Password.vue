<template>
  <div class="password-page">
    <h2>修改密码</h2>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 500px;">
      <el-form-item label="原密码" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" placeholder="请输入原密码" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" placeholder="请输入新密码" show-password />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="handleChange">提交修改</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { updatePassword } from '@/api/user'
import { useUserStore } from '@/stores/user'

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

const handleChange = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()

    await ElMessageBox.confirm('确定要修改密码吗？修改后需要重新登录。', '确认修改', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    submitting.value = true
    await updatePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    })

    ElMessage.success('密码修改成功，请重新登录！')

    // 清除登录状态，跳转到登录页
    setTimeout(() => {
      useUserStore().clearUserInfo()
      window.location.href = '/login'
    }, 1500)
  } catch (err) {
    if (err === 'cancel' || err === 'close') return
    console.error('修改密码失败:', err)
    const msg = err?.response?.data?.message || err?.message || '修改失败'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
}
</script>

<style scoped>
.password-page {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.password-page h2 {
  margin-bottom: 24px;
  font-size: 20px;
  color: #1f2f3d;
}
</style>
