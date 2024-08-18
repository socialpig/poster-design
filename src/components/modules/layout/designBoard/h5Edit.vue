
<!--
 * @Date: 2024-04-10 23:02:46
 * @Description: 预览页面
-->
<template>
  <div id="editContent">
    <!-- 头部组 -->
    <div class="headBtnBox">
      <el-button size="small">返回</el-button>
      <div>
        <el-button size="small">预览</el-button>
        <el-button size="small" @click="save">保存</el-button>
      </div>
    </div>
    <!-- 内容展示区域 -->
    <div id="main" class="main-preview" :class="{'h5-preview': isH5 }" v-show="isShow"  
        v-loading="loading"
        element-loading-text="Loading..."
        :element-loading-spinner="svg"
        element-loading-svg-view-box="-10, -10, 50, 50"
        element-loading-background="rgba(255, 255, 255, 1)"
        style="scale: 0.8;margin-top: -22%;"
        >
        <!--  -->
      <div id="page-design" ref="page_design" :style="{minWidth: isH5 ? '100%' : (dPage.width * dZoom) / 100 + dPresetPadding * 2 + 'px' }">
        <div
          id="out-page"
          class="out-page"
          :style="{
            width: isH5 ? '100%' : (dPage.width * dZoom) / 100 + dPresetPadding * 2 + 'px',
            opacity: 1 - (dZoom < 100 ? dPage.tag : 0),
            // scale: 0.8,
          }"
        >
        <!-- 音频抽离到公共模块 -->
        <component is="w-audio" :style="{scale:  dZoom / 100,right: '-10px', top: '-10'}" v-for="layer in dLayouts[0].layers"  :id="layer.uuid" :key="layer.uuid" :class="[layer, { 'layer-hover': layer.uuid === dHoverUuid || dActiveElement?.parent === layer.uuid, 'layer-no-hover': dActiveElement?.uuid === layer.uuid }, animationConfig(layer)]" :data-title="layer.type" :params="layer" :parent="dPage" :data-type="layer.type" :data-uuid="layer.uuid">
        </component>
          <slot />
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
              @mousemove="dropOver($event)"
              @drop="drop($event)"
              @mouseup="drop($event)"
            >
            <!-- @mousedown="mousedown($event)"
              @mousemove="mousemove($event)"
              @mouseup="mouseup($event)"
              @touchstart="touchstart($event)"
              @touchend="touchend($event)" -->
            <!-- <div v-for="layer in dLayouts[page_index].layers" ></div> -->
            <div v-for="layer in dLayouts[currentPage - 1].layers" >
                <component v-if="layer.type !== 'w-audio'" :is="layer.type" :id="layer.uuid" :key="layer.uuid" :class="['layer', { 'layer-hover': layer.uuid === dHoverUuid || dActiveElement?.parent === layer.uuid, 'layer-no-hover': dActiveElement?.uuid === layer.uuid }, animationConfig(layer)]" :data-title="layer.type" :params="layer" :parent="dPage" :data-type="layer.type" :data-uuid="layer.uuid">
                  <template v-if="layer.isContainer">
                    <component :is="widget.type" v-for="widget in getChilds(layer.uuid)" :key="widget.uuid" child :class="['layer', { 'layer-no-hover': dActiveElement?.uuid !== widget.parent && dActiveElement?.parent !== widget.parent }]" :data-title="widget.type" :params="widget" :parent="layer" :data-type="widget.type" :data-uuid="widget.uuid" />
                  </template>
                </component>
              </div>
              <!-- 旋转缩放组件 -->
              <Moveable />  
            </div>
        </div>
      </div>
      <slot name="bottom" />
    </div>
    <!-- 底部控制栏 -->
    <div class="controlBtnBox">
      <div>
        <!-- <el-button size="small">后撤</el-button>
        <el-button size="small">前进</el-button> -->
        <div :class="['operation-item', { disable: !undoable }]" @click="undoable ? handleHistory('undo') : ''"><i class="iconfont icon-undo" /></div>
        <div :class="['operation-item', { disable: !redoable }]" @click="redoable ? handleHistory('redo') : ''"><i class="iconfont icon-redo" /></div>
      </div>
      <!-- 分页器 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        size="default"
        :background="true"
        layout="prev, ->, slot, next"
        :total="total"
        @current-change="handleCurrentChange"
      >
        <span style="padding: 0 10px;">{{currentPage}}/{{total}}</span>
      </el-pagination>
      <div>
        <el-button size="small">页面</el-button>
        <el-button size="small">设置</el-button>
      </div>
    </div>
    <!-- 右侧面板 -->
    <style-panel-h5></style-panel-h5>
  </div>
