<!--
 * @Author: ShawnPhang
 * @Date: 2022-01-12 11:26:53
 * @Description: 顶部操作按钮组
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-17 09:49:01
-->
<template>
  <div class="top-title"><el-input v-model="state.title" placeholder="未命名的设计" class="input-wrap" /></div>
  <div class="top-icon-wrap">
    <template v-if="tempEditing">
      <!-- <span style="color: #999; font-size: 14px; margin-right: 0.5rem">{{ state.stateBollean ? '启用' : '停用' }}</span> <el-switch v-model="state.stateBollean" @change="stateChange" />
      <div class="divide__line">|</div> -->
      <el-button plain type="primary" @click="saveTemp">保存模板</el-button>
      <el-button @click="userStore.managerEdit(false)">取消</el-button>
      <!-- <el-button @click="$store.commit('managerEdit', false)">取消</el-button> -->
      <div class="divide__line">|</div>
    </template>
    <el-button v-else style="margin-right: 1rem" @click="jump2Edit">修改模板</el-button>
    <watermark-option style="margin-right: 0.5rem" />
    <!-- <copyRight> -->
    <slot />
    <!-- <el-button :loading="state.loading" size="large" class="primary-btn" :disabled="tempEditing" plain type="primary" @click="download">下载作品</el-button> -->
    <!-- </copyRight> -->
  </div>
  <!-- 生成图片组件 -->
  <SaveImage ref="canvasImage" />
  <!-- 预览弹窗 -->
  <!-- <el-drawer
      v-model="drawer"
      title="预览"
      direction="rtl"
      :append-to-body="true"
      :before-close="handleClose"
    >
    <Draw></Draw>
  </el-drawer> -->
</template>

