<template>
  <div class="simpleArea">
    <!-- 文本 -->
    <div v-if="dActiveElement.type === 'w-text'" @click="fnChangeText">更换文本</div>
    <!-- 日历 -->
    <div v-else-if="dActiveElement.type === 'w-calendar'">
      <!-- {{dActiveElement.value}} -->
      <el-date-picker
        v-model="dActiveElement.value"
        type="date"
        :editable="false"
        :clearable="false"
        :data="uploadData"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
      />
    </div>
    <!-- 图片 -->
    <!-- <div v-else-if="dActiveElement.type === 'w-image'">更换图片</div> -->
    <el-upload
    v-else-if="dActiveElement.type === 'w-image'"
    class="avatar-uploader"
    action="http://192.168.0.108:7001/api/file/upload"
    :show-file-list="false"
    :on-success="handleAvatarSuccess"
    :before-upload="beforeAvatarUpload"
    :on-preview="handlePreview"
    :on-remove="handleRemove"
  >
    <!-- <img v-if="imageUrl" :src="imageUrl" class="avatar" /> -->
    <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
  </el-upload>

  </div>
  <change-text v-if="isShowChangeText" @childEvent="handleChildEvent" />
</template>

<script setup lang="ts">

import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useWidgetStore } from '@/store';
import { ElDatePicker,ElMessage ,ElUpload } from 'element-plus'
import type { UploadProps } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { log } from 'console';
const widgetStore = useWidgetStore()
const { dActiveElement, dWidgets, dSelectWidgets } = storeToRefs(widgetStore)
let isShowChangeText = ref(false);
const imageUrl = ref('')
const uploadData = {folder: 'user'}
watch(
  dActiveElement,
  (items) => {
    console.log(items);
    
  },
  {
    deep: true
  }
)
function fnChangeText(){
  isShowChangeText.value = true;
  console.log(isShowChangeText.value);
  
}
function handleChildEvent(){
  isShowChangeText.value = false
}
const handleAvatarSuccess: UploadProps['onSuccess'] = (
  response,
  uploadFile
) => {
  console.log(response);
  dActiveElement.value.imgUrl = response.result.url;
  imageUrl.value = URL.createObjectURL(uploadFile.raw!)
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // if (rawFile.type !== 'image/jpeg') {
  //   ElMessage.error('Avatar picture must be JPG format!')
  //   return false
  // } else if (rawFile.size / 1024 / 1024 > 2) {
  //   ElMessage.error('Avatar picture size can not exceed 2MB!')
  //   return false
  // }
  return true
}
function handlePreview(file) {
      console.log('Preview:', file);
    }
    function handleRemove(file, fileList) {
      console.log('Remove:', file, fileList);
    }
</script>

<style lang="less" scoped>
.simpleArea{
  :deep(.el-input__wrapper){
    background-color: unset !important;
    box-shadow: unset;
  }
  :deep(.avatar-uploader-icon) {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
}
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

</style>