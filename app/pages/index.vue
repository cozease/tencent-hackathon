<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '~/stores/game'

// 使用 i18n
const { locale } = useI18n()
const localePath = useLocalePath()

// 使用游戏商店
const gameStore = useGameStore()

// 响应式数据
const isHovered = ref(false)
const isPressed = ref(false)
const showResetModal = ref(false)

// 处理开始游戏点击事件
const handleStartGame = () => {
  console.log('游戏即将开始...')
  // 跳转到游戏页面
  navigateTo(localePath('/game'))
}

// 切换语言 - 使用路由跳转
const switchLanguage = async () => {
  const targetLocale = locale.value === 'zh' ? 'en' : 'zh'
  await navigateTo(localePath('/', targetLocale))
}

// 获取当前语言显示名称
const currentLanguageName = computed(() => {
  return locale.value === 'zh' ? '中文' : 'EN'
})

// 重置游戏
const handleReset = () => {
  gameStore.resetGameState()
  showResetModal.value = false
  // 显示成功提示（可选）
  console.log(locale.value === 'zh' ? '游戏进度已重置' : 'Game progress has been reset')
}
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
            <h1 class="game-title text-4xl font-bold">
              <span class="title-text">{{ $t('game.title') }}</span>
            </h1>
            <div class="title-subtitle text-sm opacity-80 mt-1">
              {{ $t('game.subtitle') }}
            </div>
          </div>
          
          <!-- 语言切换按钮 -->
          <div class="language-switcher">
            <button
              class="lang-btn"
              @click="switchLanguage"
            >
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
              <UIcon name="i-lucide-trees" class="text-8xl text-green-400" />
              <!-- 未来可以替换为游戏Logo图片 -->
              <!-- <img src="/images/game-logo.png" alt="游戏Logo" class="w-64 h-64 mx-auto" /> -->
            </div>
            <p class="mt-4 text-lg opacity-90">
              {{ $t('game.slogan') }}
            </p>
          </div>

          <!-- 游戏按钮组 -->
          <div class="game-buttons space-y-4">
            <!-- 开始游戏按钮 -->
            <button
              class="start-game-btn"
              :class="{ 
                'btn-hover': isHovered, 
                'btn-pressed': isPressed 
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
                <span class="text-xl font-bold">{{ $t('buttons.startGame') }}</span>
              </span>
            </button>

            <!-- 其他功能按钮（预留） -->
            <div class="secondary-buttons flex gap-4 justify-center mt-6">
              <button class="secondary-btn" @click="console.log('收集功能即将推出')">
                <UIcon name="i-lucide-trophy" class="mr-1" />
                {{ $t('buttons.collection') }}
              </button>
              <button class="secondary-btn">
                <UIcon name="i-lucide-settings" class="mr-1" />
                {{ $t('buttons.settings') }}
              </button>
              <button class="secondary-btn">
                <UIcon name="i-lucide-info" class="mr-1" />
                {{ $t('buttons.about') }}
              </button>
            </div>
          </div>
        </div>
      </main>

      <!-- 底部装饰区域 -->
      <footer class="game-footer py-4 text-center opacity-60">
        <p class="text-sm">{{ $t('game.footer') }}</p>
      </footer>
    </div>

    <!-- 装饰性动画元素 -->
    <div class="floating-elements">
      <div class="floating-leaf leaf-1" />
      <div class="floating-leaf leaf-2" />
      <div class="floating-leaf leaf-3" />
    </div>
    
    <!-- 重置游戏按钮 -->
    <button class="reset-button" @click="showResetModal = true">
      <UIcon name="i-lucide-refresh-cw" />
      <span>{{ $t('buttons.resetGame') }}</span>
    </button>
    
    <!-- 确认重置弹窗 -->
    <Transition name="modal">
      <div v-if="showResetModal" class="reset-modal-overlay" @click="showResetModal = false">
        <div class="reset-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ $t('reset.title') }}</h3>
          </div>
          
          <div class="modal-body">
            <p class="modal-message">{{ $t('reset.message') }}</p>
          </div>
          
          <div class="modal-footer">
            <button class="btn-cancel" @click="showResetModal = false">
              {{ $t('reset.cancel') }}
            </button>
            <button class="btn-confirm" @click="handleReset">
              {{ $t('reset.confirm') }}
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 背景渐变 */
.bg-gradient {
  background: linear-gradient(180deg, 
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
  background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 30px 30px;
  animation: float 20s infinite linear;
}

/* 游戏标题样式 */
.game-title {
  background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
  animation: glow 2s ease-in-out infinite alternate;
}

/* 语言切换按钮样式 */
.language-switcher {
  position: relative;
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

/* Logo占位框 */
.logo-box {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
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
  box-shadow: 
    0 10px 30px rgba(16, 185, 129, 0.4),
    inset 0 1px 0 rgba(255,255,255,0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.start-game-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 
    0 15px 40px rgba(16, 185, 129, 0.5),
    inset 0 1px 0 rgba(255,255,255,0.4);
}

.start-game-btn.btn-pressed {
  transform: translateY(1px) scale(0.98);
  box-shadow: 
    0 5px 15px rgba(16, 185, 129, 0.3),
    inset 0 1px 0 rgba(255,255,255,0.2);
}

/* 按钮光泽效果 */
.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255,255,255,0.3), 
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
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
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
    width: 150px;
    height: 150px;
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