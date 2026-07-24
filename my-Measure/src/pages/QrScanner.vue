<template>
  <div class="qr-scanner-page">
    <van-nav-bar
      title="二维码解析"
      left-text="返回"
      left-arrow
      @click-left="$emit('back')"
    />

    <div class="scanner-content">
      <div class="scan-area">
        <video ref="videoRef" class="scan-video" autoplay playsinline muted></video>
        <canvas ref="canvasRef" class="scan-canvas"></canvas>
        <div class="scan-frame">
          <div class="scan-corner top-left"></div>
          <div class="scan-corner top-right"></div>
          <div class="scan-corner bottom-left"></div>
          <div class="scan-corner bottom-right"></div>
          <div class="scan-line"></div>
        </div>
        <div class="scan-hint">将二维码放入框内</div>
      </div>

      <div class="action-buttons">
        <van-button type="default" @click="toggleCamera">
          <van-icon name="switch" />
          切换摄像头
        </van-button>
        <van-button type="primary" @click="triggerImageUpload">
          <van-icon name="image" />
          从相册选择
        </van-button>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden-input"
        @change="handleImageUpload"
      />

      <div v-if="scanResult" class="result-section">
        <van-field
          v-model="scanResult"
          type="textarea"
          label="解析结果"
          :rows="4"
          readonly
          placeholder="解析结果将显示在这里"
          right-icon="copy"
          @click-right-icon="copyResult"
        />
        <van-button type="success" block @click="copyResult">
          <van-icon name="copy" />
          一键复制
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { showToast } from 'vant';
import jsQR from 'jsqr';

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const scanResult = ref('');

let stream: MediaStream | null = null;
let animationId: number | null = null;
let facingMode: 'user' | 'environment' = 'environment';

const startCamera = async () => {
  try {
    // 先停止当前的摄像头流
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    if (!videoRef.value) return;

    // 绑定视频源
    videoRef.value.srcObject = stream;
    // 🔥 关键点1：等待视频开始播放（异步等待）
    await videoRef.value.play();

    // 🔥 关键点2：等待视频尺寸非0（有时候 play() 之后还需短暂等待）
    // await waitForVideoReady(videoRef.value);

    // 现在视频已经准备好，启动扫描循环
    startScanLoop();
      // videoRef.value.play();
      // startScanLoop();
    
  } catch (error) {
    showToast('无法访问摄像头，请检查权限');
    console.error('Camera error:', error);
  }
};

const startScanLoop = () => {
  const scan = () => {
    if (!videoRef.value || !canvasRef.value || !stream) return;

    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.value.videoWidth;
    canvas.height = videoRef.value.videoHeight;

    ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code) {
      scanResult.value = code.data;
      showToast('解析成功');
      stopCamera();
      return;
    }

    animationId = requestAnimationFrame(scan);
  };

  scan();
};

const stopCamera = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
};

const toggleCamera = () => {
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  startCamera();
};

const triggerImageUpload = () => {
  fileInput.value?.click();
};

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        scanResult.value = code.data;
        showToast('解析成功');
      } else {
        showToast('未识别到二维码');
      }
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
  input.value = '';
};

const copyResult = async () => {
  if (!scanResult.value) return;
  try {
    await navigator.clipboard.writeText(scanResult.value);
    showToast('复制成功');
  } catch {
    showToast('复制失败');
  }
};

onMounted(() => {
  startCamera();
});

onUnmounted(() => {
  stopCamera();
});
</script>

<style scoped>
.qr-scanner-page {
  min-height: 100vh;
  background-color: #f5f6f7;
}

.scanner-content {
  padding: 16px;
}

.scan-area {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background-color: #000;
  border-radius: 16px;
  overflow: hidden;
}

.scan-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-canvas {
  display: none;
}

.scan-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250px;
  height: 250px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
}

.scan-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #4a6cf7;
  border-style: solid;
}

.scan-corner.top-left {
  top: -2px;
  left: -2px;
  border-width: 3px 0 0 3px;
}

.scan-corner.top-right {
  top: -2px;
  right: -2px;
  border-width: 3px 3px 0 0;
}

.scan-corner.bottom-left {
  bottom: -2px;
  left: -2px;
  border-width: 0 0 3px 3px;
}

.scan-corner.bottom-right {
  bottom: -2px;
  right: -2px;
  border-width: 0 3px 3px 0;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(to right, transparent, #4a6cf7, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.scan-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.action-buttons .van-button {
  flex: 1;
}

.hidden-input {
  display: none;
}

.result-section {
  margin-top: 24px;
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.result-section .van-field {
  margin-bottom: 12px;
}

:deep(.van-nav-bar) {
  background-color: #fff;
}

:deep(.van-button--primary) {
  background-color: #4a6cf7;
  border-color: #4a6cf7;
}

:deep(.van-button--success) {
  background-color: #52c41a;
  border-color: #52c41a;
}
</style>
