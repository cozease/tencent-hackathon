import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useGameStore = defineStore('game', () => {
  // 状态定义
  const coins = ref<number>(0)
  const cards = ref<number[]>([])
  const choiceCount = ref<number>(0)  // 选择次数统计
  
  // 持久化存储的 key
  const STORAGE_KEY = 'game_state'
  
  // 从 localStorage 加载数据
  const loadFromStorage = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          coins.value = data.coins ?? 0
          cards.value = data.cards || []
          choiceCount.value = data.choiceCount ?? 0
        } catch (e) {
          console.error('Failed to load game state:', e)
        }
      } else {
        // 初次使用，设置默认值
        coins.value = 0
        cards.value = []
        choiceCount.value = 0
      }
    }
  }
  
  // 保存到 localStorage
  const saveToStorage = () => {
    if (typeof window !== 'undefined') {
      const data = {
        coins: coins.value,
        cards: cards.value,
        choiceCount: choiceCount.value,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }
  
  // 监听变化并自动保存
  watch([coins, cards, choiceCount], () => {
    saveToStorage()
  }, { deep: true })
  
  // 金币操作
  const addCoins = (amount: number) => {
    coins.value = Math.max(0, coins.value + Math.floor(amount))
  }
  
  const spendCoins = (amount: number): boolean => {
    if (coins.value >= amount) {
      coins.value -= Math.floor(amount)
      return true
    }
    return false
  }
  
  // 卡牌操作
  const addCard = (cardId: number) => {
    if (cardId > 0 && !cards.value.includes(cardId)) {
      cards.value.push(cardId)
    }
  }
  
  const removeCard = (cardId: number) => {
    const index = cards.value.indexOf(cardId)
    if (index > -1) {
      cards.value.splice(index, 1)
    }
  }
  
  const hasCard = (cardId: number): boolean => {
    return cards.value.includes(cardId)
  }
  
  const getCardCount = (): number => {
    return cards.value.length
  }
  
  // 选择次数操作
  const incrementChoiceCount = () => {
    choiceCount.value++
  }
  
  // 重置游戏状态
  const resetGameState = () => {
    coins.value = 100  // 重置为初始金币值
    cards.value = []
    choiceCount.value = 0  // 重置选择次数
    saveToStorage()
  }
  
  // 初始化时加载数据
  loadFromStorage()
  
  return {
    // 状态
    coins,
    cards,
    choiceCount,
    
    // 方法
    addCoins,
    spendCoins,
    addCard,
    removeCard,
    hasCard,
    getCardCount,
    incrementChoiceCount,
    resetGameState,
    loadFromStorage,
    saveToStorage
  }
})
