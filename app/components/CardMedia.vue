<template>
  <div class="card-media-container" :class="{ 'absolute-fill': absoluteFill }">
    <!-- 优先显示视频 -->
    <video
      v-if="showVideo"
      :key="`video-${cardId}`"
      ref="videoElement"
      class="card-media"
      :class="mediaClass"
      :poster="imageUrl"
      autoplay
      loop
      muted
      playsinline
      preload="auto"
      @error="handleVideoError"
      @loadeddata="handleVideoLoaded"
    >
      <source :src="videoUrl" type="video/mp4" />
    </video>

    <!-- 降级到静态图片 -->
    <img
      v-else
      :key="`img-${cardId}`"
      :src="imageUrl"
      :alt="alt"
      class="card-media"
      :class="mediaClass"
      @error="handleImageError"
    />

    <!-- 加载指示器 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

interface Props {
  cardId: number;
  alt?: string;
  mediaClass?: string;
  fallbackImage?: string;
  absoluteFill?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  alt: "",
  mediaClass: "",
  fallbackImage: "/placeholder.png",
  absoluteFill: false,
});

const showVideo = ref(true);
const isLoading = ref(true);
const videoElement = ref<HTMLVideoElement | null>(null);
const hasVideoError = ref(false);

// 计算URL
const videoUrl = computed(() => `/animated/${props.cardId}.mp4`);
const imageUrl = computed(() => `/collections/${props.cardId}.png`);

// 处理视频加载错误
const handleVideoError = () => {
  // 静默处理，不打印日志（因为大多数卡片没有视频是正常的）
  hasVideoError.value = true;
  showVideo.value = false;
  isLoading.value = false;
};

// 处理视频加载成功
const handleVideoLoaded = () => {
  isLoading.value = false;
  // 确保视频播放
  if (videoElement.value) {
    videoElement.value.play().catch(() => {
      // 静默处理自动播放失败
    });
  }
};

// 处理图片加载错误
const handleImageError = () => {
  console.error(`Image not found for card ${props.cardId}`);
  isLoading.value = false;
};

// 监听cardId变化，重置状态
watch(
  () => props.cardId,
  (newId, oldId) => {
    if (newId !== oldId) {
      // 重置状态，允许新卡片尝试加载视频
      hasVideoError.value = false;
      showVideo.value = true;
      isLoading.value = true;
    }
  }
);

// 尝试预检查视频是否存在（可选优化）
onMounted(() => {
  // 尝试播放视频
  if (videoElement.value) {
    videoElement.value.play().catch(() => {
      // 静默处理
    });
  }
});

// 清理
onUnmounted(() => {
  if (videoElement.value) {
    videoElement.value.pause();
  }
});
</script>

<style scoped>
.card-media-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 绝对定位模式，用于图鉴页面 */
.card-media-container.absolute-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.card-media {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 视频特定样式 */
video.card-media {
  background: transparent;
}

/* 收集弹窗中的样式 */
.toast-image {
  width: 50px !important;
  height: 75px !important;
  object-fit: cover;
  flex-shrink: 0;
}

/* 未解锁卡片图片样式 */
.unlocked-card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 图鉴页面样式 - 使用cover填充整个容器 */
.absolute-fill .card-media {
  object-fit: cover;
}

/* 加载指示器 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  z-index: 10;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: rgba(74, 222, 128, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