</template>

<script lang="ts" setup>
import api from '@/api'
import { storeToRefs, createPinia  } from 'pinia'
import { ElLoading, ElPagination } from 'element-plus'
import { onMounted, Ref, ref, reactive,computed } from 'vue'
import { getTarget } from '@/common/methods/target'
import setWidgetData from '@/common/methods/DesignFeatures/setWidgetData'
import PointImg from '@/utils/plugins/pointImg'
import getComponentsData from '@/common/methods/DesignFeatures/setComponents'
import { debounce } from 'throttle-debounce'
import { move, moveInit } from '@/mixins/move'
import { useCanvasStore, useControlStore, useWidgetStore, useHistoryStore } from '@/store'
import { TPageState } from '@/store/design/canvas/d'
import watermark from './comps/pageWatermark.vue'
import useScroll from './hooks/useScroll'
import Moveable from '@/components/business/moveable/Moveable.vue'
import useNotification from '@/common/methods/notification'
import useHistory from '@/common/hooks/history'
import { useRoute, useRouter } from 'vue-router'

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

const route = useRoute()
const router = useRouter()
const controlStore = useControlStore()
const widgetStore = useWidgetStore()
const historyStore = useHistoryStore()
const canvasStore = useCanvasStore()
const { dHistoryParams, dHistoryStack } = storeToRefs(useHistoryStore())

