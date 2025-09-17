<template>
  <div class="collection-container">
    <!-- 背景渐变 -->
    <div class="background-gradient" />

    <!-- 头部导航 -->
    <header class="collection-header">
      <button
        class="back-button"
        @click="
          playButtonSound();
          navigateTo(localePath('/'));
        "
      >
        <UIcon name="i-lucide-arrow-left" />
        <span>{{ $t("buttons.back") || "返回" }}</span>
      </button>

      <h1 class="page-title">
        <UIcon name="i-lucide-trophy" class="title-icon" />
        {{ $t("collection.title") || "收集图鉴" }}
      </h1>

      <div class="collection-stats">
        <span class="stats-text">{{ collectedCount }} / {{ totalCount }}</span>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressPercentage + '%' }"
          />
        </div>
      </div>
    </header>

    <!-- 收集网格 -->
    <main class="collection-main">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <div class="spinner-dot" />
          <div class="spinner-dot" />
          <div class="spinner-dot" />
        </div>
        <p>加载中...</p>
      </div>

      <div v-else class="collection-grid">
        <div
          v-for="item in collections"
          :key="item.id"
          class="collection-card"
          :class="{
            collected: gameStore.hasCollected(item.id),
            uncollected: !gameStore.hasCollected(item.id),
            clickable: gameStore.hasCollected(item.id),
          }"
          @click="showWiki(item)"
        >
          <div class="card-image-wrapper">
            <img
              v-if="item.imageFile"
              :src="item.imageFile"
              :alt="item.name"
              class="card-image"
              :class="{ grayscale: !gameStore.hasCollected(item.id) }"
            />
            <div v-else class="card-placeholder">
              <UIcon name="i-lucide-image-off" />
            </div>

            <!-- 未收集遮罩 -->
            <div
              v-if="!gameStore.hasCollected(item.id)"
              class="uncollected-overlay"
            >
              <UIcon name="i-lucide-lock" class="lock-icon" />
              <span class="uncollected-text">未收集</span>
            </div>
          </div>

          <div class="card-info">
            <div class="card-name-row">
              <h3
                class="card-name"
                :class="{ 'text-gray': !gameStore.hasCollected(item.id) }"
              >
                {{ gameStore.hasCollected(item.id) ? item.name : "???" }}
              </h3>
              <!-- 稀有度标签 -->
              <div
                v-if="gameStore.hasCollected(item.id)"
                class="rarity-badge"
                :class="`rarity-${item.rarity.toLowerCase()}`"
              >
                {{ getRarityLabel(item.rarity) }}
              </div>
            </div>
            <p v-if="gameStore.hasCollected(item.id)" class="card-description">
              {{ item.description }}
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- 科普弹窗 -->
    <Transition name="modal-fade">
      <div
        v-if="showWikiModal"
        class="wiki-modal-overlay"
        @click="showWikiModal = false"
      >
        <div class="wiki-modal-container" @click.stop>
          <div class="wiki-modal-header">
            <h3 class="wiki-modal-title">
              <i class="i-heroicons-academic-cap-solid" />
              小科普
            </h3>
            <button
              class="wiki-modal-close"
              @click="
                playButtonSound();
                showWikiModal = false;
              "
            >
              <i class="i-heroicons-x-mark-20-solid" />
            </button>
          </div>
          <div v-if="currentWikiItem" class="wiki-modal-content">
            <h4 class="wiki-item-name">{{ currentWikiItem.name }}</h4>
            <p class="wiki-item-text">{{ currentWikiItem.wiki }}</p>
          </div>
          <div class="wiki-modal-footer">
            <button class="wiki-link-button" @click="openWildFriends">
              去「野朋友计划」了解更多
              <i class="i-heroicons-arrow-right-20-solid" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useGameStore } from "~/stores/game";
import { useI18n } from "vue-i18n";
import { useSound } from "~/composables/useSound";

const { locale, t } = useI18n();
const localePath = useLocalePath();
const gameStore = useGameStore();

// 使用音效
const { playButtonSound } = useSound();

// 设置页面标题
useHead({
  title: computed(() => t("game.title")),
});

// 收集品数据类型
interface CollectionItem {
  id: number;
  name: string;
  description: string;
  wiki: string;
  rarity: string;
  imageFile?: string;
}

// 状态
const collections = ref<CollectionItem[]>([]);
const loading = ref(true);

// 弹窗相关
const showWikiModal = ref(false);
const currentWikiItem = ref<CollectionItem | null>(null);

// 计算属性
const collectedCount = computed(() => gameStore.getCollectedCount());
const totalCount = computed(() => collections.value.length);
const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((collectedCount.value / totalCount.value) * 100);
});

// 获取稀有度标签
const getRarityLabel = (rarity: string) => {
  const labels: Record<string, string> = {
    common: locale.value === "zh" ? "普通" : "Common",
    rare: locale.value === "zh" ? "稀有" : "Rare",
    epic: locale.value === "zh" ? "史诗" : "Epic",
    legendary: locale.value === "zh" ? "传说" : "Legendary",
  };
  return labels[rarity.toLowerCase()] || rarity;
};

// 加载收集品数据
const loadCollections = async () => {
  try {
    const response = await $fetch<{
      success: boolean;
      data?: CollectionItem[];
      error?: string;
    }>("/api/collections");

    if (response.success && response.data) {
      collections.value = response.data;
    } else {
      console.error("Failed to load collections:", response.error);
    }
  } catch (error) {
    console.error("Error fetching collections:", error);
  } finally {
    loading.value = false;
  }
};

