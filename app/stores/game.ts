import { defineStore } from "pinia";
import { ref, watch } from "vue";

interface JourneyEvent {
  encounter: string;
  choice: string;
}

export const useGameStore = defineStore("game", () => {
  // 状态定义
  const coins = ref<number>(0);
  const cards = ref<number[]>([]);
  const stamina = ref<number>(5); // 体力值（每次探险初始5点）
  const collectedCards = ref<number[]>([]); // 永久收集的卡片（不受重置影响）

  // 本次游戏的历程记录
  const currentJourney = ref<JourneyEvent[]>([]);
  const newlyUnlockedCards = ref<string[]>([]); // 本次游戏新解锁的卡片名称

  // 持久化存储的 key
  const STORAGE_KEY = "game_state";
  const COLLECTION_KEY = "collection_state"; // 收集系统独立存储

  // 从 localStorage 加载数据
  const loadFromStorage = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          coins.value = data.coins ?? 0;
          cards.value = data.cards || [];
          stamina.value = data.stamina ?? 5;
        } catch (e) {
          console.error("Failed to load game state:", e);
        }
      } else {
        // 初次使用，设置默认值
        coins.value = 0;
        cards.value = [];
        stamina.value = 5;
      }

      // 加载收集数据（独立存储）
      const collectionStored = localStorage.getItem(COLLECTION_KEY);
      if (collectionStored) {
        try {
          const collectionData = JSON.parse(collectionStored);
          collectedCards.value = collectionData.collectedCards || [];
        } catch (e) {
          console.error("Failed to load collection state:", e);
        }
      }
    }
  };

  // 保存到 localStorage
  const saveToStorage = () => {
    if (typeof window !== "undefined") {
      const data = {
        coins: coins.value,
        cards: cards.value,
        stamina: stamina.value,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  };

  // 保存收集数据
  const saveCollectionToStorage = () => {
    if (typeof window !== "undefined") {
      const collectionData = {
        collectedCards: collectedCards.value,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(collectionData));
    }
  };

  // 监听变化并自动保存
  watch(
    [coins, cards, stamina],
    () => {
      saveToStorage();
    },
    { deep: true }
  );

  // 监听收集数据变化并自动保存（独立监听）
  watch(
    collectedCards,
    () => {
      saveCollectionToStorage();
    },
    { deep: true }
  );

  // 金币操作
  const addCoins = (amount: number) => {
    coins.value = Math.max(0, coins.value + Math.floor(amount));
  };

  const spendCoins = (amount: number): boolean => {
    if (coins.value >= amount) {
      coins.value -= Math.floor(amount);
      return true;
    }
    return false;
  };

  // 卡牌操作（背包系统）- 暂时禁用，道具卡片功能待后续开发
  const addCard = (cardId: number, cardName?: string): boolean => {
    // 背包功能暂时禁用，仅添加到收集系统
    if (cardId > 0 && !collectedCards.value.includes(cardId)) {
      collectedCards.value.push(cardId);
      // 记录新解锁的卡片名称
      if (cardName) {
        newlyUnlockedCards.value.push(cardName);
      }
      return true; // 返回true表示新收集
    }
    return false; // 返回false表示已收集过
  };

  // 收集系统操作（独立于游戏状态）
  const collectCard = (cardId: number) => {
    if (cardId > 0 && !collectedCards.value.includes(cardId)) {
      collectedCards.value.push(cardId);
    }
  };

  const hasCollected = (cardId: number): boolean => {
    return collectedCards.value.includes(cardId);
  };

  const getCollectedCount = (): number => {
    return collectedCards.value.length;
  };

  const removeCard = (cardId: number) => {
    const index = cards.value.indexOf(cardId);
    if (index > -1) {
      cards.value.splice(index, 1);
    }
  };

  const hasCard = (cardId: number): boolean => {
    return cards.value.includes(cardId);
  };

  const getCardCount = (): number => {
    return cards.value.length;
  };

  // 体力操作
  const consumeStamina = () => {
    if (stamina.value > 0) {
      stamina.value--;
      return true;
    }
    return false;
  };

  const restoreStamina = () => {
    stamina.value = 5;
  };

  const hasStamina = (): boolean => {
    return stamina.value > 0;
  };

  // 历程记录操作
  const addJourneyEvent = (encounter: string, choice: string) => {
    currentJourney.value.push({ encounter, choice });
  };

  const clearJourney = () => {
    currentJourney.value = [];
    newlyUnlockedCards.value = [];
  };

  const getJourneyData = () => {
    return {
      journeyLog: [...currentJourney.value],
      unlockedGallery: [...newlyUnlockedCards.value],
    };
  };

  // 重置游戏状态
  const resetGameState = () => {
    coins.value = 100; // 重置为初始金币值
    cards.value = []; // 背包清空（道具功能待开发）
    stamina.value = 5; // 重置体力值
    clearJourney(); // 清空历程记录
    // 注意：不重置 collectedCards，收集系统独立于游戏进度
    saveToStorage();
  };

  // 初始化时加载数据
  loadFromStorage();

  return {
    // 状态
    coins,
    cards,
    stamina,
    collectedCards,
    currentJourney,
    newlyUnlockedCards,

    // 方法
    addCoins,
    spendCoins,
    addCard,
    removeCard,
    hasCard,
    getCardCount,
    consumeStamina,
    restoreStamina,
    hasStamina,
    resetGameState,
    loadFromStorage,
    saveToStorage,
    // 收集系统方法
    collectCard,
    hasCollected,
    getCollectedCount,
    // 历程记录方法
    addJourneyEvent,
    clearJourney,
    getJourneyData,
  };
});
