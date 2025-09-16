<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useGameStore } from '~/stores/game'

// 消息类型定义
interface Message {
  id: number
  type: 'narrator' | 'npc' | 'player' | 'scene' | 'choice' | 'event'
  speaker?: string
  content: string
  avatar?: string
  image?: string
  choices?: Choice[]
  timestamp: Date
}

interface Choice {
  id: string
  label: string
  description: string
  action?: () => void
}

// 事件定义
interface GameEvent {
  id: number
  name: string
  content: string
  choice1: string
  choice2: string
  result1: string
  result2: string
  possibility1: string
  possibility2: string
  sight: 'forest' | 'mountain' | 'river'
}

// 事件数据
const events = ref<GameEvent[]>([])
const eventsLoading = ref(true)

// 使用 i18n
const { locale, t } = useI18n()
const localePath = useLocalePath()

// 使用游戏商店
const gameStore = useGameStore()

// 切换语言
const switchLanguage = async () => {
  const targetLocale = locale.value === 'zh' ? 'en' : 'zh'
  await navigateTo(localePath('/game', targetLocale))
}

// 获取当前语言显示名称
const currentLanguageName = computed(() => {
  return locale.value === 'zh' ? '中文' : 'EN'
})

// 游戏状态
const messages = ref<Message[]>([])
const isTyping = ref(false)
const currentChoices = ref<Choice[]>([])
const showChoices = ref(false)
const messageContainer = ref<HTMLElement>()
const gameStarted = ref(false)
const currentEventIndex = ref(-1)
const currentEvent = ref<GameEvent | null>(null)
const currentBackgroundSight = ref<'forest' | 'mountain' | 'river' | 'start'>('start')
const showEventImage = ref(false)

// 自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

// 监听选项显示状态，自动滚动
watch(showChoices, (newVal) => {
  if (newVal) {
    scrollToBottom()
  }
})

// 添加消息
const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>, delay = 1000) => {
  isTyping.value = true
  
  await new Promise(resolve => setTimeout(resolve, delay))
  
  const newMessage: Message = {
    ...message,
    id: Date.now(),
    timestamp: new Date()
  }
  
  messages.value.push(newMessage)
  isTyping.value = false
  scrollToBottom()
  
  // 如果有选项，显示选项
  if (message.choices && message.choices.length > 0) {
    currentChoices.value = message.choices
    showChoices.value = true
  }
}

// 处理玩家选择
const handleChoice = async (choice: Choice) => {
  // 隐藏选项
  showChoices.value = false
  currentChoices.value = []
  
  // 如果是事件选择，直接执行action（action内部会处理计数和消息）
  if (currentEvent.value) {
    if (choice.action) {
      await choice.action()
    }
    return
  }
  
  // 普通选择的处理
  // 增加选择次数
  gameStore.incrementChoiceCount()
  
  // 添加玩家消息
  await addMessage({
    type: 'player',
    content: choice.description,
    speaker: t('story.characters.player')
  }, 300)
  
  // 执行选项的动作
  if (choice.action) {
    choice.action()
  }
}

