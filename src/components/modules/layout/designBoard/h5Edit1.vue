
<!--
 * @Date: 2024-04-10 23:02:46
 * @Description: 预览页面
-->
<template>
  <div id="editContent">
    <div id="main">
    <div style="background-color: red;height: 500px; width: 100%;"></div>
    <Moveable :isH5="true" />  
  </div>
  </div>
</template>

<script lang="ts" setup>
import api from '@/api'
import Moveable from '@/components/business/moveable/Moveable.vue'
</script>
