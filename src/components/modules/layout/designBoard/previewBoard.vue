<!--
 * @Date: 2024-04-10 23:02:46
 * @Description: 预览页面
-->
<template>
  <div id="main" class="main-preview" :class="{'h5-preview': isH5 }" v-show="isShow"  
      v-loading="loading"
      element-loading-text="Loading..."
      :element-loading-spinner="svg"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(255, 255, 255, 1)">
    <!-- <div id="page-design" ref="page_design" :style="{ paddingTop: dPaddingTop + 'px', minWidth: (dPage.width * dZoom) / 100 + dPresetPadding * 2 + 'px' }"> -->
    <div id="page-design" ref="page_design" :style="{ minWidth: isH5 ? '100%' : (dPage.width * dZoom) / 100 + dPresetPadding * 2 + 'px' }">
      <!-- padding: dPresetPadding + 'px', -->
      <div
        id="out-page"
        class="out-page"
        :style="{
          width: isH5 ? '100%' : (dPage.width * dZoom) / 100 + dPresetPadding * 2 + 'px',
          opacity: 1 - (dZoom < 100 ? dPage.tag : 0),
        }"
      >
      <!-- 音频抽离到公共模块 -->
      <component is="w-audio" :style="{scale:  dZoom / 100,right: '-10px', top: '-10'}" v-for="layer in dLayouts[0].layers"  :id="layer.uuid" :key="layer.uuid" :class="[layer, { 'layer-hover': layer.uuid === dHoverUuid || dActiveElement?.parent === layer.uuid, 'layer-no-hover': dActiveElement?.uuid === layer.uuid }, animationConfig(layer)]" :data-title="layer.type" :params="layer" :parent="dPage" :data-type="layer.type" :data-uuid="layer.uuid">
      </component>
        <slot />
        <watermark :customStyle="{ height: dPage.page_type === 'turnPage' ? '100%' : (dPage.height * dZoom) / 100 + 'px',font: {fontSize: 0} }">
          <div
            :id="pageDesignCanvasId"
            class="design-canvas"
            :data-type="dPage.type"
            :data-uuid="dPage.uuid"
            :style="{
              width: dPage.width + 'px',
              height: dPage.page_type === 'turnPage' ? 10000 / dZoom + '%' : dPage.height + 'px',
              scale:  dZoom / 100,
              transformOrigin: (dZoom >= 100 ? 'center' : 'left') + ' top',
              backgroundColor: dPage.backgroundGradient ? undefined : dPage.backgroundColor,
              backgroundImage: dPage.backgroundImage ? `url(${dPage?.backgroundImage})` : dPage.backgroundGradient || undefined,
              backgroundSize: dPage.backgroundTransform?.x ? 'auto' : 'cover',
              backgroundPositionX: (dPage.backgroundTransform?.x || 0) + 'px',
              backgroundPositionY: (dPage.backgroundTransform?.y || 0) + 'px',
              opacity: dPage.opacity + (dZoom < 100 ? dPage.tag : 0),
            }"
            @mousedown="mousedown($event)"
            @mousemove="mousemove($event)"
            @mouseup="mouseup($event)"
            @touchstart="touchstart($event)"
            @touchend="touchend($event)"
          >
          
          <!--  -->
            <!-- <div class="pageItem" v-for="(item, i) in dLayouts" :key="i">
              <component :is="layer.type" v-for="layer in item.layers" :id="layer.uuid" :key="layer.uuid" :class="[layer, { 'layer-hover': layer.uuid === dHoverUuid || dActiveElement?.parent === layer.uuid, 'layer-no-hover': dActiveElement?.uuid === layer.uuid }, animationConfig(layer)]" :data-title="layer.type" :params="layer" :parent="dPage" :data-type="layer.type" :data-uuid="layer.uuid"> -->
            <div v-for="layer in dLayouts[page_index].layers" >
              <component v-if="layer.type !== 'w-audio'" :is="layer.type" :id="layer.uuid" :key="layer.uuid" :class="[layer, { 'layer-hover': layer.uuid === dHoverUuid || dActiveElement?.parent === layer.uuid, 'layer-no-hover': dActiveElement?.uuid === layer.uuid }, animationConfig(layer)]" :data-title="layer.type" :params="layer" :parent="dPage" :data-type="layer.type" :data-uuid="layer.uuid">
                <template v-if="layer.isContainer">
                  <component :is="widget.type" v-for="widget in getChilds(layer.uuid)" :key="widget.uuid" child :class="[layer, { 'layer-no-hover': dActiveElement?.uuid !== widget.parent && dActiveElement?.parent !== widget.parent }]" :data-title="widget.type" :params="widget" :parent="layer" :data-type="widget.type" :data-uuid="widget.uuid" />
                </template>
              </component>
            </div>
            <!-- </div> -->
          </div>
        </watermark>
      </div>
    </div>
    <slot name="bottom" />
  </div>
</template>

