<template>
  <div class="app-container" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
    <router-view @openDrawer="showDrawer = true" />
    
    <van-popup
      v-model:show="showDrawer"
      position="left"
      :style="{ width: '75%', height: '100%' }"
      round
    >
      <div class="drawer-content">
        <div class="drawer-header">
          <h2>功能菜单</h2>
        </div>
        <van-cell-group inset class="drawer-menu">
          <van-cell title="尺寸记录" icon="records-o" @click="goHome" />
          <van-cell title="二维码解析" icon="qr" @click="goToQrScanner" />
        </van-cell-group>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showDrawer = ref(false);

const startX = ref(0);
const startY = ref(0);
const isTouching = ref(false);
const SWIPE_THRESHOLD = 80;
const EDGE_THRESHOLD = 50;

const handleTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0];
  startX.value = touch.clientX;
  startY.value = touch.clientY;
  isTouching.value = true;
};

const handleTouchMove = () => {
};

const handleTouchEnd = (e: TouchEvent) => {
  if (!isTouching.value) return;
  isTouching.value = false;
  
  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - startX.value;
  const deltaY = touch.clientY - startY.value;
  
  if (startX.value <= EDGE_THRESHOLD && deltaX > SWIPE_THRESHOLD && Math.abs(deltaY) < Math.abs(deltaX)) {
    showDrawer.value = true;
  }
};

const goHome = () => {
  showDrawer.value = false;
  router.push('/');
};

const goToQrScanner = () => {
  showDrawer.value = false;
  router.push('/qr-scanner');
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f6f7;
}

.drawer-content {
  height: 100%;
  background-color: #fff;
}

.drawer-header {
  background-color: #4a6cf7;
  padding: 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.drawer-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.drawer-menu {
  margin-top: 16px;
}

:deep(.drawer-content .van-cell:after) {
  border-bottom: 0.5px solid;
}
</style>