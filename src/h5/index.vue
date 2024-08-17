<template>
  <div id="page-design-index h5-page-design-index" ref="pageDesignIndex">
    <div class="page-design-index-wrap" id="preview">
      <design-board :isH5="true" v-if='!isH5Edit' class="page-design-wrap fixed-canvas" pageDesignCanvasId="page-design-canvas"></design-board>
      <h5-edit :isH5="true" v-else class="page-design-wrap fixed-canvas" pageDesignCanvasId="page-design-canvas"></h5-edit>
    </div>
    <!-- 缩放控制 -->
    <zoom-control :isH5="true"/>
    <!-- 右键菜单 -->
    <right-click-menu />
  </div>
</template>

<script lang="ts" setup>
  import _config from '../config'
  import {
    CSSProperties, computed, nextTick,
    onBeforeUnmount, onMounted, reactive, ref, Ref, watch
  } from 'vue'
  import RightClickMenu from '@/components/business/right-click-menu/RcMenu.vue'
  import zoomControl from '@/components/modules/layout/zoomControl/index.vue'
  import lineGuides from '@/components/modules/layout/lineGuides.vue'
  import shortcuts from '@/mixins/shortcuts'
  import HeaderOptions from './components/HeaderOptions.vue'
  import ProgressLoading from '@/components/common/ProgressLoading/download.vue'
  import { wGroupSetting } from '@/components/modules/widgets/wGroup/groupSetting'
  import { storeToRefs } from 'pinia'
  import { useCanvasStore, useControlStore, useHistoryStore, useWidgetStore, useGroupStore } from '@/store'
  import type { ButtonInstance } from 'element-plus'
  import Tour from './components/Tour.vue'
  import createDesign from '@/components/business/create-design'
  import multipleBoards from '@/components/modules/layout/multipleBoards'
  import useHistory from '@/common/hooks/history'
  import { useRoute } from 'vue-router'
  import designBoard from '@/components/modules/layout/designBoard/previewBoard.vue'
  import h5Edit from '@/components/modules/layout/designBoard/h5Edit.vue'
  import api from '@/api'
  import Preload from '@/utils/plugins/preload'
  import FontFaceObserver from 'fontfaceobserver'
  import { fontWithDraw, font2style } from '@/utils/widgets/loadFontRule'
  useHistory()

  const ref1 = ref<ButtonInstance>()
  const ref2 = ref<ButtonInstance>()
  const ref3 = ref<ButtonInstance>()
  const ref4 = ref<ButtonInstance>()

  type TState = {
    style: CSSProperties
    downloadPercent: number // 下载进度
    downloadText: string
    downloadMsg: string | undefined
    isContinue: boolean
    APP_NAME: string
    showLineGuides: boolean
  }

  // const {
  //   dActiveElement, dCopyElement
  // } = useSetupMapGetters(['dActiveElement', 'dCopyElement'])
  const widgetStore = useWidgetStore()
  const pageStore = useCanvasStore()
  const historyStore = useHistoryStore()
  const groupStore = useGroupStore()
  const { dPage } = storeToRefs(pageStore)
  // const { dPage } = storeToRefs(useCanvasStore())
  const { dZoom } = storeToRefs(useCanvasStore())
  const { dHistoryParams, dHistoryStack } = storeToRefs(useHistoryStore())

  const state = reactive<TState>({
    style: {
      left: '0px',
    },
    // openDraw: false,
    downloadPercent: 0, // 下载进度
    downloadText: '',
    downloadMsg: '',
    isContinue: true,
    APP_NAME: _config.APP_NAME,
    showLineGuides: false,
  })
  const optionsRef = ref(null)
  const zoomControlRef = ref<typeof zoomControl | null>(null)
  const controlStore = useControlStore()
  const createDesignRef: Ref<typeof createDesign | null> = ref(null)
  const route = useRoute()
  const beforeUnload = function (e: Event): any {
    if (dHistoryStack.value.changes.length > 0) {
      const confirmationMessage: string = '系统不会自动保存您未修改的内容';
      (e || window.event).returnValue = (confirmationMessage as any) // Gecko and Trident
      return confirmationMessage // Gecko and WebKit
    } else return false
  }

  !_config.isDev && window.addEventListener('beforeunload', beforeUnload)

  function jump2home() {
    const fullPath = window.location.href.split('/')
    window.open(fullPath[0] + '//' + fullPath[2])
    // window.open('https://xp.palxp.cn/')
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

  function zoomSub() {
    if (!zoomControlRef.value) return
    zoomControlRef.value.sub()
  }

  function zoomAdd() {
    if (!zoomControlRef.value) return
    zoomControlRef.value.add()
  }

  const { handleKeydowm, handleKeyup, dealCtrl } = shortcuts.methods
  let checkCtrl: number | undefined
  const instanceFn = { zoomAdd, zoomSub }

  let isH5Edit = ref(false)
  onMounted(() => {  
    const { edit  }: any = route.query 
    isH5Edit.value = edit;
    console.log('isH5Edit', isH5Edit.value);
    fnMounted();
  })
  function fnMounted(){
    
    console.log("onMounted")
    groupStore.initGroupJson(JSON.stringify(wGroupSetting))
    // store.dispatch('initGroupJson', JSON.stringify(wGroupSetting))
    // initGroupJson(JSON.stringify(wGroup.setting))
    window.addEventListener('scroll', fixTopBarScroll)
    // window.addEventListener('click', this.clickListener)
    document.addEventListener('keydown', handleKeydowm(controlStore, checkCtrl, instanceFn, dealCtrl), false)
    document.addEventListener('keyup', handleKeyup(controlStore, checkCtrl), false)
    loadData()
    nextTick(() => {
      load()
    })
  }

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', fixTopBarScroll)
    // window.removeEventListener('click', this.clickListener)
    document.removeEventListener('keydown', handleKeydowm(controlStore, checkCtrl, instanceFn, dealCtrl), false)
    document.removeEventListener('keyup', handleKeyup(controlStore, checkCtrl), false)
    document.oncontextmenu = null
  })

  function handleHistory(data: "undo" | "redo") {
    historyStore.handleHistory(data)
  }

  function changeLineGuides() {
    state.showLineGuides = !state.showLineGuides
  }

  function downloadCancel() {
    state.downloadPercent = 0
    state.isContinue = false
  }

  function loadData() {
    
    console.log("optionsRef---")
    console.log(widgetStore)
    
    // 初始化加载页面
    if (!optionsRef.value) return
    optionsRef.value.load(async () => {
      if (!zoomControlRef.value) return
      // await nextTick()
      // zoomControlRef.value.screenChange()
      // 初始化激活的控件为page
      widgetStore.selectWidget({ uuid: '-1' })
    })
  }

  function fixTopBarScroll() {
    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
    state.style.left = `-${scrollLeft}px`
  }

  function optionsChange({ downloadPercent, downloadText, downloadMsg }: { downloadPercent: number, downloadText: string, downloadMsg?: string }) {
    state.downloadPercent = downloadPercent
    state.downloadText = downloadText
    state.downloadMsg = downloadMsg
  }

  const tourRef = ref<any>()
  const fns: any = {
    changeLineGuides
  }
  const dealWith = (fnName: string, params?: any) => {
    fns[fnName](params)
  }

  async function load() {
    let backgroundImage = ''
    let loadFlag = false
    const { id, tempid, tempType: type = 0, index = 0, edit  }: any = route.query 
    isH5Edit.value = edit;
    console.log('isH5Edit', isH5Edit.value);
    
    if (id || tempid) {
      const postData = {
        id: Number(id || tempid),
        type: Number(type)
      }
      const { data, width, height } = await api.home[id ? 'getWorks' : 'getTempDetail'](postData)
      console.log('{ data, width, height }', { data, width, height });
      
      let content = JSON.parse(data)
      const isGroupTemplate = Number(type) == 1

      if (Array.isArray(content)) {
        widgetStore.dLayouts = content
        widgetStore.setDWidgets(widgetStore.getWidgets())
        const { global, layers } = content[index]
        content = {page: global, widgets: layers}
      }
      const widgets = isGroupTemplate ? content : content.widgets

      if (isGroupTemplate) {
        dPage.value.width = width
        dPage.value.height = height
        dPage.value.backgroundColor = '#ffffff00'
        widgetStore.addGroup(content)
        dPage.value.page_type = content[0].global.page_type; // 暂时放着，后续抽到公共那里去
      } else {
        pageStore.setDPage(content.page)
        // 移除背景图，作为独立事件
        backgroundImage = content.page?.backgroundImage
        backgroundImage && delete content.page.backgroundImage
        pageStore.setDPage(content.page)
        if (id) {
          widgetStore.setDWidgets(widgets)
        } else {
          widgetStore.setTemplate(widgets)
        }
      }

      await nextTick()

      const imgsData: HTMLImageElement[] = []
      const svgsData: HTMLImageElement[] = []
      const fontLoaders: Promise<void>[] = []
      const fontContent: Record<string, string> = {}
      let fontData: string[] = []
      widgets.forEach((item: any) => {
        if (item.fontClass && item.fontClass.value) {
          const loader = new FontFaceObserver(item.fontClass.value)
          fontData.push(item.fontClass)
          fontLoaders.push(loader.load(null, 30000)) // 延长超时让检测不会丢失字体
          // 按字体来收集所有文字
          if (fontContent[item.fontClass.value]) {
            fontContent[item.fontClass.value] += item.text
          } else {
            fontContent[item.fontClass.value] = item.text
          }
        }
        // 收集图片元素、svg元素
        try {
          if (item.svgUrl && item.type === 'w-svg') {
            const cNodes: any = (window as any).document.getElementById(item.uuid).childNodes
            svgsData.push(cNodes)
          } else if (item.imgUrl && !item.isNinePatch) {
            const cNodes: any = (window as any).document.getElementById(item.uuid).childNodes
            for (const el of cNodes) {
              if (el.className && el.className.includes('img__box')) {
                imgsData.push(el.firstChild)
              }
            }
          }
        } catch (e) {}
      })
      // 背景图无法检测是否加载完毕，所以单独做判断
      if (backgroundImage) {
        const preloadBg = new Preload([backgroundImage])
        await preloadBg.imgs()
        pageStore.setDPage({...content.page, ...{backgroundImage}})
        // store.commit('setDPage', {...content.page, ...{backgroundImage}})
      }
      try {
        fontWithDraw && (await font2style(fontContent, fontData))
        // console.log('1. base64 yes')
        const preload = new Preload(imgsData)
        await preload.doms()
        // console.log('2. image yes')
        const preload2 = new Preload(svgsData)
        await preload2.svgs()
        // console.log('3. svg yes')
      } catch (e) {
        console.log(e)
      }
      try {
        await Promise.all(fontLoaders)
        // console.log('4. font yes')
      } catch (e) {
        // console.log(e)
      }
      loadFlag = true
      console.log('--> now u can start screenshot!')
      setTimeout(() => {
        try {
          ;(window as any).loadFinishToInject('done')
        } catch (err) {}
      }, 100)
    }
    // 超时
    setTimeout(() => {
      !loadFlag && (window as any).loadFinishToInject('done')
    }, 60000)
  }
  defineExpose({
    jump2home,
  })
</script>

<style lang="less" scoped>
@import url('@/assets/styles/design.less');
.fixed-canvas {
  :deep(#page-design-canvas) {
    // position: fixed !important;
    top: 0 !important;
    left: 0 !important;
  }
}
.h5-page-design-index{
  min-height: unset;
  min-width: unset;
}
</style>

<style lang="less">
.layer-hover {
  outline: 0 !important;
}
</style>