// 开始游戏序列
const startGameSequence = async () => {
  gameStarted.value = true
  
  // 如果是第一次玩，给一些初始金币
  if (gameStore.coins === 0) {
    gameStore.addCoins(100)
  }
  
  // 场景描述 - 开场动画
  await addMessage({
    type: 'scene',
    content: t('story.intro.scene')
  }, 2000)
  
  // 标题文字
  await addMessage({
    type: 'narrator',
    content: t('story.intro.welcome')
  }, 0)//2000)
  
  // 场景转换
  await addMessage({
    type: 'scene',
    content: t('story.intro.sceneLabel')
  }, 0)//1500)
  
  // 叙述
  await addMessage({
    type: 'narrator',
    content: t('story.intro.arrival1')
  }, 0)//2000)
  
  await addMessage({
    type: 'narrator',
    content: t('story.intro.arrival2')
  }, 0)//2000)
  
  await addMessage({
    type: 'narrator',
    content: t('story.intro.arrival3')
  }, 0)//2000)
  
  // NPC对话
  await addMessage({
    type: 'npc',
    speaker: t('story.characters.zhang'),
    content: t('story.npc.zhangIntro'),
    avatar: '👨‍🌾'
  }, 0)//2000)
  
  await addMessage({
    type: 'narrator',
    content: t('story.npc.zhangPoint')
  }, 0)//1500)
  
  await addMessage({
    type: 'npc',
    speaker: t('story.characters.zhang'),
    content: t('story.npc.zhangPhilosophy'),
    avatar: '👨‍🌾'
  }, 0)//2500)
  
  await addMessage({
    type: 'narrator',
    content: t('story.npc.zhangEquipment')
  }, 0)//2000)
  
  await addMessage({
    type: 'npc',
    speaker: t('story.characters.zhang'),
    content: t('story.npc.zhangRest'),
    avatar: '👨‍🌾'
  }, 0)//2000)
  
  await addMessage({
    type: 'npc',
    speaker: t('story.characters.zhang'),
    content: t('story.npc.zhangAdvice'),
    avatar: '👨‍🌾'
  }, 0)//2000)
  
  // 第一个选择
  await addMessage({
    type: 'choice',
    content: t('story.choices.prompt'),
    choices: [
      {
        id: 'A',
        label: t('story.choices.checkEquipment.label'),
        description: t('story.choices.checkEquipment.description'),
        action: async () => {
          console.log('选择了检查装备')
          
          // 添加后续对话
          await addMessage({
            type: 'narrator',
            content: locale.value === 'zh' 
              ? '你仔细检查了装备，一切准备就绪。是时候开始你的探索之旅了！' 
              : 'You have carefully checked the equipment, everything is ready. Time to start your exploration journey!'
          }, 1000)
          
          // 开始事件序列
          setTimeout(() => {
            startEventSequence()
          }, 2000)
        }
      },
      {
        id: 'B',
        label: t('story.choices.askZhang.label'),
        description: t('story.choices.askZhang.description'),
        action: async () => {
          console.log('选择了请教老张')
          
          // 添加后续对话
          await addMessage({
            type: 'narrator',
            content: locale.value === 'zh' 
              ? '你仔细检查了装备，一切准备就绪。是时候开始你的探索之旅了！' 
              : 'You have carefully checked the equipment, everything is ready. Time to start your exploration journey!'
          }, 1000)
          
          // 开始事件序列
          setTimeout(() => {
            startEventSequence()
          }, 2000)
        }
      },
      {
        id: 'C',
        label: t('story.choices.explore.label'),
        description: t('story.choices.explore.description'),
        action: async () => {
          console.log('选择了探索营地')
          
          // 添加后续对话
          await addMessage({
            type: 'narrator',
            content: locale.value === 'zh' 
              ? '你仔细检查了装备，一切准备就绪。是时候开始你的探索之旅了！' 
              : 'You have carefully checked the equipment, everything is ready. Time to start your exploration journey!'
          }, 1000)
          
          // 开始事件序列
          setTimeout(() => {
            startEventSequence()
          }, 2000)
        }
      }
    ]
  }, 1500)
}

// API 响应类型
interface EventsResponse {
  success: boolean
  data?: GameEvent[]
  error?: string
}

// 加载事件数据
const loadEvents = async () => {
  try {
    const response = await $fetch<EventsResponse>('/api/events')
    if (response.success && response.data) {
      events.value = response.data
      eventsLoading.value = false
    } else {
      console.error('Failed to load events:', response.error)
      eventsLoading.value = false
    }
  } catch (error) {
    console.error('Error fetching events:', error)
    eventsLoading.value = false
  }
}

// 开始事件序列
const startEventSequence = async () => {
  if (eventsLoading.value) {
    // 如果事件还在加载中，等待
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!eventsLoading.value) {
          clearInterval(checkInterval)
          resolve(true)
        }
      }, 100)
    })
  }
  
  if (events.value.length === 0) {
    console.error('No events available')
    return
  }
  
  currentEventIndex.value = 0
  await showEvent(0)
}