<script lang="ts" setup>
import api from '@/api'
import { reactive, toRefs, ref, Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import _dl from '@/common/methods/download'
import useNotification from '@/common/methods/notification'
import SaveImage from '@/components/business/save-download/CreateCover.vue'
import { useFontStore } from '@/common/methods/fonts'
// import copyRight from './CopyRight.vue'
import _config from '@/config'
import downloadBlob from '@/common/methods/download/downloadBlob'
import { useControlStore, useHistoryStore, useCanvasStore, useUserStore, useWidgetStore } from '@/store/index'
import { storeToRefs } from 'pinia'
import watermarkOption from './Watermark.vue'
import { log } from 'console'
import { ElDrawer } from 'element-plus'
import Draw from '@/views/Draw.vue'

type TProps = {
  modelValue?: boolean
}

type TEmits = {
  (event: 'change', data: { downloadPercent: number; downloadText: string }): void
  (event: 'update:modelValue', data: boolean): void
}

type TState = {
  stateBollean: boolean
  wmBollean: boolean
  title: string
  loading: boolean
}

const props = defineProps<TProps>()
const emit = defineEmits<TEmits>()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const widgetStore = useWidgetStore()

const canvasImage = ref<typeof SaveImage | null>(null)

// const {
//   dWidgets, tempEditing
// } = useSetupMapGetters(['dWidgets', 'tempEditing'])

const pageStore = useCanvasStore()
const controlStore = useControlStore()
const historyStore = useHistoryStore()

const { dPage } = storeToRefs(pageStore)
const { tempEditing } = storeToRefs(userStore)
const { dWidgets, dLayouts } = storeToRefs(widgetStore)
const { dHistoryStack } = storeToRefs(useHistoryStore())
let drawer: Ref<Boolean> = ref(false); // 是否预览弹窗

const state = reactive<TState>({
  stateBollean: false,
  wmBollean: false,
  title: '',
  loading: false,
})

// 保存作品
async function save(hasCover: boolean = false) {
  controlStore.setShowMoveable(false) // 清理掉上一次的选择框
  const { id, tempid, page_type } = route.query
  const cover = hasCover ? await draw() : undefined
  const data = widgetStore.dLayouts
  console.log(data);
  data.map(item => {
    item.global.page_type =  page_type || dPage.value.page_type; // 接口不是我们的，公共参数没有接收这个参数，只能先放在这里
  })
  console.log(dPage)
  const { id: newId, stat, msg } = await api.home.saveTemp({ cover, id: (id as string), title: state.title || '未命名设计', data: JSON.stringify(data), temp_id: (tempid as string), width: dPage.value.width, height: dPage.value.height, autoScroll: dPage.value.autoScroll, scrollSpeed: dPage.value.scrollSpeed, page_type: page_type || 'turnPage'  })
  stat !== 0 ? useNotification('保存成功', '可在"我的作品"中查看') : useNotification('保存失败', msg, { type: 'error' })
  !id && router.push({ path: '/home', query: { id: newId }, replace: true })
  controlStore.setShowMoveable(true)

  // ↑↑↑ 上面是旧的
  // 保存用户作品的原理和保存模板是相通的，所以这里反过来用模板示例
  // await saveTemp()
}

// 保存模板
async function saveTemp() {
  const { tempid, tempType: type } = route.query
  if (!tempid) return
  let res = null
  const data = widgetStore.dLayouts
  if (Number(type) == 1) {
    // 保存组件，组合元素要保证在最后一位，才能默认选中
    if (dWidgets.value[0].type === 'w-group') {
      const group = dWidgets.value.shift()
      if (!group) return
      group.record.width = 0
      group.record.height = 0
      dWidgets.value.push(group)
    }
    // TODO：如果保存组件不存在组合，则添加组合。该功能待优化
    if (!dWidgets.value.some((x: Record<string, any>) => x.type === 'w-group')) {
      alert('提交组件必须为组合！')
      return
      // proxy.dWidgets.push(wGroup.setting)
    }
    res = await api.home.saveTemp({ id: tempid, type, title: state.title || '未命名组件', data: JSON.stringify(dWidgets.value), width: dPage.value.width, height: dPage.value.height })
  } else res = await api.home.saveTemp({ id: tempid, title: state.title || '未命名模板', data: JSON.stringify(data), width: dPage.value.width, height: dPage.value.height })
  res.stat != 0 && useNotification('保存成功', '模板内容已变更')
  !tempid && router.push({ path: '/home', query: { tempid: res.id }, replace: true })
}

// 停用启用
async function stateChange(e: string | number | boolean) {
  const { tempid, tempType: type } = route.query
  const { stat } = await api.home.saveTemp({ id: tempid, type, state: e ? 1 : 0 })
  stat != 0 && useNotification('保存成功', '模板内容已变更')
}
async function download() {
  if (state.loading === true) {
    useNotification('作品导出中', '当前有作品正在导出，请稍候再试')
    return
  }
  state.loading = true
  emit('update:modelValue', true)
  emit('change', { downloadPercent: 1, downloadText: '保存数据中,请稍候..' })
  const currentRecord = pageStore.dCurrentPage
  const backEndCapture: boolean = checkDownloadPoster(dLayouts.value[currentRecord])
  const fileName = `${state.title || '未命名作品'}.png`
  if (!backEndCapture) {
    // 无特殊条件命中则直接从前端出图
    const { blob } = await canvasImage.value?.createPoster()
    downloadBlob(blob, fileName)
    emit('change', { downloadPercent: 100, downloadText: '作品下载成功' })
    state.loading = false
  }
  await save(true)
  const { id, tempid } = route.query
  if (!id && !tempid) {
    emit('change', { downloadPercent: 0, downloadText: '请稍候..' })
    useNotification('保存失败', '可能暂不支持的功能，先选择模板后操作', { type: 'error' })
    state.loading = false
    return
  }
  if (backEndCapture) {
    // 从服务端生成图片
    const { width, height } = dPage.value
    emit('update:modelValue', true)
    emit('change', { downloadPercent: 1, downloadText: '正在处理数据...' })
    let timerCount = 0
    const animation = setInterval(() => {
      if (props.modelValue && timerCount < 75) {
        timerCount += RandomNumber(1, 10)
        emit('change', { downloadPercent: 1 + timerCount, downloadText: '正在合成图片' })
      } else {
        clearInterval(animation)
      }
    }, 800)
    await _dl.downloadImg(
      api.home.download({ id, tempid, width, height, index: pageStore.dCurrentPage }) + '&r=' + Math.random(),
      (progress: number, xhr: any) => {
        if (props.modelValue) {
          clearInterval(animation)
          progress >= timerCount && emit('change', { downloadPercent: Number(progress.toFixed(0)), downloadText: '图片生成中' })
        } else {
          xhr.abort()
          state.loading = false
        }
      },
      fileName,
    )
    emit('change', { downloadPercent: 100, downloadText: '作品下载成功', downloadMsg: '' })
    state.loading = false
  }
}
function RandomNumber(min: number, max: number) {
  return Math.ceil(Math.random() * (max - min)) + min
}

async function load(cb: () => void) {
  
  
  const { id, tempid: tempId, tempType: type, w_h, name, page_type } = route.query
  state.title = dPage.name || name || '';
  dPage.value.page_type = page_type;
  console.log(dPage)
  if (route.name !== 'Draw') {
    await useFontStore.init() // 初始化加载字体
  }
  const apiName = tempId && !id ? 'getTempDetail' : 'getWorks'
  if (w_h && !id && !tempId) {
    // 用于初始化画布大小，创建空作品
    const wh: any = w_h.toString().split('*')
    wh[0] && (dPage.value.width = wh[0])
    wh[1] && (dPage.value.height = wh[1])
    dPage.value.autoScroll = true; // 新增时设置默认滚动
    dPage.value.scrollSpeed = page_type === 'longPage' ? 10 : 1000; // 新增时设置默认滚动时间（毫秒）
    dPage.value.scrolldelay = 1000; // 新增时设置默认停止滚动后继续的时间（毫秒）
    dPage.value.page_type = content[0].global.page_type; // 暂时放着，后续抽到公共那里去
    console.log(dPage.value.page_type);
    
  }
  if (!id && !tempId) {
    initBoard()
    cb()
    return
  }
  const { data: content, title, state: _state, width, height } = await api.home[apiName]({ id: id || tempId, type })
  if (!content) return
  const data = JSON.parse(content)
  state.stateBollean = !!_state
  state.title = title
  controlStore.setShowMoveable(false) // 清理掉上一次的选择框
  console.log('--------------------------------');
  
  console.log(dPage.value);
  console.log(data[0]);
  
  dPage.value.page_type = data[0].global.page_type; // 暂时放着，后续抽到公共那里去
  if (type == 1) {
    // 加载文字组合组件
    dPage.value.width = width
    dPage.value.height = height
    widgetStore.addGroup(data)
  } else {
    if (Array.isArray(data)) {
      widgetStore.dLayouts = data
      widgetStore.setDWidgets(widgetStore.getWidgets())
    } else {
      widgetStore.dLayouts = [{ global: data.page, layers: data.widgets }]
      id ? widgetStore.setDWidgets(widgetStore.getWidgets()) : widgetStore.setTemplate(widgetStore.getWidgets())
    }
    pageStore.setDPage(pageStore.getDPage())
    // id ? widgetStore.setDWidgets(data.widgets) : widgetStore.setTemplate(data.widgets)
  }
  cb()
}

function initBoard() {
  widgetStore.setDWidgets(widgetStore.getWidgets())
  pageStore.setDPage(pageStore.getDPage())
}

function draw() {
  return new Promise<string>((resolve) => {
    if (!canvasImage.value) resolve('')
    else {
      canvasImage.value.createCover(({ key }: { key: string }) => {
        resolve(_config.IMG_URL + key)
      })
    }
  })
}

// 预览
async function preview(){
  // draw()
  // console.log(widgetStore.dLayouts);
  // 预览之前先保存
  await save(true)
  const { id, tempid } = route.query
  window.open(router.resolve(`/preview?id=${id}`).href, '_blank')
  // drawer.value = true;
  // controlStore.setShowMoveable(false)
}
function handleClose(){
  // drawer.value = false;
}
function jump2Edit() {
  userStore.managerEdit(true)
}

function checkDownloadPoster({ layers }: any) {
  let backEndCapture = false
  for (let i = 0; i < layers.length; i++) {
    const { type, mask, textEffects } = layers[i]
    if ((type === 'w-image' && mask) || type === 'w-svg' || type === 'w-qrcode' || (textEffects && textEffects.length > 0)) {
      backEndCapture = true
      break
    }
  }
  return backEndCapture
}

defineExpose({
  download,
  save,
  saveTemp,
  stateChange,
  load,
  preview,
})
</script>

<style lang="less" scoped>
.top-icon-wrap {
  display: flex;
  align-items: center;
  padding-right: 20px;
  height: 54px;
  .top-icon {
    background-color: rgba(0, 0, 0, 0.4);
    border-radius: 5px;
    color: #ffffff;
    cursor: pointer;
    font-weight: bold;
    margin: 8px;
    padding: 5px 8px;
    &:hover {
      background-color: rgba(0, 0, 0, 0.5);
    }
  }
}
.top-title {
  color: @color-black;
  flex: 1;
  padding-left: 20px;
  // font-weight: bold;
  .input-wrap {
    // box-shadow: none;
    width: 15rem;
    :deep(input) {
      border-color: #ffffff;
      // border-color: #e8eaec;
    }
  }
  .input-wrap:hover {
    :deep(input) {
      // border-color: #e8eaec;
    }
  }
}
.primary-btn {
  font-weight: 600;
  transform: scale(0.95);
  margin-left: 10px;
}
.divide__line {
  margin: 0 1rem;
  color: #e8eaec;
  height: 20px;
}
</style>