const { pageDesignCanvasId, isH5 } = defineProps<TProps>()
const { dPage } = storeToRefs(useCanvasStore())
let { dZoom, dPresetPadding, dPaddingTop, dScreen } = storeToRefs(canvasStore)
const { dDraging, showRotatable, dAltDown, dSpaceDown } = storeToRefs(controlStore)
const { dWidgets, dActiveElement, dSelectWidgets, dHoverUuid,dLayouts } = storeToRefs(widgetStore)
// 分页设置
let currentPage = ref(1);
let pageSize = ref(1);
let total = ref(5)
// 控制滚动相关的hooks
// const {autoScroll, page_index, page_type, fnAutoScroll, fnAutoTurnPage, mousedown, mousemove, mouseup, touchstart, touchend} = useScroll(dPage, dLayouts)
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
// 爲了優化loading之前的樣式問題
setTimeout(() => {
  isShow.value = true;
}, 100);
let _dropIn: string | null = ''
let _srcCache: string | null = ''
onMounted(() => {
  getScreen()
  setTimeout(() => {
    dZoom.value = document.body.clientWidth / dPage.value.width * 100
    loading.value = false;
    let elements = document.getElementsByClassName('zk-moveable-style')
    for (var i = 0; i < elements.length; i++) {
      elements[i].style.scale = (dZoom.value / 100);
    }
    total.value = dLayouts.value.length;
// const pinia = createPinia()
// use(pinia)
// useHistory()  // pinia问题
  }, 1e3);
  const pageDesignEl = document.getElementById('page-design')
  if (!pageDesignEl) return
  pageDesignEl.addEventListener('mousedown', handleSelection, false)
  pageDesignEl.addEventListener('mousemove', debounce(100, false, handleMouseMove), false)
  // 绑定空格事件
  const scrollContainer: any = document.querySelector('#main')
  const dragContainer: any = pageDesignEl
  dragContainer.onmousedown = (e: any) => {
    let mouseDownScrollPosition = {
      scrollLeft: scrollContainer.scrollLeft,
      scrollTop: scrollContainer.scrollTop,
    }
    let mouseDownPoint = {
      x: e.clientX,
      y: e.clientY,
    }
    dragContainer.onmousemove = (e: any) => {
      if (!dSpaceDown.value) return
      let dragMoveDiff = {
        x: mouseDownPoint.x - e.clientX,
        y: mouseDownPoint.y - e.clientY,
      }
      scrollContainer.scrollLeft = mouseDownScrollPosition.scrollLeft + dragMoveDiff.x
      scrollContainer.scrollTop = mouseDownScrollPosition.scrollTop + dragMoveDiff.y
    }
    document.onmouseup = (e) => {
      dragContainer.onmousemove = null
      document.onmouseup = null
    }
  }
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

async function handleMouseMove(e: MouseEvent) {
  if (!e || !e.target) return
  const imageTarget = e.target as HTMLImageElement
  const pImg = new PointImg(imageTarget)
  const { rgba } = pImg.getColorXY(e.offsetX, e.offsetY)
  if (rgba && rgba === 'rgba(0,0,0,0)') {
    console.log('解析点位颜色: ', rgba)
    let target = await getTarget(imageTarget)
    if (!target) return
    target.style.pointerEvents = 'none'
    setTimeout(() => {
      if (!target) return
      target.style.pointerEvents = 'auto'
    }, 300)
  }
}

async function handleSelection(e: MouseEvent) {
  // 重置uuid为null
  dActiveElement.value = null;
  console.log('dActiveElement', dActiveElement.value);
  if (e.which === 3) {
    return
  }
  if (!e || !e.target) return
  let target = await getTarget(e.target as HTMLElement)
  if (!target) return
  let type = target.getAttribute('data-type')
  if (type) {
    let uuid = target.getAttribute('data-uuid')
    console.log('dLayouts', dLayouts);
    console.log('dWidgets', dWidgets.value);
    console.log('dActiveElement', dActiveElement.value);
    
    // 给当前点击的uuid赋值
    dHoverUuid.value = uuid
    // 切换当前页面数据（为当前页数据）
    dWidgets.value = dLayouts.value[currentPage.value - 1].layers;
    if (uuid !== '-1' && !dAltDown.value) {
      // let widget = dWidgets.value.find((item: { uuid: string }) => item.uuid === uuid)
      let widget = dWidgets.value.find((item: { uuid: string }) => item.uuid === uuid)
      // 切换当前选中的元素控件(匹配当前页面数据的选中元素uuid)
      dActiveElement.value = widget;
      if (!widget || !dActiveElement.value) return
      if (widget.parent !== '-1' && widget.parent !== dActiveElement.value.uuid && widget.parent !== dActiveElement.value.parent) {
        uuid = widget.parent || null
      }
    }

    // 设置选中元素
    // this.$store.commit('setMoveable', false)
    if (showRotatable.value !== false) {
      widgetStore.selectWidget({
        uuid: uuid ?? ' -1',
      })
      // store.dispatch('selectWidget', {
      //   uuid: uuid,
      // })
    }

    if (uuid !== '-1') {
      moveInit.methods.initmovement(e) // 参见 mixins
    }
  } else {
    // 取消选中元素
    widgetStore.selectWidget({
      uuid: '-1',
    })
    // store.dispatch('selectWidget', {
    //   uuid: '-1',
    // })
  }
}

async function dropOver(e: MouseEvent) {
  if (!dActiveElement.value) return
  if (dActiveElement.value.editable || dActiveElement.value.lock) {
    return false
  }
  e.preventDefault()
  let { data, type } = widgetStore.selectItem
  if (!data) return
  if (type !== 'image') {
    return
  }
  if (!e || !e.target) return
  const eventTarget = e.target as HTMLElement
  const target = await getTarget(eventTarget)
  if (!target) return
  const uuid = target.getAttribute('data-uuid')

  widgetStore.setDropOver(uuid ?? '-1')
  // store.dispatch('setDropOver', uuid)

  const imgEl = target?.firstElementChild?.firstElementChild as HTMLImageElement
  if (eventTarget.getAttribute('putIn')) {
    _dropIn = uuid
    const imgUrl = data.value.thumb || data.value.url
    !_srcCache && (_srcCache = imgEl.src)
    imgEl.src = imgUrl
  } else {
    _srcCache && (imgEl.src = _srcCache)
    _srcCache = ''
    _dropIn = ''
  }
}

async function drop(e: MouseEvent) {
  if (!dDraging.value) {
    return
  }
  if (!e || !e.target) return
  const eventTarget = e.target as HTMLElement

  controlStore.setDraging(false)
  // store.commit('setDraging', false)

  const dropIn = _dropIn
  _dropIn = ''

  widgetStore.setDropOver('-1')
  // store.dispatch('setDropOver', '-1')

  // store.commit('setShowMoveable', false) // 清理上一次的选择
  controlStore.setShowMoveable(false) // 清理上一次的选择

  let lost = eventTarget.className !== 'design-canvas' // className === 'design-canvas' , id: "page-design-canvas"
  // e.stopPropagation()
  e.preventDefault()
  let { data: item, type } = JSON.parse(JSON.stringify(widgetStore.selectItem))
  // 清除临时数据
  widgetStore.setSelectItem({})
  // store.commit('selectItem', {})

  let setting: TSetting = {}
  if (!type) {
    return
  }
  // 处理数据
  setting = await setWidgetData(type, item, setting)
  // 绝对坐标
  const canvasEl = document.getElementById('page-design-canvas')
  if (!canvasEl) return
  const lostX = e.x - canvasEl.getBoundingClientRect().left
  const lostY = e.y - canvasEl.getBoundingClientRect().top
  // 放置组合
  if (type === 'group') {
    let parent: TParentData = {}
    const componentItem = await getComponentsData(item)
    // item = await getComponentsData(item)
    componentItem.forEach((element) => {
      if (element.type === 'w-group') {
        parent.width = element.width
        parent.height = element.height
      }
    })
    const half = {
      x: parent.width ? (parent.width * dZoom.value) / 100 / 2 : 0,
      y: parent.height ? (parent.height * dZoom.value) / 100 / 2 : 0,
    }
    componentItem.forEach((element) => {
      element.left += (lost ? lostX - half.x : e.layerX - half.x) * (100 / dZoom.value)
      element.top += (lost ? lostY - half.y : e.layerY - half.y) * (100 / dZoom.value)
    })
    widgetStore.addGroup(componentItem)
    // store.dispatch('addGroup', componentItem)
    // addGroup(item)
  }
  // 设置坐标
  const half = {
    x: setting.width ? (setting.width * dZoom.value) / 100 / 2 : 0,
    y: setting.height ? (setting.height * dZoom.value) / 100 / 2 : 0,
  }
  // const half = { x: (this.dDragInitData.offsetX * this.dZoom) / 100, y: (this.dDragInitData.offsetY * this.dZoom) / 100 }
  setting.left = (lost ? lostX - half.x : e.layerX - half.x) * (100 / dZoom.value)
  setting.top = (lost ? lostY - half.y : e.layerY - half.y) * (100 / dZoom.value)
  if (lost && type === 'image') {
    // 如果不从画布加入，且不是图片类型，则判断是否加入到svg中
    const target = await getTarget(eventTarget)
    if (!target) return
    const targetType = target.getAttribute('data-type')
    const uuid = target.getAttribute('data-uuid')
    if (targetType === 'w-mask') {
      // 容器
      // store.commit('setShowMoveable', true) // 恢复选择
      controlStore.setShowMoveable(true) // 恢复选择

      const widget = dWidgets.value.find((item: { uuid: string }) => item.uuid === uuid)
      if (!widget) return
      widget.imgUrl = item.value.url
      // if (e.target.className.baseVal) {
      //   !widget.imgs && (widget.imgs = {})
      //   widget.imgs[`${e.target.className.baseVal}`] = item.value.url
      // }
    } else {
      if (dropIn) {
        const widget = dWidgets.value.find((item: { uuid: string }) => item.uuid == dropIn)
        if (!widget) return
        widget.imgUrl = item.value.url
        console.log('加入+', widget)

        // store.commit('setShowMoveable', true) // 恢复选择
        controlStore.setShowMoveable(true) // 恢复选择
      } else {
        widgetStore.addWidget(setting as Required<TPageState>)
        // store.dispatch('addWidget', setting) // 正常加入面板
      }
    }
  } else if (type === 'bg') {
    console.log('背景图片放置')
  } else if (type !== 'group') {
    console.log(setting)
    widgetStore.addWidget(setting as Required<TPageState>)
    // store.dispatch('addWidget', setting) // 正常加入面板
  }
  // 清除临时数据
  // this.$store.commit('selectItem', {})
}
// 切换分页时，清空选择框
function handleCurrentChange(e){
  controlStore.setShowMoveable(false)
}
// 保存作品
async function save(hasCover: boolean = false) {
  // 没有任何修改记录则不保存(暂时注释)
  // if (dHistoryStack.value.changes.length <= 0) {
  //   return useNotification('保存失败', '可能是没有修改任何东西哦~', { type: 'error' })
  // }
  controlStore.setShowMoveable(false) // 清理掉上一次的选择框
  // console.log(proxy?.dPage, proxy?.dWidgets)
  const { page_type } = dPage.value
  const { id } = route.query
  // const cover = hasCover ? await draw() : undefined
  // const widgets = dWidgets.value // reviseData()
  const data = widgetStore.dLayouts
  console.log(data);
  data.map(item => {
    item.global.page_type =  page_type; // 接口不是我们的，公共参数没有接收这个参数，只能先放在这里
  })
  console.log(dPage)
  // cover, 
  const { id: newId, stat, msg } = await api.home.saveTemp({ id: (id as string), title: dPage.value.title || '未命名设计', data: JSON.stringify(data), width: dPage.value.width, height: dPage.value.height, autoScroll: dPage.value.autoScroll, scrollSpeed: dPage.value.scrollSpeed, page_type: page_type || 'turnPage'  })
  stat !== 0 ? useNotification('保存成功', '可在"我的作品"中查看') : useNotification('保存失败', msg, { type: 'error' })
  !id && router.push({ path: '/home', query: { id: newId }, replace: true })
  controlStore.setShowMoveable(true)
}
// 前进和回退
function handleHistory(data: "undo" | "redo") {
  historyStore.handleHistory(data)
}
const undoable = computed(() => {
  return dHistoryParams.value.stackPointer >= 0
  // return !(
  //   dHistoryParams.value.index === -1 || 
  //   (dHistoryParams.value.index === 0 && dHistoryParams.value.length === dHistoryParams.value.maxLength))
})

const redoable = computed(() => {
  return !(dHistoryParams.value.stackPointer === dHistoryStack.value.changes.length - 1)
})
</script>

<style lang="less" scoped>
#editContent{
  background-color: #f3f5f7;
}
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
// 头部按钮组样式
.headBtnBox{
  display: flex;
  justify-content: space-between;
  width: 94%;
  padding: 15px 0;
  margin: auto;
}
// 控制按钮组样式
.controlBtnBox{
  display: flex;
  justify-content: space-between;
  width: 94%;
  padding: 15px 0;
  margin: -22% auto 0;
}
</style>
