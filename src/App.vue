<template>
  <div id="app-view">
    <el-config-provider :locale="locale">
      <router-view />
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ElConfigProvider } from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useI18n } from 'vue-i18n'
import { getBrowserLang } from './languages'

const lang = getBrowserLang()

const i18n = useI18n()
onMounted(() => {
  i18n.locale.value = lang
})

// 配置语言,否则element默认是英语
const locale = computed(() => {
  return lang == 'zh' ? zhCn : en
})
</script>

<style lang="less">
#app-view {
  // min-width: 1180px;
}
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate__rotate{
  animation-name: rotate;
}
// 补充的样式，都只到10，后续优化
.animate__delay-6s{
  animation-delay: 6s !important;
}
.animate__delay-7s{
  animation-delay: 7s !important;
}
.animate__delay-8s{
  animation-delay: 8s !important;
}
.animate__delay-9s{
  animation-delay: 9s !important;
}
.animate__delay-10s{
  animation-delay: 10s !important;
}

.animate__delay-4{
  animation-iteration-count: 4 !important;
}
.animate__repeat-5{
  animation-iteration-count: 5 !important;
}
.animate__delay-6{
  animation-iteration-count: 6 !important;
}
.animate__delay-7{
  animation-iteration-count: 7 !important;
}
.animate__delay-8{
  animation-iteration-count: 8 !important;
}
.animate__delay-9{
  animation-iteration-count: 9 !important;
}
.animate__delay-10{
  animation-iteration-count: 10 !important;
}
</style>