// 显示科普弹窗
const showWiki = (item: CollectionItem) => {
  if (!gameStore.hasCollected(item.id)) {
    // 未收集的卡牌不显示科普
    return;
  }
  playButtonSound();
  currentWikiItem.value = item;
  showWikiModal.value = true;
};

// 打开野朋友计划网站
const openWildFriends = () => {
  playButtonSound();
  window.open("https://biodiversity.techforgood.qq.com/", "_blank");
};

// 页面加载时获取数据
onMounted(() => {
  loadCollections();
});
</script>

<style scoped>
/* 容器 */
.collection-container {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* 背景渐变 */
.background-gradient {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    #1a1a2e 0%,
    #16213e 25%,
    #0f3460 50%,
    #1a1a2e 100%
  );
  z-index: -1;
}

/* 头部导航 */
.collection-header {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-button {
  position: absolute;
  left: 2rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) translateX(-2px);
}

.page-title {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.title-icon {
  color: #fbbf24;
  font-size: 2rem;
}

.collection-stats {
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.stats-text {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
  transition: width 0.5s ease;
  border-radius: 4px;
}

/* 主内容区 */
.collection-main {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: white;
}

.loading-spinner {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.spinner-dot {
  width: 12px;
  height: 12px;
  background: #4ade80;
  border-radius: 50%;
  animation: spinnerBounce 1.4s infinite ease-in-out both;
}

.spinner-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.spinner-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes spinnerBounce {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 收集品网格 */
.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
}

/* 卡片样式 */
.collection-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.collection-card.collected:hover {
  border-color: rgba(74, 222, 128, 0.5);
  box-shadow: 0 8px 24px rgba(74, 222, 128, 0.2);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 150%; /* 2:3 宽高比 */
  background: rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.card-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain; /* 改为 contain 以保持图片比例 */
  background: rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}

.card-image.grayscale {
  filter: grayscale(100%) brightness(0.3);
}

.card-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.3);
  font-size: 3rem;
}

/* 未收集遮罩 */
.uncollected-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.lock-icon {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.5);
}

.uncollected-text {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  font-size: 1.1rem;
}

/* 卡片名称行 */
.card-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

/* 稀有度标签 */
.rarity-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  flex-shrink: 0;
}

.rarity-common {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
}

.rarity-rare {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.rarity-epic {
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  color: white;
}

.rarity-legendary {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

/* 卡片信息 */
.card-info {
  padding: 1rem;
}

.card-name {
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
  line-height: 1.4;
}

.card-name.text-gray {
  color: rgba(255, 255, 255, 0.4);
}

.card-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .collection-header {
    padding: 1rem;
  }

  .back-button {
    position: static;
    transform: none;
    margin-bottom: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .collection-stats {
    position: static;
    transform: none;
    align-items: center;
    width: 100%;
  }

  .progress-bar {
    width: 100%;
  }

  .collection-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }

  .card-name {
    font-size: 0.85rem;
  }

  .rarity-badge {
    font-size: 0.6rem;
    padding: 0.1rem 0.4rem;
  }
}

/* 可点击卡片样式 */
.collection-card.clickable {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.collection-card.clickable:hover {
  transform: translateY(-4px);
}

/* 科普弹窗样式 */
.wiki-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 20, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.6) 100%
  );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.wiki-modal-container {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  backdrop-filter: blur(30px) saturate(150%) brightness(1.1);
  -webkit-backdrop-filter: blur(30px) saturate(150%) brightness(1.1);
  border-radius: 24px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 80px rgba(34, 197, 94, 0.1);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.wiki-modal-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  pointer-events: none;
}

.wiki-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.wiki-modal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: bold;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

.wiki-modal-close {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 1.25rem;
  color: rgba(107, 114, 128, 0.9);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 12px;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.wiki-modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #374151;
  transform: scale(1.05);
}

.wiki-modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  background: rgba(255, 255, 255, 0.06);
}

/* 自定义滚动条 */
.wiki-modal-content::-webkit-scrollbar {
  width: 8px;
}

.wiki-modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.wiki-modal-content::-webkit-scrollbar-thumb {
  background: rgba(34, 197, 94, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.wiki-modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(34, 197, 94, 0.5);
}

.wiki-item-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(34, 197, 94, 0.4);
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(34, 197, 94, 0.2);
}

.wiki-item-text {
  font-size: 0.95rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.95);
  text-align: justify;
  white-space: pre-wrap;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2),
    0 1px 0 rgba(255, 255, 255, 0.05);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.wiki-modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
}

.wiki-link-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(
    135deg,
    rgba(74, 222, 128, 0.9) 0%,
    rgba(34, 197, 94, 0.9) 100%
  );
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.wiki-link-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.6s;
}

.wiki-link-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  filter: brightness(1.1);
}

.wiki-link-button:hover::before {
  left: 100%;
}

.wiki-link-button:active {
  transform: translateY(0) scale(0.98);
}

/* 弹窗动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .wiki-modal-container,
.modal-fade-leave-active .wiki-modal-container {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .wiki-modal-container {
  transform: scale(0.9) translateY(20px);
}

.modal-fade-leave-to .wiki-modal-container {
  transform: scale(0.9) translateY(20px);
}

/* 响应式优化 */
@media (max-width: 640px) {
  .wiki-modal-container {
    max-height: 90vh;
    margin: 1rem;
  }

  .wiki-modal-header {
    padding: 1rem;
  }

  .wiki-modal-content {
    padding: 1rem;
  }

  .wiki-modal-footer {
    padding: 1rem;
  }

  .wiki-link-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
