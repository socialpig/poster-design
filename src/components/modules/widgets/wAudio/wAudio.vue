<template>
  <div
    v-if="params.isSet"
    :id="params.uuid"
    ref="widgetRef"
    :class="['w-audio', { 'layer-lock': params.lock, 'animate': params.play, 'stop': !params.play }]"
    :style="{
      position: 'fixed',
      right: params.right + 'px',
      top: params.top + 'px',
      width: params.width + 'px',
      height: params.height + 'px',
      opacity: params.opacity,
      color: params.color,
      zIndex: 1,
    }"
  >
    <svg v-if="params.isSet" @click="toggleAudio(true)" t="1718808824604" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="23294" :width="params.width" :height="params.height"><path d="M512 117.333333c217.962667 0 394.666667 176.704 394.666667 394.666667S729.962667 906.666667 512 906.666667 117.333333 729.962667 117.333333 512 294.037333 117.333333 512 117.333333z m0 64C329.386667 181.333333 181.333333 329.386667 181.333333 512c0 182.613333 148.053333 330.666667 330.666667 330.666667 182.613333 0 330.666667-148.053333 330.666667-330.666667 0-133.098667-78.634667-247.829333-192-300.266667v307.370667A138.965333 138.965333 0 0 1 512 650.666667a138.666667 138.666667 0 1 1 74.688-255.509334V189.802667A331.690667 331.690667 0 0 0 512 181.333333z m0 256a74.666667 74.666667 0 1 0 0 149.333334 74.666667 74.666667 0 0 0 0-149.333334z" :fill="params.color" p-id="23295"></path></svg> 
  </div>
</template>

<script lang="ts" setup>
// 图片组件
// const NAME = 'w-audio'
import { computed, onBeforeUnmount, onMounted, onUpdated, reactive, ref, watch } from 'vue'

import { getMatrix } from '@/common/methods/handleTransform'
import {wAudioSetting} from "./wAudioSetting"
import { storeToRefs } from 'pinia'
import { useWidgetStore } from '@/store'

type TProps = {
  params: typeof setting
}
type TState = {
  position: 'absolute' | 'relative', // 'absolute'relative
}
const props = defineProps<TProps>()
const state = reactive<TState>({
  position: 'absolute', // 'absolute'relative
})

const widgetStore = useWidgetStore()

const {dActiveElement, dWidgets} = storeToRefs(widgetStore)
let isTrigger = ref(false); // 是否剛點擊完，是的話不要監聽控制事件

// 监听播放设置
watch(
  () => props.params.play,
  (newValue, oldValue) => {
    if(!isTrigger.value){
      toggleAudio(false)
      isTrigger.value = false;
    }
  },
  { deep: true }
)

// 监听播放音樂
watch(
  () => props.params.src,
  (newValue, oldValue) => {
    sound1.stop();
    autoAudio()
    toggleAudio(false)
  },
  { deep: true }
)
// 监听是否設置音樂
watch(
  () => props.params.isSet,
  (newValue, oldValue) => {
    if(!newValue){
      sound1.stop();
    } else{
      autoAudio()
      toggleAudio(false)
    }
  },
  { deep: true }
)
// const audioPlayer = ref(null);
let sound1 = reactive(null);
// 自動播放
function autoAudio(){
 sound1 = new Howl({
  src: [props.params.src],
  loop: true,
  preload: true
 })
 // 音频资源 load 之后通过微信桥接触发播放
//  sound1.on('load', () => {
//    window.WeixinJSBridge && window.WeixinJSBridge.invoke('getNetworkType', {}, () => {
//      sound1.play()
//    }, false)
//  })
}
onMounted(() => {
  autoAudio();
  toggleAudio(false)
})
onBeforeUnmount(() => {
  sound1.stop();
})
async function toggleAudio(trigger) {
  isTrigger.value = trigger; // 是否點擊了音樂圖標
  if(trigger){
    props.params.play = !props.params.play;
  }
  console.log('props.params.play', props.params.play);
  if(props.params.play){
    sound1.play()
  } else {
    sound1.pause();
  }
}

</script>

<style lang="less" scoped>
// .w-audio {
//   // cursor: pointer;
//   // outline: none;
// }
.mask {
  -webkit-mask-size: 100% 100%;
  -webkit-mask-position: center;
}

.img__box {
  width: 100%;
  height: 100%;
  overflow: hidden;
  img {
    display: block;
  }
}
.target {
  display: block;
  width: 100%;
  height: 100%;
}
.svg__edit__wrap {
  width: 100%;
  height: 100%;
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
}
.edit__model {
  opacity: 0.2;
  width: 100%;
  height: 100%;
  // object-fit: contain;
}
.drop {
  &__mask {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &__btn {
    color: #ffffff;
    background: rgba(0, 0, 0, 0.5);
    border: 2px dashed #ffffff;
    border-radius: 12px;
    padding: 2rem;
  }
}

.slider__bar {
  position: absolute;
  z-index: 999;
  right: 0;
  top: -80px;
  transform: scale(1.5);
}
.animate{
  animation: rotateRecord 5s linear infinite;
}
@keyframes rotateRecord {
  from {
    transform:  rotateZ(0deg);
  }
  to {
    transform: rotateZ(360deg);
  }
}
.stop::before{
    content: '';
    position: absolute;
    right: 35px;
    top: 35px;
    height: 50px;
    width: 70px;
    border-top: 6px solid;
    transform: rotate(60deg);
  }
</style>
