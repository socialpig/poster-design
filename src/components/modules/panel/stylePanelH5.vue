<template>
   <el-drawer
    v-model="isShowStylePanel"
    title="设置"
    direction="btt"
    @close="handleClose"
    size="90%"
  >
  <!-- <div id="style-panel-h5" v-if="isShowStylePanel"> -->
    <!-- <div class="style-tab">
      <span :class="['tab', { 'active-tab': activeTab === 0 }]" @click="activeTab = 0">设置</span>
      <span :class="['tab', { 'active-tab': activeTab === 1 }]" @click="activeTab = 1">图层</span>
    </div> -->
    <!-- <div v-show="activeTab === 0" class="style-wrap"> -->
      <!-- <el-icon @click="isShowStylePanel = false" class="closeIcon"><Close /></el-icon> -->
      <div v-if="!showGroupCombined && dActiveElement?.type !== 'page'">
        <el-collapse>
          <el-collapse-item title="设置动画" name="0" @click="openAnimationEdit">
            <animationEdit :params="dActiveElement">
                <div>test slot</div>
            </animationEdit>
          </el-collapse-item>
      </el-collapse>
      </div>
      <div v-if="!showGroupCombined && dActiveElement?.type === 'page'">
        <el-divider content-position="center">全局配置</el-divider>
        <el-row class="row-bg" justify="space-between" align="middle">
          <el-col :span="10">自动滚动</el-col>
          <el-col :span="10" style="display: flex;justify-content: end;"><el-switch v-model="dPage.autoScroll" /></el-col>
        </el-row>
        <el-row class="row-bg" justify="space-between" align="middle">
          <el-col :span="10">滚动速度</el-col>
          <el-col :span="10" class="scrollSpeed"><el-input-number size="small" v-model="dPage.scrollSpeed" :min="0" :max="999999" /><span style="padding-left: 5px;">ms</span></el-col>
        </el-row>
        <el-row class="row-bg" justify="space-between" align="middle">
          <el-col :span="10">停后继续滚动</el-col>
          <el-col :span="10" class="scrolldelay"><el-input-number size="small" v-model="dPage.scrolldelay" :min="0" :max="999999" /><span style="padding-left: 5px;">ms</span></el-col>
        </el-row>
        <el-divider />
      </div>
      <div v-show="showGroupCombined" style="padding: 2rem 0">
        <el-button plain type="primary" class="gounp__btn" @click="handleCombine">成组</el-button>
        <icon-item-select label="" :data="iconList" @finish="alignAction" />
      </div>
      <component :is="dActiveElement?.type + '-style'" v-show="!showGroupCombined" v-if="dActiveElement?.type" />
    <!-- </div>
    <div v-show="activeTab === 1" class="layer-wrap">
      <layer-list :data="dWidgets" @change="layerChange" />
    </div> -->
  <!-- </div> -->
</el-drawer>
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
import { Close } from '@element-plus/icons';

import type { TUpdateAlignData } from '@/store/design/widget/actions/align'
// 动画组件
import animationEdit from '@/components/business/animation/index.vue'

const widgetStore = useWidgetStore()
const controlStore = useControlStore()
const groupStore = useGroupStore()
const historyStore = useHistoryStore()
const { dPage } = storeToRefs(useCanvasStore())

const activeTab = ref(0)
const iconList = ref<AlignListData[]>(alignIconList)
const showGroupCombined = ref(false)
let isShowStylePanel = ref(false)
// const { dActiveElement, dWidgets, dSelectWidgets } = useSetupMapGetters(['dActiveElement', 'dWidgets', 'dSelectWidgets'])
const { dActiveElement, dWidgets, dSelectWidgets } = storeToRefs(widgetStore)
watch(
  dActiveElement,
  (items) => {
    if(items && items.showSetting){
      isShowStylePanel.value = true;
      setTimeout(() => {
        showGroupCombined.value = items.length > 1
      }, 100)
    }
  },
  {
    deep: true
  }
)

function handleCombine() {
  groupStore.realCombined()
  // store.dispatch('realCombined')
}

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
function handleClose(){
  dActiveElement.value.showSetting = false;
  isShowStylePanel.value = false;
}
</script>

<style lang="less" scoped>
@color0: #ffffff;
@color1: #999999;
@background-color-transparent: rgba(0,0,0,.08);

#style-panel-h5 ::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}
#style-panel-h5 {
  background-color: @color0;
  border-left: 1px solid @background-color-transparent;
  display: flex;
  flex-direction: column;
  height: auto;
  position: fixed;
  width: 100%;
  bottom: 0;
  border-radius: 25px;
  .style-tab {
    box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: row;
    text-align: center;
    width: 100%;
    z-index: 10;
    .tab {
      user-select: none;
      background-color: @color0;
      font-size: 14px;
      color: @color1;
      cursor: pointer;
      flex: 1;
      padding: 14px 10px;
    }
    .tab.active-tab {
      // background-color: #3e4651;
      font-size: 15px;
      color: #444444;
      font-weight: 600;
    }
  }
  .style-wrap {
    flex: 1;
    overflow: auto;
    width: 100%;
    padding: 0px 20px;
  }
  .layer-wrap {
    flex: 1;
    overflow: auto;
    width: 100%;
  }
}

.gounp {
  &__btn {
    width: 100%;
    margin-bottom: 2.7rem;
  }
}
.row-bg{
  font-size: 13px;
  margin-bottom: 10px;
}
.scrollSpeed,.scrolldelay{
  display: flex;
  align-items: center;
}
.closeIcon {
  height: 25px;
  float: right;
  margin-top: 15px;
  font-size: 20px;
}
</style>
