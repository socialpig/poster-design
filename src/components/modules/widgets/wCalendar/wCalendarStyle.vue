<template>
  <div id="w-calendar-style">
    <el-collapse v-model="state.activeNames">
      <el-collapse-item title="位置尺寸" name="1">
        <div class="line-layout" style="flex-wrap: wrap">
          <number-input v-model="state.innerElement.left" label="X" @finish="(value) => finish('left', value)" />
          <number-input v-model="state.innerElement.top" label="Y" @finish="(value) => finish('top', value)" />
          <number-input v-model="state.innerElement.width" style="margin-top: 0.5rem" label="宽" :editable="true" @finish="(value) => finish('width', value)" />
          <number-input v-model="state.innerElement.height" style="margin-top: 0.5rem" label="高" :editable="true" @finish="(value) => finish('height', value)" />
        </div>
      </el-collapse-item>
      <br />
      <div class="line-layout style-item">
        <div>日期</div>
        <el-date-picker
          v-model="state.innerElement.value"
          type="date"
          placeholder="请选择日期"
          size="default"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </div>
      <div>
        <div class="line-layout style-item">
          <div>背景</div>
          <color-select v-model="state.innerElement.bgColor" width="220px" label="" @finish="(value) => finish(`bgColor`, value)" />
        </div>
      </div>
      <div class="line-layout style-item">
        <div>图标</div>
        <color-select v-model="state.innerElement.iconColor" width="30px" label="" @finish="(value) => finish(`${key}.color`, value)" />
        <el-select v-model="state.innerElement.icon" placeholder="Select" style="width: 130px">
          <el-option
            v-for="item in state.iconOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <value-select v-model="state.innerElement.iconSize" label="" suffix="px" :data="state.fontSizeList" inputWidth="60px"  @finish="(value) => finish(`iconSize`, value)" />
      </div>
      <div v-for="key in ['week', 'date', 'lunarDate']">
        <div class="line-layout style-item">
          <div>{{key === 'week' ? '星期' : key === 'date' ? '日期' : '农历'}}</div>
          <color-select v-model="state.innerElement[key].color" width="30px" label="" @finish="(value) => finish(`${key}.color`, value)" />
          <value-select v-model="state.innerElement[key].fontClass.value" label="" :data="state.fontClassList" inputWidth="130px" :readonly="true" @finish="(font) => finish(`${key}.fontClass`, font)" />
          <value-select v-model="state.innerElement[key].fontSize" label="" suffix="px" :data="state.fontSizeList" inputWidth="60px"  @finish="(value) => finish(`${key}.fontSize`, value)" />
        </div>
      </div>
      <div>
        <div class="line-layout style-item">
          <div>边框</div>
          <color-select v-model="state.innerElement.border.color" width="30px" label="" @finish="(value) => finish(`border.color`, value)" />
          <number-input v-model="state.innerElement.border.size" label="" style="width:70px;margin-right: 0px;" :editable="true" @finish="(value) => finish('border.size', value)" />
          <value-select v-model="state.innerElement.border.style" label="" inputWidth="50px" :data="state.borderStyleList" @finish="(value) => finish('border.style', value)" />
          <number-input v-model="state.innerElement.border.radius" label=""  style="width: 60px;margin-right: 0px;" :editable="true" @finish="(value) => finish('border.radius', value)" />
        </div>
      </div>
    </el-collapse>
  </div>
</template>

<script lang="ts" setup>
// 文本组件样式
const NAME = 'w-calendar-style'
import { defineComponent, reactive, toRefs, computed, watch, nextTick, onMounted } from 'vue'
import { ElDatePicker, ElSelect, ElOption  } from 'element-plus'
import { useRoute } from 'vue-router'
import { styleIconList1, styleIconList2, alignIconList, TStyleIconData, TStyleIconData2 } from '@/assets/data/TextIconsData'
import layerIconList from '@/assets/data/LayerIconList'
import numberInput from '../../settings/numberInput.vue'
import numberSlider from '../../settings/numberSlider.vue'
import colorSelect from '../../settings/colorSelect.vue'
import iconItemSelect, { TIconItemSelectData } from '../../settings/iconItemSelect.vue'
import textInputArea from '../../settings/textInputArea.vue'
import valueSelect from '../../settings/valueSelect.vue'
import effectWrap from '../../settings/EffectSelect/TextWrap.vue'
import { useFontStore } from '@/common/methods/fonts'
import usePageFontsFilter from './pageFontsFilter'
import { wCalendarSetting ,TwTextData } from './wCalendarSetting';
import { storeToRefs } from 'pinia';
import { useControlStore, useForceStore, useWidgetStore } from '@/store';
import { TUpdateWidgetPayload } from '@/store/design/widget/actions/widget';
import { TUpdateAlignData } from '@/store/design/widget/actions/align';

