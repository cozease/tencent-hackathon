<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useGameStore } from "~/stores/game";
import { useSound } from "~/composables/useSound";

// 使用 i18n
const { locale, t } = useI18n();
const localePath = useLocalePath();

// 设置页面标题
useHead({
  title: computed(() => t("game.title")),
});

// 使用游戏商店
const gameStore = useGameStore();

// 使用音效
const { playButtonSound } = useSound();

// 响应式数据
const isHovered = ref(false);
const isPressed = ref(false);
const showResetModal = ref(false);

// 背景音乐
const bgMusic = ref<HTMLAudioElement | null>(null);
const isMusicMuted = ref(false);

// 初始化背景音乐
const initMusic = () => {
  if (typeof window !== "undefined") {
    bgMusic.value = new Audio("/audio/bgm/start.mp3");
    if (bgMusic.value) {
      bgMusic.value.loop = true;
      bgMusic.value.volume = 0.5;

      // 读取音乐静音状态
      const savedMuted = localStorage.getItem("musicMuted");
      isMusicMuted.value = savedMuted === "true";

      if (!isMusicMuted.value) {
        bgMusic.value.play().catch(() => {
          // 浏览器可能阻止自动播放，需要用户交互
          console.log("自动播放被阻止，需要用户交互");
        });
      }
    }
  }
};

// 切换音乐静音
const toggleMusic = () => {
  playButtonSound();
  isMusicMuted.value = !isMusicMuted.value;
  localStorage.setItem("musicMuted", String(isMusicMuted.value));

  if (bgMusic.value) {
    if (isMusicMuted.value) {
      bgMusic.value.pause();
    } else {
      bgMusic.value.play();
    }
  }
};

// 处理开始游戏点击事件
const handleStartGame = () => {
  playButtonSound();
  console.log("游戏即将开始...");
  // 停止背景音乐
  if (bgMusic.value) {
    bgMusic.value.pause();
  }
  // 跳转到游戏页面
  navigateTo(localePath("/game"));
};

// 生命周期钩子
onMounted(() => {
  initMusic();
});

onUnmounted(() => {
  if (bgMusic.value) {
    bgMusic.value.pause();
    bgMusic.value = null;
  }
});

// 切换语言 - 使用路由跳转
const switchLanguage = async () => {
  playButtonSound();
  const targetLocale = locale.value === "zh" ? "en" : "zh";
  await navigateTo(localePath("/", targetLocale));
};

// 获取当前语言显示名称
const currentLanguageName = computed(() => {
  return locale.value === "zh" ? "中文" : "EN";
});

// 重置游戏（清空图鉴收集记录）
const handleReset = () => {
  playButtonSound();
  gameStore.resetGameState();
  showResetModal.value = false;
  // 显示成功提示（可选）
  console.log(
    locale.value === "zh"
      ? "图鉴收集进度已重置"
      : "Collection progress has been reset"
  );
};
</script>

