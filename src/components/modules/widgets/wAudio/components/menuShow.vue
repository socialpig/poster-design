<template>
  <el-row class="menuShow" justify="space-between" align="middle">
    <el-col :span="16">{{left}}</el-col>
    <el-col :span="4" style="text-align: right;">
      <slot name="right">{{right || ''}}</slot>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ElRow, ElCol } from 'element-plus'
type TProps = {
  left: string,
  right: string,
}
const props = defineProps<TProps>()
console.log(props);

const value1 = ref(true)
const value2 = ref(true)
</script>

<style lang='less' scoped>
  .menuShow{
    margin-bottom: 15px;
    width: 90%;
  }
</style>
