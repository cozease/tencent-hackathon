<script setup>
// 导入游戏商店以确保初始化
import { useGameStore } from '~/stores/game'

// 初始化游戏商店（确保 localStorage 数据加载）
useGameStore()
</script>

<template>
  <UApp>
    <!-- 全局悬浮窗 -->
    <GameFloatingPanel />
    
    <!-- 页面内容 -->
    <NuxtPage />
  </UApp>
</template>