type TState = {
  activeNames: string[],
  innerElement: TwTextData,
  tag: boolean,
  ingoreKeys: string[],
  fontSizeList: number[],
  fontClassList: Record<string, any>, // 不能设空字体系统默认字体，因为截图服务的默认字体无法保证一致
  lineHeightList: number[],
  letterSpacingList: number[],
  layerIconList: TIconItemSelectData[],
  styleIconList1: TStyleIconData[],
  styleIconList2: TStyleIconData2[],
  alignIconList: TIconItemSelectData[],
}

const widgetStore = useWidgetStore()
const forceStore = useForceStore()
const route = useRoute()
const state = reactive<TState>({
  activeNames: [],
  innerElement: JSON.parse(JSON.stringify(wCalendarSetting)),
  tag: false,
  ingoreKeys: ['left', 'top', 'name', 'width', 'height', 'text', 'color', 'backgroundColor'],
  fontSizeList: [12, 14, 24, 26, 28, 30, 36, 48, 60, 72, 96, 108, 120, 140, 180, 200, 250, 300, 400, 500],
  iconOptions:[{label: '爱心', value: 'love'},{label: '对勾', value: 'right'},{label: '双喜', value: 'double'}],
  borderStyleList: ['solid', 'dotted', 'dashed', 'outset'],
  fontClassList: {}, // 不能设空字体系统默认字体，因为截图服务的默认字体无法保证一致
  lineHeightList: [1, 1.5, 2],
  letterSpacingList: [0, 10, 25, 50, 75, 100, 200],
  layerIconList,
  styleIconList1,
  styleIconList2,
  alignIconList,
})
// const dActiveElement = computed(() => widgetStore.dActiveElement)
// const dMoving = computed(() => store.getters.dMoving)
const { dMoving } = storeToRefs(useControlStore())

// const isDraw = computed(() => route.name === 'Draw')

watch(() => dActiveElement.value, () => {
  change()
}, { deep: true })

watch(() => state.innerElement, () => {
  changeValue()
}, { deep: true })

let timer: boolean | null = null

onMounted(() => {
  change()
  setTimeout(() => {
    loadFonts()
  }, 100)
})

function change() {
  if (timer) {
    return
  }
  timer = true
  setTimeout(() => {
    timer = null
  }, 300)
  state.tag = true
  state.innerElement = JSON.parse(JSON.stringify(dActiveElement.value))
  changeStyleIconList()
}

function changeValue() {
  console.log(1111);
  
  if (state.tag) {
    state.tag = false
    return
  }
  if (dMoving.value) {
    return
  }
  console.log('dActiveElement-rili', dActiveElement);
  // TODO 修改数值
  for (let key in state.innerElement) {
    const itemKey = key as keyof TwTextData
    if (state.ingoreKeys.indexOf(itemKey) !== -1) {
      (dActiveElement.value as Record<string, any>)[itemKey] = state.innerElement[itemKey]
    } else if (
      key !== 'setting' && key !== 'record' &&
      state.innerElement[itemKey] !== (dActiveElement.value as Record<string, any>)[itemKey]
    ) {
      // const pushHistory = !['textEffects', 'transformData', 'fontClass'].includes(key)
      widgetStore.updateWidgetData({
        uuid: dActiveElement.value?.uuid || '',
        key: key as TUpdateWidgetPayload['key'],
        value: state.innerElement[itemKey],
        pushHistory: false,
      })
      // store.dispatch('updateWidgetData', {
      //   uuid: dActiveElement.value.uuid,
      //   key,
      //   value: state.innerElement[itemKey],
      //   pushHistory: false,
      // })
    }
  }
}

function selectTextEffect({ key, value, style }: any) {
  const uuid = dActiveElement.value?.uuid || ''
  widgetStore.setWidgetStyle({ uuid, key, value })
  // store.commit('setWidgetStyle', { uuid, key, value })
  if (style) {
    finish('color', style.color || '')
  }
}