// 显示事件
const showEvent = async (eventIndex: number) => {
  if (eventIndex >= events.value.length) {
    // 所有事件结束
    await addMessage({
      type: 'narrator',
      content: '恭喜你完成了所有探索任务！'
    }, 1500)
    return
  }

  const event = events.value[eventIndex]
  if (!event) return
  
  currentEvent.value = event
  currentEventIndex.value = eventIndex
  
  // 切换背景
  currentBackgroundSight.value = event.sight
  
  // 显示事件图片
  showEventImage.value = true
  
  // 清空对话窗口
  messages.value = []
  showChoices.value = false
  
  // 显示事件标题
  await addMessage({
    type: 'event',
    speaker: event.name,
    content: event.content
  }, 1000)
  
  // 显示选择
  const choices: Choice[] = [
    {
      id: 'choice1',
      label: event.choice1,
      description: event.choice1,
      action: async () => {
        await handleEventChoice(1)
      }
    },
    {
      id: 'choice2',
      label: event.choice2,
      description: event.choice2,
      action: async () => {
        await handleEventChoice(2)
      }
    }
  ]
  
  currentChoices.value = choices
  showChoices.value = true
}

// 处理事件选择
const handleEventChoice = async (choiceNum: number) => {
  if (!currentEvent.value) return
  
  showChoices.value = false
  currentChoices.value = []
  
  // 增加选择次数
  gameStore.incrementChoiceCount()
  
  // 添加玩家选择消息
  const choice = choiceNum === 1 ? currentEvent.value.choice1 : currentEvent.value.choice2
  await addMessage({
    type: 'player',
    speaker: '你',
    content: choice
  }, 500)
  
  // 进入下一个事件
  setTimeout(() => {
    showEvent(currentEventIndex.value + 1)
  }, 1500)
}

// 组件挂载时自动开始
onMounted(async () => {
  // 加载事件数据
  await loadEvents()
  
  // 延迟一秒后开始游戏序列
  setTimeout(() => {
    startGameSequence()
  }, 1000)
})
</script>

