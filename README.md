# 绿野寻踪

[![Nuxt](https://img.shields.io/badge/Nuxt-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)](https://nuxt.com/)
[![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Pinia](https://img.shields.io/badge/Pinia-FFD700?style=for-the-badge&logo=pinia&logoColor=black)](https://pinia.vuejs.org/)

**绿野寻踪** 是一款基于 Nuxt.js 构建的文字冒险和收集养成游戏。玩家在游戏中扮演一名深入神秘森林的探索者，通过一系列选择与森林互动，邂逅各种野生动植物，并最终解锁关于这片土地秘密的个性化回忆。

游戏旨在通过引人入胜的故事情节和互动体验，向玩家传递生物多样性保护的知识和理念，鼓励玩家成为“野朋友计划”的一员，关注并保护我们身边的自然。

## ✨ 主要功能

-   **互动式文字冒险**：体验精心设计的故事情节，你的每个选择都将影响探险的走向。
-   **丰富的收集图鉴**：在探险中发现超过40种动植物，解锁它们的图鉴和科普知识。
-   **AI生成的个性化回顾**：每次探险结束后，AI会根据你的选择和发现，为你生成一份独一无二的旅行回顾和环保建议。
-   **动态背景音乐与音效**：根据不同的场景（森林、河流、山地）自动切换背景音乐，增强沉浸感。
-   **中英双语支持**：内置完善的国际化支持，可随时切换中英文。
-   **响应式设计**：完美适配PC和移动设备。

## 🛠️ 技术栈

-   **前端框架**: [Nuxt.js 4](https://nuxt.com/)
-   **UI 框架**: [Nuxt UI](https://ui.nuxt.com/)
-   **状态管理**: [Pinia](https://pinia.vuejs.org/)
-   **国际化**: [@nuxtjs/i18n](https://i18n.nuxtjs.org/)
-   **AI 服务**: OpenAI like API
-   **代码规范**: ESLint / Prettier

## 🚀 快速开始

### 1. 环境准备

-   [Node.js](https://nodejs.org/) (v24.4.0)
-   [pnpm](https://pnpm.io/) (推荐使用)

### 2. 克隆项目

```bash
git clone https://github.com/cozease/tencent-hackathon.git
cd tencent-hackathon
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 环境变量配置

复制 `.env.example` 文件为 `.env`，并填入你的 AI 服务 API Key。

目前仅支持 OpenAI like 的 API。

### 5. 启动项目

```bash
pnpm dev
```

项目将在 `http://localhost:3000` 启动。

## 📁 项目结构

```
.
├── app/                # Nuxt 应用目录
│   ├── composables/    # Vue 组合式函数 (例如 useSound)
│   ├── pages/          # 页面路由
│   ├── stores/         # Pinia 状态管理
│   └── assets/         # 静态资源 (CSS, etc.)
├── server/             # Nuxt 服务端目录
│   └── api/            # API 路由
├── data/               # 游戏数据 (CSV 格式)
│   ├── collections.csv # 收集图鉴数据
│   └── events.csv      # 游戏事件数据
├── public/             # 公共资源 (图片, 音频等)
├── i18n/               # 国际化语言文件
├── nuxt.config.ts      # Nuxt 配置文件
└── package.json        # 项目依赖和脚本
```

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。