function loadFonts() {
  const localFonts = useFontStore.list
  const fontLists: Record<string, any> = { 当前页面: [], 中文: [], 英文: [] }
  for (const font of localFonts) {
    const { id, oid, value, url, alias, preview, lang } = font
    const item = { id, oid, value, url, alias, preview }
    lang === 'zh' ? fontLists['中文'].unshift(item) : fontLists['英文'].unshift(item)
  }
  // fontLists['中文'].unshift({alias: '微软雅黑', id: -1, value: '', url: '', preview: '微软雅黑'})
  // fontLists['英文'].unshift({alias: 'normal', id: -1, value: '', url: '',preview: 'normal'})
  fontLists['当前页面'] = usePageFontsFilter()
  console.log(fontLists);
  
  state.fontClassList = fontLists
}

function finish(key: string, value: number | Record<string, any> | string) {
  console.log(key);
  console.log(value);
  
  widgetStore.updateWidgetData({
    uuid: dActiveElement.value?.uuid || '',
    key: key as TUpdateWidgetPayload['key'],
    value,
    pushHistory: false,
  })
  console.log(widgetStore);
  
  console.log(state.fontClassList['当前页面']);
  setTimeout(() => {
    key === 'fontClass' && (state.fontClassList['当前页面'] = usePageFontsFilter())
  }, 300)
}

function layerAction(item: TIconItemSelectData) {
  widgetStore.updateLayerIndex({
    uuid: dActiveElement.value?.uuid || '',
    value: Number(item.value),
  })
  // store.dispatch('updateLayerIndex', {
  //   uuid: dActiveElement.value.uuid,
  //   value: item.value,
  // })
}

async function textStyleAction(item: TIconItemSelectData) {
  let value = item.key === 'textAlign' ? item.value : (item.value as number[])[item.select ? 1 : 0];
  (state.innerElement as Record<string, any>)[item.key || ""] = value
  // TODO: 对竖版文字的特殊处理
  item.key === 'writingMode' && relationChange()
  await nextTick()
  forceStore.setUpdateRect()
  // store.commit('updateRect')
}

async function alignAction(item: TIconItemSelectData) {
  widgetStore.updateAlign({
    align: item.value as TUpdateAlignData['align'],
    uuid: dActiveElement.value?.uuid || '',
  })
  // store.dispatch('updateAlign', {
  //   align: item.value,
  //   uuid: dActiveElement.value.uuid,
  // })
  await nextTick()
  forceStore.setUpdateRect()
  // store.commit('updateRect')
}

function changeStyleIconList() {
  for (let i = 0; i < state.styleIconList1.length; ++i) {
    let key = state.styleIconList1[i].key
    state.styleIconList1[i].select = false
    const [unchecked, checked] = state.styleIconList1[i].value
    switch (key) {
      case 'fontWeight':
      case 'textDecoration':
      case 'fontStyle':
        if (state.innerElement[key] !== unchecked && state.innerElement[key] == checked) {
          state.styleIconList1[i].select = !state.styleIconList1[i].select
        }
        break
      case 'writingMode':
        if (state.innerElement[key] !== unchecked) {
          state.styleIconList1[i].select = true
        }
        break
    }
  }
  for (let i = 0; i < state.styleIconList2.length; i++) {
    let key = state.styleIconList2[i].key
    state.styleIconList2[i].select = false
    if (key === 'textAlign' && state.innerElement[key] === state.styleIconList2[i].value) {
      state.styleIconList2[i].select = true
      continue
    }
  }
}

function relationChange() {
  setTimeout(() => {
    if (dActiveElement.value && dActiveElement.value.writingMode) {
      const w_record = dActiveElement.value.width
      state.innerElement.width = dActiveElement.value.height
      state.innerElement.height = w_record
    }
  }, 10)
}

defineExpose({
  selectTextEffect,
  textStyleAction,
  finish,
  layerAction,
  alignAction
})
</script>

<style lang="less" scoped>
#w-calendar-style {
  height: 100%;
  width: 100%;
  &:deep .color__select{
    // width: auto !important;
  }
}
.line-layout {
  display: flex;
  flex-direction: row;
  // flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
  align-items: center;
  
  &:deep .color__select .input-label{
    line-height: 20px;
    padding: 13px 0 17px 0;
  }
}
.style-item {
  margin-bottom: 12px;
}
.setting-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
}

.slide-wrap {
  width: 100%;
  padding: 16px;
  background: #f3f5f7;
  border-radius: 6px;
}
</style>
