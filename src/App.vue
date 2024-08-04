<!--
 * @Author: ShawnPhang
 * @Date: 2023-09-18 17:34:44
 * @Description:  
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2023-09-20 16:10:58
-->
<template>
  <div id="appindex">
    <div class="viewWrap">
      <router-view />
    </div>
  </div>
</template>

<style lang="less">
#appindex {
  // min-width: 1180px;
  .viewWrap {
    min-height: calc(110vh - 110px);
    // min-width: 1170px;
  }
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
