import { useGameStore } from "~/stores/game";

// 客户端插件：确保在客户端加载游戏状态
export default defineNuxtPlugin(() => {
  const gameStore = useGameStore();

  // 在客户端启动时加载保存的游戏状态
  if (typeof window !== "undefined") {
    // 确保 DOM 准备就绪后再加载
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        gameStore.loadFromStorage();
      });
    } else {
      // DOM 已经准备就绪
      gameStore.loadFromStorage();
    }
  }
});
