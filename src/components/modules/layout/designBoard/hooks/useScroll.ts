import { log } from 'console';
import {ref, reactive, Ref, onMounted} from 'vue'
// import { useCanvasStore } from '@/store'
// import { storeToRefs } from 'pinia'

// const { dPage } = storeToRefs(useCanvasStore())
export default function ( dPage, dLayouts) {
  console.log('dPage---', dPage.value.autoScroll);
  
  let page_index: Ref<Number> = ref(0)
  let mouseDownY: Ref<Number> = ref(0)
  let mouseUpY: Ref<Number> = ref(0)
  const scrollTarget = 30; // 判断滚动的高度
  let autoScroll: Ref<Boolean> = ref(dPage.value.autoScroll); // 是否自动滚动  -- TODO
  const autoSpeed = ref(3000); // 自动滚动速度ms  -- TODO
  let autoTurnPage = null; //自动滚动定时器
  let page_type = ref('');
  let timeout = reactive('');
  let isDragging = ref(false);
  let scrollContainer = ref('');
  let delayTimeout = null; // 停止后再次自动滚动的定时器

  // 挂载后，如果为自动滚动时，进行自动滚动
  onMounted(() => {
    console.log(autoScroll.value)
    setTimeout(() => {
      console.log(dPage.value);
      
      autoScroll.value = dPage.value.autoScroll; //是否设置自动滚动 
      autoSpeed.value = dPage.value.scrollSpeed; // 自动滚动时长
      console.log(autoScroll.value);
      if(autoScroll.value){
        setTimeout(() => {
          console.log('正在执行---onMounted');
          console.log('dPage---', dPage.value.autoScroll);
          page_type.value = dPage.value.page_type
          console.log('page_type---', page_type.value);
          scrollContainer = document.getElementById('out-page')
          // 长页自动滚动
          if(page_type.value === 'longPage'){
            console.log(page_type.value)
            fnAutoScroll();
          } else {
            fnAutoTurnPage()
          }
        }, 1e3);
      }
    }, 1e3);
  })

  // 自动滚动到底部
  function fnAutoScroll() {
    if(isDragging.value) {
      clearInterval(timeout)
      clearTimeout(delayTimeout); // 清空计时器
    } else {
      const element = scrollContainer;
      timeout = setInterval(function() { 
        element.scrollTop += 1; // 每次滚动1px
        if(element.scrollTop === element.scrollHeight - element.clientHeight) {
          element.scrollTop = 0; // 如果滚动到底部，则重新开始
        }
      }, dPage.value.scrollSpeed || 1000); // 递归调用，默认每10毫秒滚动一次，数字越大越慢，越小越快
    }
  }
  
  // 自动翻页
  function fnAutoTurnPage(){
    autoTurnPage = setInterval(() => {
      if(page_index.value >= dLayouts.value.length - 1){
        clearInterval(autoTurnPage);
        return;
      }
      page_index.value += 1;
    }, autoSpeed.value)
  }


  // 监听鼠标滑动事件
  function mousedown({x, y}){
    console.log('mousedown');
    if(page_type.value === 'longPage'){
      isDragging.value = true;
      fnAutoScroll();
    }
  }
  // 监听鼠标滑动事件
  function mousemove(e){
    console.log('mousemove');
    if (isDragging.value && page_type.value === 'longPage') {
      // 拖动时滚动div
      scrollContainer.scrollTop -= e.movementY * 2;
      // 阻止默认的滚动行为
      e.preventDefault();
    }
  }

  // 监听鼠标滑动事件
  function mouseup({x, y}){
    console.log('mouseup');
    if(page_type.value === 'longPage'){
      isDragging.value = false;
      // 鼠标停止后，再次启动的时间
      if(dPage.value.scrolldelay){
        delayTimeout = setTimeout(() => {
          console.log('正在执行---delayTimeout');
          fnAutoScroll();
        }, dPage.value.scrolldelay || 1e3);
      }
    }
  }

  
  // 监听手机端滑动-开始事件
  function touchstart(e){
    // 点击时，关闭自动滚动
    console.log('touchStart');
    if(page_type.value === 'longPage'){
      isDragging.value = true; // 长页的手动触摸判断
      fnAutoScroll();
    }
    clearInterval(autoTurnPage);
    mouseDownY.value = e.changedTouches[0].pageY; // 获取触摸之前的y值
  }
  
  // 监听手机端滑动-结束事件
  function touchend(e){
    console.log('touchend');
    
    if(page_type.value === 'longPage'){
      isDragging.value = false;
      // 鼠标停止后，再次启动的时间
      if(dPage.value.scrolldelay){
        delayTimeout = setTimeout(() => {
          console.log('正在执行---delayTimeout');
          fnAutoScroll(scrollContainer);
        }, dPage.value.scrolldelay || 1e3);
      }
    }
    mouseUpY.value = e.changedTouches[0].pageY; // 获取触摸之后的y值
    // 切换到上一页（向下滑）
    if(mouseUpY.value - mouseDownY.value >= scrollTarget){
      console.log('向下滑');
      if(page_index.value <= 0) return 
      page_index.value = page_index.value - 1;
    }
    // 切换到下一页（向上滑）
    if(mouseDownY.value - mouseUpY.value >= scrollTarget){
      console.log('向上滑');
      if(page_index.value >= dLayouts.value.length - 1) return 
      page_index.value = page_index.value + 1;
    }
  }

  return {autoScroll, page_index, page_type, fnAutoScroll, fnAutoTurnPage, mousedown, mousemove, mouseup, touchstart, touchend}
}