<template>
  <div class="game-container min-h-screen relative overflow-hidden">
    <!-- 背景装饰（为未来的背景图预留） -->
    <div class="background-layer absolute inset-0 z-0">
      <!-- 渐变背景 -->
      <div class="bg-gradient absolute inset-0" />

      <!-- 装饰元素 -->
      <div class="decoration-dots" />

      <!-- 未来可以在这里添加背景图片 -->
      <!-- <img src="/images/game-background.jpg" alt="背景" class="absolute inset-0 w-full h-full object-cover" /> -->
    </div>

    <!-- 主要内容区域 -->
    <div class="content-layer relative z-10 min-h-screen flex flex-col">
      <!-- 顶部导航栏 -->
      <header class="game-header px-8 py-6">
        <div class="flex items-center justify-between">
          <!-- 游戏Logo/标题 -->
          <div class="game-title-wrapper">
            <h1 class="game-title text-5xl font-bold">
              <span class="title-text">{{ $t("game.title") }}</span>
            </h1>
            <div class="title-subtitle text-sm opacity-80 mt-1">
              {{ $t("game.subtitle") }}
            </div>
          </div>

          <!-- 音乐控制按钮 -->
          <button
            class="music-toggle"
            :class="{ muted: isMusicMuted }"
            :title="
              isMusicMuted ? $t('buttons.unmuteMusic') : $t('buttons.muteMusic')
            "
            @click="toggleMusic"
          >
            <UIcon
              :name="isMusicMuted ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
            />
          </button>

          <!-- 语言切换按钮 -->
          <div class="language-switcher">
            <button class="lang-btn" @click="switchLanguage">
              <UIcon name="i-lucide-globe" class="mr-2" />
              <span class="font-medium">{{ currentLanguageName }}</span>
            </button>
          </div>
        </div>
      </header>

      <!-- 主体内容区域 -->
      <main class="flex-1 flex items-center justify-center px-8">
        <div class="game-menu-container text-center">
          <!-- 游戏Logo占位区域 -->
          <div class="logo-placeholder mb-12">
            <div class="logo-box mx-auto">
              <img src="/logo.png" alt="绿野寻踪" class="logo-image" />
            </div>
            <p class="mt-4 text-lg opacity-90">
              {{ $t("game.slogan") }}
            </p>
          </div>

          <!-- 游戏按钮组 -->
          <div class="game-buttons space-y-4">
            <!-- 开始游戏按钮 -->
            <button
              class="start-game-btn"
              :class="{
                'btn-hover': isHovered,
                'btn-pressed': isPressed,
              }"
              @click="handleStartGame"
              @mouseenter="isHovered = true"
              @mouseleave="isHovered = false"
              @mousedown="isPressed = true"
              @mouseup="isPressed = false"
            >
              <span class="btn-shine" />
              <span class="btn-content">
                <UIcon name="i-lucide-play" class="mr-2 text-2xl" />
                <span class="text-xl font-bold">{{
                  $t("buttons.startGame")
                }}</span>
              </span>
            </button>

            <!-- 其他功能按钮（预留） -->
            <div class="secondary-buttons flex gap-4 justify-center mt-6">
              <button
                class="secondary-btn"
                @click="
                  playButtonSound();
                  navigateTo(localePath('/collection'));
                "
              >
                <UIcon name="i-lucide-trophy" class="mr-1" />
                {{ $t("buttons.collection") }}
              </button>
              <button class="secondary-btn" @click="playButtonSound()">
                <UIcon name="i-lucide-settings" class="mr-1" />
                {{ $t("buttons.settings") }}
              </button>
              <button class="secondary-btn" @click="playButtonSound()">
                <UIcon name="i-lucide-info" class="mr-1" />
                {{ $t("buttons.about") }}
              </button>
            </div>
          </div>
        </div>
      </main>

      <!-- 底部装饰区域 -->
      <footer class="game-footer py-4 text-center opacity-60">
        <p class="text-sm">{{ $t("game.footer") }}</p>
      </footer>
    </div>

    <!-- 装饰性动画元素 -->
    <div class="floating-elements">
      <div class="floating-leaf leaf-1" />
      <div class="floating-leaf leaf-2" />
      <div class="floating-leaf leaf-3" />
    </div>

    <!-- 重置游戏按钮 -->
    <button
      class="reset-button"
      @click="
        playButtonSound();
        showResetModal = true;
      "
    >
      <UIcon name="i-lucide-refresh-cw" />
      <span>{{ $t("buttons.resetGame") }}</span>
    </button>

    <!-- 确认重置弹窗 -->
    <Transition name="modal">
      <div
        v-if="showResetModal"
        class="reset-modal-overlay"
        @click="showResetModal = false"
      >
        <div class="reset-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ $t("reset.title") }}</h3>
          </div>

          <div class="modal-body">
            <p class="modal-message">{{ $t("reset.message") }}</p>
          </div>

          <div class="modal-footer">
            <button
              class="btn-cancel"
              @click="
                playButtonSound();
                showResetModal = false;
              "
            >
              {{ $t("reset.cancel") }}
            </button>
            <button class="btn-confirm" @click="handleReset">
              {{ $t("reset.confirm") }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 游戏容器样式 */
.game-container {
  background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.5) 0%,
      rgba(118, 75, 162, 0.5) 100%
    ),
    url("/start.jpg") center center / cover no-repeat fixed;
  font-family: "Public Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
}

/* 背景渐变 */
.bg-gradient {
  background: linear-gradient(
    180deg,
    rgba(16, 185, 129, 0.1) 0%,
    rgba(34, 197, 94, 0.2) 50%,
    rgba(74, 222, 128, 0.1) 100%
  );
}

/* 装饰点阵 */
.decoration-dots {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 1px,
    transparent 1px
  );
  background-size: 30px 30px;
  animation: float 20s infinite linear;
}

/* 游戏标题样式 */
.game-title {
  background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  animation: glow 2s ease-in-out infinite alternate;
}

/* 音乐控制按钮 */
.music-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  cursor: pointer;
  margin-left: auto;
}

.music-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.music-toggle.muted {
  opacity: 0.6;
}

/* 语言切换按钮样式 */
.language-switcher {
  position: relative;
  margin-left: 12px;
}

