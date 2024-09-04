<template>
  <el-drawer v-model="isShow" direction="btt" size="45%" @close="cancelClick">
    <template #header>
      <h4>修改</h4>
    </template>
    <template #default>
      <el-input
        v-model="dActiveElement.text"
        :rows="8"
        type="textarea"
        placeholder="Please input"
      />
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="cancelClick">关闭</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useWidgetStore } from '@/store';
import { ElInput, ElDrawer } from 'element-plus';
// 页面设计组件
// const props = defineProps({
//   isShow: Boolean
// });
let isShow = ref(true);
const widgetStore = useWidgetStore()
const { dActiveElement, dWidgets, dSelectWidgets } = storeToRefs(widgetStore)
const textarea = ref('')
const emit = defineEmits(['childEvent']);
onMounted(() => {
  isShow.value = true;
})
function cancelClick(){
  // isShow.value = false;
  emit('childEvent', true)
}
</script>

<style lang='less' scoped>

</style>