<script lang="ts" setup>
import { ElLoading } from 'element-plus'
import { onMounted, Ref, ref, reactive } from 'vue'
import { getTarget } from '@/common/methods/target'
import setWidgetData from '@/common/methods/DesignFeatures/setWidgetData'
import PointImg from '@/utils/plugins/pointImg'
import getComponentsData from '@/common/methods/DesignFeatures/setComponents'
import { debounce } from 'throttle-debounce'
import { move, moveInit } from '@/mixins/move'
import { useCanvasStore, useControlStore, useWidgetStore } from '@/store'
import { storeToRefs } from 'pinia'
import { TPageState } from '@/store/design/canvas/d'
import watermark from './comps/pageWatermark.vue'
import { log } from 'console'
import useScroll from './hooks/useScroll'

// 页面设计组件
type TProps = {
  pageDesignCanvasId: string,
  isH5: boolean,
}

type TParentData = {
  width?: number
  height?: number
}

type TSetting = Partial<TPageState>

const controlStore = useControlStore()
const widgetStore = useWidgetStore()
const canvasStore = useCanvasStore()

const { pageDesignCanvasId, isH5 } = defineProps<TProps>()

const { dPage } = storeToRefs(useCanvasStore())
let { dZoom, dPresetPadding, dPaddingTop, dScreen } = storeToRefs(canvasStore)
const { dDraging, showRotatable, dAltDown, dSpaceDown } = storeToRefs(controlStore)
const { dWidgets, dActiveElement, dSelectWidgets, dHoverUuid,dLayouts } = storeToRefs(widgetStore)
// 控制滚动相关的hooks
const {autoScroll, page_index, page_type, fnAutoScroll, fnAutoTurnPage, mousedown, mousemove, mouseup, touchstart, touchend} = useScroll(dPage, dLayouts)
let isShow = ref(false)
const svg = `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `
let loading = ref(true)
// 长页需调整展示比例 -- 0.487
setTimeout(() => {
  console.log(page_type)
  console.log('TinnerWidth--' + document.body.clientWidth);// 添加事件监听，以响应屏幕尺寸变化
  
  if(dPage.value.page_type === 'longPage') {
      console.log('old-dZoom--'  + dZoom.value)
      dZoom.value = isH5 ? document.body.clientWidth / dPage.value.width * 100  : dZoom.value * 10
      // dZoom.value = dZoom.value * 8.8
      console.log('dZoom--'  + dZoom.value)
  }else if(dPage.value.page_type === 'turnPage') {
      console.log('old-dZoom--'  + dZoom.value)
      dZoom.value = isH5 ? document.body.clientWidth / dPage.value.width * 100  : dZoom.value * 10
      // dZoom.value = dZoom.value * 8.8
      console.log('dZoom--'  + dZoom.value)
  }
}, 1000);
// 爲了優化loading之前的樣式問題
setTimeout(() => {
  isShow.value = true;
}, 100);
let _srcCache: string | null = ''
onMounted(() => {
  console.log(dLayouts);
  getScreen()
    setTimeout(() => {
      loading.value = false;
    }, 1e3);
})
 
function getScreen() {
  const pageDesignEl = document.getElementById('page-design')
  if (!pageDesignEl) return
  canvasStore.updateScreen({
    width: pageDesignEl.offsetWidth,
    height: pageDesignEl.offsetHeight,
  })
}

function getChilds(uuid: string) {
  return dWidgets.value.filter((item) => item.parent === uuid)
}
// 配置动画方法
function animationConfig(layer) {
  const res = layer.transition || ''; // 获取动画的配置
  if(!res) return ''; 
  const list = [
    res?.animate ? 'animate__animated' : '', 
    res?.animate ? 'animate__' + res.animate : '',
    res?.delay ? 'animate__delay-'+ res.delay +'s' : '', 
    res?.speed ? 'animate__' + res.speed : '',
    // 判断是否预览，预览只循环展示一次，不是预览的话判断是否设置了循环，设置了的话判断循环次数并添加对应次数，否则无限循环
    !res?.isRepeat ? 'animate__repeat-1' : (res?.isRepeat ? (res.repeatTime ? 'animate__repeat-' + res.repeatTime : 'animate__infinite') : ''),
  ]
 return list.join(' ');
}


</script>

<style lang="less" scoped>
#main {
  overflow: auto;
  position: relative;
}
#page-design {
  scrollbar-width: none;
  min-height: 100%;
  overflow: auto;
  position: relative;
  // width: 100%;
  .out-page {
    scrollbar-width: none;
    margin: 0 auto;
    // padding: 60px;
    position: relative;
    // height: calc(100vh - 25px);
    height: 100vh;
    overflow-y: auto; 
    &::-webkit-scrollbar{
      display: none;
      width:10px;
    }
    .design-canvas {
      // transition: all 0.3s;
      background-position: center;
      background-repeat: no-repeat;
      background-size: cover;
      box-shadow: 1px 1px 10px 3px rgba(0, 0, 0, 0.1);
      margin: 0 auto;
      position: relative;
    }
  }
}
.main-preview{
  .out-page{
    margin: unset !important;
  }
}
.pageItem{
  height: 100%;
  position: relative;
}
.h5-preview .design-canvas{
  overflow-x: hidden !important;
}
</style>