<template>
  <div class="game-container">
    <!-- 背景图片层 -->
    <Transition name="bg-transition">
      <div v-if="gameStarted" class="background-image-layer">
        <img v-if="currentBackgroundSight === 'start'" src="/start.jpg" alt="Game Background" class="game-bg-image">
        <img v-else-if="currentBackgroundSight === 'forest'" src="/forest.png" alt="Forest Background" class="game-bg-image">
        <img v-else-if="currentBackgroundSight === 'mountain'" src="/mountain.png" alt="Mountain Background" class="game-bg-image">
        <img v-else-if="currentBackgroundSight === 'river'" src="/river.png" alt="River Background" class="game-bg-image">
        <div class="background-overlay" />
      </div>
    </Transition>
    
    <!-- 事件图片（左侧） -->
    <Transition name="event-image">
      <div v-if="showEventImage && currentEvent" class="event-image-container">
        <img :src="`/events/${currentEvent.id}.png`" :alt="currentEvent.name" class="event-image">
        <div class="event-name">{{ currentEvent.name }}</div>
      </div>
    </Transition>
    
    <!-- 游戏头部 -->
    <header class="game-header">
      <div class="header-content">
        <h1 class="game-title">{{ $t('game.title') }}</h1>
        
        <!-- 选择次数统计（居中） -->
        <div class="choice-counter">
          <UIcon name="i-lucide-hand-coins" class="counter-icon" />
          <span class="counter-text">{{ gameStore.choiceCount }}</span>
        </div>
        
        <div class="header-actions">
          <button class="icon-btn" :title="$t('buttons.collection')" @click="console.log('收集功能即将推出')">
            <UIcon name="i-lucide-trophy" />
          </button>
          <button class="icon-btn" :title="$t('buttons.settings')">
              <UIcon name="i-lucide-settings" />
            </button>
            <button class="icon-btn" title="音量">
                <UIcon name="i-lucide-volume-2" />
            </button>
            <button class="lang-btn-small" :title="$t('language.switch')" @click="switchLanguage">
              <UIcon name="i-lucide-globe" />
              <span>{{ currentLanguageName }}</span>
            </button>
        </div>
      </div>
    </header>

    <!-- 对话区域 -->
    <main class="chat-container">
      <div ref="messageContainer" class="message-list">
        <!-- 欢迎提示 -->
        <div v-if="!gameStarted" class="welcome-message">
          <div class="loading-animation">
            <div class="loading-dot" />
            <div class="loading-dot" />
            <div class="loading-dot" />
          </div>
          <p>{{ $t('game.loading') }}</p>
        </div>

        <!-- 消息列表 -->
        <TransitionGroup name="message">
          <div 
            v-for="message in messages" 
            :key="message.id" 
            :class="['message-wrapper', `message-${message.type}`]">
            
            <!-- 场景描述 -->
            <div v-if="message.type === 'scene'" class="scene-message">
              <div v-if="message.image" class="scene-image-placeholder">
                <UIcon name="i-lucide-image" class="image-icon" />
                <span>{{ message.image === 'placeholder_forest' ? $t('story.images.forest') : $t('story.images.cabin') }}</span>
              </div>
              <p class="scene-text">{{ message.content }}</p>
            </div>
            
            <!-- 事件消息 -->
            <div v-else-if="message.type === 'event'" class="event-message">
              <div class="event-header">
                <UIcon name="i-lucide-compass" class="event-icon" />
                <strong>{{ message.speaker }}</strong>
              </div>
              <p class="event-text">{{ message.content }}</p>
            </div>

            <!-- 旁白叙述 -->
            <div v-else-if="message.type === 'narrator'" class="narrator-message">
              <p>{{ message.content }}</p>
            </div>

            <!-- NPC对话 -->
            <div v-else-if="message.type === 'npc'" class="npc-bubble">
              <div class="avatar">{{ message.avatar || '🌲' }}</div>
              <div class="bubble-content">
                <div class="speaker-name">{{ message.speaker }}</div>
                <div class="message-text">{{ message.content }}</div>
              </div>
            </div>

            <!-- 玩家消息 -->
            <div v-else-if="message.type === 'player'" class="player-bubble">
              <div class="bubble-content">
                <div class="message-text">{{ message.content }}</div>
              </div>
              <div class="avatar">🧑‍🎓</div>
            </div>

            <!-- 选择提示 -->
            <div v-else-if="message.type === 'choice'" class="choice-prompt">
              <p>{{ message.content }}</p>
            </div>
          </div>
        </TransitionGroup>

        <!-- 打字中指示器 -->
        <div v-if="isTyping" class="typing-indicator">
          <div class="typing-dot" />
          <div class="typing-dot" />
          <div class="typing-dot" />
        </div>
        
        <!-- 选项直接在对话框内显示 -->
        <Transition name="fade">
          <div v-if="showChoices && currentChoices.length > 0" class="choices-in-chat">
            <div class="choices-container">
              <button 
                v-for="choice in currentChoices" 
                :key="choice.id"
                class="choice-bubble"
                @click="handleChoice(choice)"
              >
                <span class="choice-label">{{ choice.label }}</span>
                <span v-if="choice.description && choice.description !== choice.label" class="choice-desc">
                  {{ choice.description }}
                </span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 游戏容器 */
.game-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a7b 100%);
  overflow: hidden;
  position: relative;
}

/* 背景图片层 */
.background-image-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.game-bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: bgFadeIn 2s ease-out, bgZoomIn 4s ease-out, bgParallax 30s ease-in-out infinite;
}

/* 背景遮罩层 */
.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(30, 58, 95, 0.3) 0%,
    rgba(30, 58, 95, 0.5) 50%,
    rgba(30, 58, 95, 0.7) 100%
  );
  animation: overlayFadeIn 2.5s ease-out;
}

