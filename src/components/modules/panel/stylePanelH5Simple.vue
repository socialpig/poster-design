<template>
  <div v-if="dActiveElement && dActiveElement.type !== 'page'" class="bottomControl">
    <!-- 控制组件区 -->
    <div class="section area">
      <style-panel-simple-area />
    </div>
    <!-- 取消选择 -->
    <div class="section" @click="cancel">
      <el-icon><CloseBold /></el-icon>
      <span class="text">取消</span>
    </div>
    <!-- 样式 -->
    <div class="section" @click="setting">
      <el-icon><Operation /></el-icon>
      <span class="text">样式</span>
    </div>
    <!-- 删除 -->
    <div class="section" @click="deleteWidget">
      <el-icon><Delete /></el-icon>
      <span class="text">删除</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// 样式设置面板
// const NAME = 'style-panel'
import alignIconList, { AlignListData } from '@/assets/data/AlignListData'
import iconItemSelect, { TIconItemSelectData } from '../settings/iconItemSelect.vue'
import { ref, watch } from 'vue';
// import { useSetupMapGetters } from '@/common/hooks/mapGetters';
import { useControlStore, useGroupStore, useHistoryStore, useWidgetStore, useCanvasStore } from '@/store';
import { storeToRefs } from 'pinia';
import { TdWidgetData } from '@/store/design/widget';
import { ElRow, ElCol, ElInputNumber, ElIcon, ElDrawer } from 'element-plus'
import { Close, CloseBold, Operation, Delete } from '@element-plus/icons';

import type { TUpdateAlignData } from '@/store/design/widget/actions/align'
// 动画组件
import animationEdit from '@/components/business/animation/index.vue'

const widgetStore = useWidgetStore()
const controlStore = useControlStore()
const groupStore = useGroupStore()
const historyStore = useHistoryStore()
const { dPage } = storeToRefs(useCanvasStore())

const iconList = ref<AlignListData[]>(alignIconList)
// const { dActiveElement, dWidgets, dSelectWidgets } = useSetupMapGetters(['dActiveElement', 'dWidgets', 'dSelectWidgets'])
const { dActiveElement, dWidgets, dSelectWidgets } = storeToRefs(widgetStore)

// ...mapActions(['selectWidget', 'updateAlign', 'updateHoverUuid', 'getCombined', 'realCombined', 'ungroup', 'pushHistory']),
function alignAction(item: TIconItemSelectData) {
  const sWidgets: TdWidgetData[] = JSON.parse(JSON.stringify(dSelectWidgets.value))
  groupStore.getCombined().then(group => {
    sWidgets.forEach((element) => {
      widgetStore.updateAlign({
        align: (item.value as TUpdateAlignData['align']),
        uuid: element.uuid,
        group,
      })
    });
  })
}
function layerChange(newLayer: TdWidgetData[]) {
  widgetStore.setDWidgets(newLayer.toReversed())
  controlStore.setShowMoveable(false)
}


// // 打开动画组件
function openAnimationEdit(){
  console.log( dActiveElement, dWidgets, dSelectWidgets, dPage );
  
  // animationEditRef.value?.open()
}
// 取消选中
function cancel(){
  controlStore.setShowMoveable(false) // 清理上一次的选择
  dActiveElement.value = '';
}
// 删除
function deleteWidget(){
  widgetStore.deleteWidget()
}
function setting(){
  dActiveElement.value.showSetting = true;
  
}
</script>

<style lang="less" scoped>
  .bottomControl{
    position: fixed;
    width: 100%;
    display: flex;
    height: 65px;
    background: #fff;
    align-items: center;
    bottom: 0;
    font-size: 13px;
    .area{
      flex: 4.5 !important;
      margin: 15px;
      background: #f3f3f3;
      height: 35px;
      border-radius: 5px;
    }
    .section {
      display: flex;
      align-items: center;
      flex-direction: column;
      justify-content: center;
      flex: 1.2;
      .text{
        padding-top: 4px;
      }
    }
  }
</style>
