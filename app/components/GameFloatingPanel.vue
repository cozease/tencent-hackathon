<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '~/stores/game'

// 使用 i18n
const { locale } = useI18n()

// 使用游戏商店
const gameStore = useGameStore()

// 背包弹窗状态
const showInventory = ref(false)
</script>

<template>
  <div>
    <!-- 左侧悬浮窗 -->
    <div class="floating-panel">
      <!-- 金币显示 -->
      <div class="coin-display">
        <UIcon name="i-lucide-coins" class="coin-icon" />
        <span class="coin-amount">{{ gameStore.coins }}</span>
      </div>
      
      <!-- 背包按钮 -->
      <button class="inventory-btn" @click="showInventory = true">
        <UIcon name="i-lucide-backpack" class="inventory-icon" />
        <span class="inventory-label">{{ locale === 'zh' ? '背包' : 'Bag' }}</span>
        <span v-if="gameStore.cards.length > 0" class="card-count">{{ gameStore.cards.length }}</span>
      </button>
    </div>
    
    <!-- 背包弹窗 -->
    <Transition name="modal">
      <div v-if="showInventory" class="modal-overlay" @click="showInventory = false">
        <div class="inventory-modal" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">{{ locale === 'zh' ? '我的背包' : 'My Inventory' }}</h2>
            <button class="modal-close" @click="showInventory = false">
              <UIcon name="i-lucide-x" />
            </button>
          </div>
          
          <div class="modal-body">
            <!-- 空背包提示 -->
            <div v-if="gameStore.cards.length === 0" class="empty-inventory">
              <UIcon name="i-lucide-package-open" class="empty-icon" />
              <p class="empty-text">
                {{ locale === 'zh' ? '背包是空的~继续探索以发现卡牌' : 'Your bag is empty~ Continue exploring to discover cards' }}
              </p>
            </div>
            
            <!-- 卡牌列表 -->
            <div v-else class="card-grid">
              <div v-for="cardId in gameStore.cards" :key="cardId" class="card-item">
                <div class="card-inner">
                  <div class="card-id">#{{ cardId }}</div>
                  <div class="card-placeholder">
                    <UIcon name="i-lucide-image" />
                    <span>{{ locale === 'zh' ? '卡牌' : 'Card' }} {{ cardId }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 左侧悬浮窗 */
.floating-panel {
  position: fixed;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 金币显示 */
.coin-display {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border: 2px solid #f97316;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  animation: floatAnimation 3s ease-in-out infinite;
}

.coin-icon {
  font-size: 1.5rem;
  color: #7c2d12;
}

.coin-amount {
  font-size: 1.125rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

/* 背包按钮 */
.inventory-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: 2px solid #6d28d9;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  position: relative;
  animation: floatAnimation 3s ease-in-out infinite;
  animation-delay: 0.5s;
}

.inventory-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.inventory-icon {
  font-size: 1.5rem;
}

.inventory-label {
  font-weight: 600;
}

.card-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 999px;
  min-width: 20px;
  text-align: center;
}

/* 浮动动画 */
@keyframes floatAnimation {
  0%, 100% {
    transform: translateY(-50%) translateX(0);
  }
  50% {
    transform: translateY(-50%) translateX(5px);
  }
}

/* 背包弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.inventory-modal {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  max-width: 800px;
  width: 100%;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-close {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

/* 空背包提示 */
.empty-inventory {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  color: rgba(139, 92, 246, 0.5);
  margin-bottom: 1rem;
}

.empty-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.125rem;
}

/* 卡牌网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.card-item {
  aspect-ratio: 3 / 4;
  perspective: 1000px;
}

.card-inner {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.card-inner:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.6);
}

.card-id {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
}

.card-placeholder svg {
  font-size: 2rem;
}

.card-placeholder span {
  font-size: 0.875rem;
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

.modal-enter-active .inventory-modal,
.modal-leave-active .inventory-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from .inventory-modal,
.modal-leave-to .inventory-modal {
  transform: scale(0.9);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .floating-panel {
    left: 0.5rem;
    flex-direction: row;
    top: auto;
    bottom: 5rem;
    transform: none;
  }
  
  .coin-display,
  .inventory-btn {
    padding: 0.5rem 0.75rem;
  }
  
  .coin-icon,
  .inventory-icon {
    font-size: 1.25rem;
  }
  
  .coin-amount {
    font-size: 1rem;
  }
  
  .inventory-label {
    display: none;
  }
  
  .inventory-modal {
    max-height: 80vh;
  }
}
</style>