/* 进入动画 */
@keyframes bgFadeIn {
  from {
    opacity: 0;
    filter: blur(5px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}

@keyframes bgZoomIn {
  from {
    transform: scale(1.2) rotate(0.5deg);
  }
  to {
    transform: scale(1) rotate(0deg);
  }
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 背景缓慢移动效果 */
@keyframes bgParallax {
  0%, 100% {
    transform: scale(1) translateX(0);
  }
  50% {
    transform: scale(1.05) translateX(-10px);
  }
}

/* 背景过渡动画 */
.bg-transition-enter-active {
  transition: opacity 1.5s ease-out;
}

.bg-transition-enter-from {
  opacity: 0;
}

.bg-transition-enter-to {
  opacity: 1;
}

/* 游戏头部 */
.game-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 1.5rem;
  position: relative;
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

/* 选择次数计数器 */
.choice-counter {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 0.4rem 0.8rem;
}

.counter-icon {
  color: #fbbf24;
  font-size: 1.1rem;
}

.counter-text {
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  min-width: 1.5rem;
  text-align: center;
}

.game-title {
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.icon-btn {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 语言切换按钮 */
.lang-btn-small {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lang-btn-small:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* 聊天容器 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 700px;
  width: 50%;
  margin: 0 2rem 0 auto;
  padding: 1rem;
  overflow: hidden;
  position: relative;
  z-index: 10;
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  padding-right: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 自定义滚动条 */
.message-list::-webkit-scrollbar {
  width: 8px;
}

.message-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.message-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 欢迎消息 */
.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: rgba(255, 255, 255, 0.7);
}

.loading-animation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.loading-dot {
  width: 12px;
  height: 12px;
  background: #4ade80;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.loading-dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dot:nth-child(2) { animation-delay: -0.16s; }

/* 消息包装器 */
.message-wrapper {
  animation: fadeIn 0.5s ease-out;
  width: 100%;
  display: flex;
}

/* 不同消息类型的对齐方式 */
.message-player {
  justify-content: flex-end;
}

.message-npc,
.message-narrator,
.message-scene,
.message-choice {
  justify-content: flex-start;
}

/* 场景消息 */
.scene-message {
  text-align: center;
  padding: 2rem;
  margin: 1rem 0;
  width: 100%;
}

.scene-image-placeholder {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.5);
}

.image-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.scene-text {
  color: rgba(255, 255, 255, 0.9);
  font-style: italic;
  line-height: 1.8;
  max-width: 600px;
  margin: 0 auto;
}

/* 旁白消息 */
.narrator-message {
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid #4ade80;
  padding: 1rem 1.5rem;
  margin: 0.5rem 2rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  width: calc(100% - 4rem);
}

/* NPC气泡 */
.npc-bubble {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  max-width: 70%;
}

.npc-bubble .avatar {
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  height: 3rem;
}

.npc-bubble .bubble-content {
  background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  border-radius: 18px 18px 18px 4px;
  padding: 0.75rem 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.speaker-name {
  font-size: 0.875rem;
  color: #4ade80;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.message-text {
  color: white;
  line-height: 1.5;
}

/* 玩家气泡 */
.player-bubble {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  max-width: 70%;
}

.player-bubble .bubble-content {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 18px 18px 4px 18px;
  padding: 0.75rem 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.player-bubble .avatar {
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  height: 3rem;
}

/* 选择提示 */
.choice-prompt {
  text-align: center;
  color: #4ade80;
  font-weight: 500;
  margin: 1rem 0;
  width: 100%;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 1rem 2rem;
  width: fit-content;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: typing 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }
.typing-dot:nth-child(3) { animation-delay: 0s; }

/* 对话框内的选项 */
.choices-in-chat {
  padding: 1rem 1rem 0.5rem;
  margin-top: 0.5rem;
}

.choices-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 100%;
}

.choice-bubble {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(74, 222, 128, 0.08) 100%);
  border: 2px solid rgba(74, 222, 128, 0.3);
  border-radius: 20px;
  padding: 1rem 1.25rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  position: relative;
  overflow: hidden;
  margin-left: 20%;
  margin-right: 0;
  max-width: 80%;
}

.choice-bubble::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(74, 222, 128, 0.1) 50%, transparent 100%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.choice-bubble:hover::before {
  transform: translateX(100%);
}

.choice-bubble:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(74, 222, 128, 0.25) 100%);
  border-color: rgba(74, 222, 128, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(74, 222, 128, 0.3);
}

.choice-label {
  color: #4ade80;
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}

.choice-desc {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-top: 0.25rem;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 过渡动画 */
.message-enter-active {
  transition: all 0.5s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* 淡入淡出动画（用于选项） */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 事件图片容器（左侧） */
.event-image-container {
  position: fixed;
  left: 16rem;  /* 往右移动，避开悬浮按钮 */
  top: 50%;
  transform: translateY(-50%);
  z-index: 15;
  max-width: 600px;  /* 放大图片 */
  width: 50vw;  /* 放大比例 */
}

.event-image {
  width: 100%;
  height: auto;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
  border: 4px solid rgba(255, 255, 255, 0.15);
  transition: transform 0.3s ease;
}

.event-image:hover {
  transform: scale(1.02);
}

.event-name {
  text-align: center;
  margin-top: 1.5rem;
  padding: 0.5rem 1rem;
  color: white;
  font-size: 1.4rem;
  font-weight: bold;
  text-shadow: 
    0 0 20px rgba(255, 255, 255, 0.8),
    0 0 40px rgba(255, 255, 255, 0.6),
    0 0 60px rgba(255, 255, 255, 0.4),
    2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.1em;
  position: relative;
}

/* 文字下方添加微妙的光晕效果 */
.event-name::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(255, 255, 255, 0.6) 50%,
    transparent 100%);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

/* 事件消息样式 */
.event-message {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin: 0.5rem auto;  /* 居中显示 */
  width: 100%;  /* 固定宽度 */
  max-width: 600px;  /* 最大宽度限制 */
  min-width: 400px;  /* 最小宽度限制 */
  box-sizing: border-box;  /* 确保padding包含在宽度内 */
}

.event-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #f59e0b;
  justify-content: center;  /* 标题居中 */
}

.event-icon {
  font-size: 1.25rem;
  flex-shrink: 0;  /* 图标不缩小 */
}

.event-text {
  color: #fefefe;
  line-height: 1.6;
  text-align: center;  /* 文字居中 */
}

/* 事件图片过渡动画 */
.event-image-enter-active,
.event-image-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.event-image-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(-50px) scale(0.9);
}

.event-image-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-50px) scale(0.9);
}

/* 添加呼吸动画效果 */
@keyframes eventGlow {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.5));
  }
}