.lang-btn {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.lang-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.lang-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 标题发光效果 */
@keyframes glow {
  from {
    filter: drop-shadow(0 0 5px rgba(52, 211, 153, 0.5));
  }
  to {
    filter: drop-shadow(0 0 20px rgba(52, 211, 153, 0.8));
  }
}

/* Logo容器 */
.logo-box {
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: breathe 3s ease-in-out infinite;
}

/* 外层光晕 */
.logo-box::before {
  content: "";
  position: absolute;
  inset: -30px;
  background: radial-gradient(
    circle,
    rgba(74, 222, 128, 0.15) 0%,
    rgba(34, 197, 94, 0.08) 40%,
    transparent 70%
  );
  border-radius: 50%;
  filter: blur(25px);
  animation: pulseGlow 4s ease-in-out infinite;
  z-index: -1;
}

/* 内层柔光边框 */
.logo-box::after {
  content: "";
  position: absolute;
  inset: 10px;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%
  );
  border-radius: 50%;
  opacity: 0.6;
  pointer-events: none;
}

.logo-image {
  width: 90%;
  height: 85%;
  object-fit: contain;
  border-radius: 50%;
  filter: brightness(1.05) drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))
    drop-shadow(0 0 30px rgba(74, 222, 128, 0.25));
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  position: relative;

  /* 渐变淡入遮罩 */
  mask-image: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 1) 30%,
    rgba(0, 0, 0, 0.9) 50%,
    rgba(0, 0, 0, 0.5) 70%,
    rgba(0, 0, 0, 0) 90%
  );
  -webkit-mask-image: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 1) 30%,
    rgba(0, 0, 0, 0.9) 50%,
    rgba(0, 0, 0, 0.5) 70%,
    rgba(0, 0, 0, 0) 90%
  );
  animation: fadeInLogo 1.5s ease-out;
}

@keyframes fadeInLogo {
  from {
    opacity: 0;
    transform: scale(0.8);
    filter: brightness(1.05) blur(10px);
  }
  to {
    opacity: 1;
    transform: scale(1);
    filter: brightness(1.05) drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))
      drop-shadow(0 0 30px rgba(74, 222, 128, 0.25));
  }
}

.logo-box:hover .logo-image {
  transform: scale(1.08) translateY(-2px);
  filter: brightness(1.1) drop-shadow(0 15px 35px rgba(0, 0, 0, 0.35))
    drop-shadow(0 0 45px rgba(74, 222, 128, 0.4));
  mask-image: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 1) 40%,
    rgba(0, 0, 0, 0.95) 60%,
    rgba(0, 0, 0, 0.6) 75%,
    rgba(0, 0, 0, 0) 95%
  );
  -webkit-mask-image: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 1) 40%,
    rgba(0, 0, 0, 0.95) 60%,
    rgba(0, 0, 0, 0.6) 75%,
    rgba(0, 0, 0, 0) 95%
  );
}

/* 光晕脉动动画 */
@keyframes pulseGlow {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* 光晕旋转动画 */
@keyframes rotateGlow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 开始游戏按钮 */
.start-game-btn {
  position: relative;
  padding: 20px 60px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 60px;
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.start-game-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 15px 40px rgba(16, 185, 129, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.start-game-btn.btn-pressed {
  transform: translateY(1px) scale(0.98);
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* 按钮光泽效果 */
.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s ease;
}

.start-game-btn:hover .btn-shine {
  left: 100%;
}

.btn-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
}

/* 次要按钮 */
.secondary-btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* 漂浮动画元素 */
.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.floating-leaf {
  position: absolute;
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  opacity: 0.6;
  border-radius: 0 100% 0 100%;
  animation: float-leaf 15s infinite ease-in-out;
}

.leaf-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.leaf-2 {
  top: 60%;
  right: 10%;
  animation-delay: 5s;
  animation-duration: 20s;
}

.leaf-3 {
  bottom: 20%;
  left: 50%;
  animation-delay: 10s;
  animation-duration: 18s;
}

@keyframes float-leaf {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
  100% {
    transform: translateY(0) rotate(360deg);
  }
}

@keyframes float {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-30px);
  }
}

/* 重置按钮 */
.reset-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 50;
}

.reset-button:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
}

/* 重置弹窗样式 */
.reset-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.reset-modal {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 20px;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(239, 68, 68, 0.2);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.modal-body {
  padding: 2rem 1.5rem;
}

.modal-message {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  font-size: 1.125rem;
}

.modal-footer {
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  border-top: 1px solid rgba(239, 68, 68, 0.2);
}

.btn-cancel,
.btn-confirm {
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-confirm {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

/* Modal 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .reset-modal,
.modal-leave-active .reset-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from .reset-modal,
.modal-leave-to .reset-modal {
  transform: scale(0.9);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-title {
    font-size: 2rem;
  }

  .logo-box {
    width: 160px;
    height: 160px;
  }

  .logo-box::before {
    inset: -20px;
  }

  .start-game-btn {
    padding: 16px 48px;
    font-size: 1.125rem;
  }

  .secondary-buttons {
    flex-direction: column;
    align-items: center;
  }

  .secondary-btn {
    width: 200px;
  }

  .reset-button {
    bottom: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .reset-modal {
    margin: 1rem;
  }
}
</style>
