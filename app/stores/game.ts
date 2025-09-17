import { defineStore } from "pinia";
import { ref, watch } from "vue";

interface JourneyEvent {
  encounter: string;
  choice: string;
}

interface UnlockedCardInfo {
  id: number;
  name: string;
}

export const useGameStore = defineStore("game", () => {
  // 状态定义
  const stamina = ref<number>(5); // 体力值（每次探险初始5点）
  const collectedCards = ref<number[]>([]); // 永久收集的卡片（不受重置影响）

  // 本次游戏的历程记录
  const currentJourney = ref<JourneyEvent[]>([]);
  const newlyUnlockedCards = ref<string[]>([]); // 本次游戏新解锁的卡片名称（用于API）
  const newlyUnlockedCardsInfo = ref<UnlockedCardInfo[]>([]); // 本次游戏新解锁的卡片完整信息

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
          stamina.value = data.stamina ?? 5;
        } catch (e) {
          console.error("Failed to load game state:", e);
        }
      } else {
        // 初次使用，设置默认值
        stamina.value = 5;
      }

      // 加载收集数据（独立存储）
      const collectionStored = localStorage.getItem(COLLECTION_KEY);
      if (collectionStored) {
        try {
          const collectionData = JSON.parse(collectionStored);
          collectedCards.value = collectionData.collectedCards || [];
          console.log("Loaded collected cards:", collectedCards.value); // 调试日志
        } catch (e) {
          console.error("Failed to load collection state:", e);
        }
      } else {
        console.log("No collection data found in localStorage");
      }
    }
  };

  // 保存到 localStorage
  const saveToStorage = () => {
    if (typeof window !== "undefined") {
      const data = {
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
      console.log("Saved collected cards:", collectedCards.value); // 调试日志
    }
  };

  // 监听变化并自动保存
  watch(stamina, () => {
    saveToStorage();
  });

  // 监听收集数据变化并自动保存（独立监听）
  watch(
    collectedCards,
    () => {
      saveCollectionToStorage();
    },
    { deep: true }
  );

  // 收集系统操作
  const addCard = (cardId: number, cardName?: string): boolean => {
    // 添加到收集系统
    if (cardId > 0 && !collectedCards.value.includes(cardId)) {
      collectedCards.value.push(cardId);
      // 记录新解锁的卡片信息
      if (cardName) {
        newlyUnlockedCards.value.push(cardName);
        newlyUnlockedCardsInfo.value.push({ id: cardId, name: cardName });
      }
      // 手动触发保存以确保立即持久化
      saveCollectionToStorage();
      console.log(
        "Added card:",
        cardId,
        "Total cards:",
        collectedCards.value.length
      );
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
    newlyUnlockedCardsInfo.value = [];
  };

  const getJourneyData = () => {
    return {
      journeyLog: [...currentJourney.value],
      unlockedGallery: [...newlyUnlockedCards.value], // 名称数组（用于API）
      unlockedCardsInfo: [...newlyUnlockedCardsInfo.value], // 完整信息（用于展示）
    };
  };

  // 重置游戏状态（清空图鉴收集记录）
  const resetGameState = () => {
    stamina.value = 5; // 重置体力值
    clearJourney(); // 清空历程记录
    collectedCards.value = []; // 清空已收集的图鉴
    saveToStorage();
    saveCollectionToStorage(); // 保存收集状态
  };

  // 初始化时加载数据（仅在客户端）
  if (typeof window !== "undefined") {
    loadFromStorage();
  }

  return {
    // 状态
    stamina,
    collectedCards,
    currentJourney,
    newlyUnlockedCards,
    newlyUnlockedCardsInfo,

    // 方法
    addCard,
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