.event-image-container {
  animation: eventGlow 3s ease-in-out infinite;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-container {
    padding: 0.5rem;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }
  
  .npc-bubble,
  .player-bubble {
    max-width: 85%;
  }
  
  .choices-in-chat {
    padding: 0.75rem;
  }
  
  .choice-bubble {
    max-width: 100%;
    margin-right: 0;
    padding: 0.9rem 1.1rem;
  }
  
  .event-message {
    width: 90%;  /* 移动端更宽 */
    min-width: auto;  /* 移动端不设置最小宽度 */
    max-width: 100%;  /* 移动端最大宽度100% */
    margin: 0.5rem auto;
  }
  
  .choice-counter {
    position: static;
    transform: none;
    margin: 0 auto;
    padding: 0.4rem 0.8rem;
    font-size: 0.875rem;
  }
  
  .header-content {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .game-title {
    width: 100%;
    text-align: center;
    font-size: 1.25rem;
  }
  
  .event-image-container {
    position: static;
    width: 100%;
    max-width: 100%;
    transform: none;
    left: auto;
    top: auto;
    margin-bottom: 1rem;
    padding: 0 1rem;
  }
  
  .event-image {
    width: 100%;
    max-width: 350px;
    margin: 0 auto;
    display: block;
  }
  
  .event-image:hover {
    transform: none;
  }
  
  .event-name {
    font-size: 1.2rem;
  }
  
  .event-name::after {
    display: none;
  }
}
</style>
