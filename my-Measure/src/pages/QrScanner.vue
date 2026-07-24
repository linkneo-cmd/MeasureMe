<template>
  <div class="qr-scanner-page">
    <van-nav-bar
      title="二维码解析"
      left-text="返回"
      left-arrow
      @click-left="goBack"
    />

    <div class="scanner-content">
      <div v-if="!scanResult" class="scan-area">
        <video v-if="isWeb" ref="videoRef" class="scan-video" autoplay playsinline muted></video>
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
        <van-button v-if="isWeb && !scanResult" type="default" @click="toggleCamera">
          <van-icon name="switch" />
          切换摄像头
        </van-button>
        <van-button type="primary" @click="scanQrCode">
          <van-icon name="camera" />
          {{ isWeb ? '扫描二维码' : '拍照解析' }}
        </van-button>
        <van-button type="default" @click="triggerImageUpload">
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { showToast } from 'vant';
import jsQR from 'jsqr';
import { useRouter } from 'vue-router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const router = useRouter();
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const scanResult = ref('');

let stream: MediaStream | null = null;
let animationId: number | null = null;
let facingMode: 'user' | 'environment' = 'environment';

const isWeb = computed(() => {
  if (typeof window !== 'undefined') {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return !userAgent.includes('capacitor') && !userAgent.includes('cordova');
  }
  return true;
});

const goBack = () => {
  router.back();
};

const startCamera = async () => {
  if (!isWeb.value) return;
  
  try {
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

    videoRef.value.srcObject = stream;
    await videoRef.value.play();
    startScanLoop();
    
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

const scanQrCode = async () => {
  if (scanResult.value) {
    scanResult.value = '';
    if (isWeb.value) {
      startCamera();
    }
    return;
  }

  if (isWeb.value) {
    if (!stream) {
      startCamera();
    } else {
      captureFrame();
    }
    return;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    });

    if (image.base64String) {
      const base64Data = `data:image/jpeg;base64,${image.base64String}`;
      await parseQrCodeFromImage(base64Data);
    }
  } catch (error) {
    console.error('Camera error:', error);
    showToast('拍照失败或已取消');
  }
};

const captureFrame = () => {
  if (!videoRef.value || !canvasRef.value) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = videoRef.value.videoWidth;
  canvas.height = videoRef.value.videoHeight;

  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);

  if (code) {
    scanResult.value = code.data;
    showToast('解析成功');
    stopCamera();
  } else {
    showToast('未识别到二维码');
  }
};

const triggerImageUpload = () => {
  if (isWeb.value) {
    fileInput.value?.click();
    return;
  }

  Camera.getPhoto({
    quality: 100,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Photos
  }).then(async (image) => {
    if (image.base64String) {
      const base64Data = `data:image/jpeg;base64,${image.base64String}`;
      await parseQrCodeFromImage(base64Data);
    }
  }).catch((error) => {
    console.error('Gallery error:', error);
    showToast('选择图片失败');
  });
};

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    await parseQrCodeFromImage(e.target?.result as string);
  };
  reader.readAsDataURL(file);
  input.value = '';
};

const parseQrCodeFromImage = async (imageUrl: string) => {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        showToast('图片处理失败');
        resolve();
        return;
      }

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
      resolve();
    };
    img.onerror = () => {
      showToast('图片加载失败');
      resolve();
    };
    img.src = imageUrl;
  });
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
  if (isWeb.value) {
    startCamera();
  }
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