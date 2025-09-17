<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import { useGameStore } from "~/stores/game";
import { useSound } from "~/composables/useSound";

// 消息类型定义
interface Message {
  id: number;
  type: "narrator" | "npc" | "player" | "scene" | "choice" | "event" | "system";
  speaker?: string;
  content: string;
  avatar?: string;
  image?: string;
  choices?: Choice[];
  timestamp: Date;
}

interface Choice {
  id: string;
  label: string;
  description: string;
  action?: () => void;
}

// 事件定义
interface GameEvent {
  id: number;
  name: string;
  content: string;
  sight: string;
  choice1: string;
  result1: string;
  possibility1: string;
  reward1: number;
  next1: number;
  choice2: string;
  result2: string;
  possibility2: string;
  reward2: number;
  next2: number;
}

interface CollectionItem {
  id: number;
  name: string;
  description: string;
  rarity: string;
  imageFile?: string;
}

// 事件数据
const events = ref<GameEvent[]>([]);
const eventsLoading = ref(true);

// 收集数据
const collections = ref<CollectionItem[]>([]);
const collectionsLoaded = ref(false);

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
const { playButtonSound, playCollectionSound } = useSound();

// 切换语言
const switchLanguage = async () => {
  playButtonSound();
  const targetLocale = locale.value === "zh" ? "en" : "zh";
  await navigateTo(localePath("/game", targetLocale));
};

// 获取当前语言显示名称
const currentLanguageName = computed(() => {
  return locale.value === "zh" ? "中文" : "EN";
});

// 游戏状态
const messages = ref<Message[]>([]);
const isTyping = ref(false);
const currentChoices = ref<Choice[]>([]);
const showChoices = ref(false);
const messageContainer = ref<HTMLElement>();
const gameStarted = ref(false);
const currentEvent = ref<GameEvent | null>(null);
const currentBackgroundSight = ref<string>("start");
const showEventImage = ref(false);

// 背景音乐控制
const bgMusic = ref<HTMLAudioElement | null>(null);
const currentBgmSight = ref<string>("");
const isMusicMuted = ref(false);
const musicVolume = ref(0.3); // 默认音量30%

// 收集弹窗状态
const collectionToast = ref({
  show: false,
  name: "",
  imageFile: "",
  cardId: 0,
});

// 行程回顾弹窗状态
const reviewModal = ref({
  show: false,
  content: "",
  isLoading: false,
  error: "",
  unlockedCards: [] as Array<{ id: number; name: string }>,
  copySuccess: false,
  copyMessage: "",
});

// 自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

// 监听选项显示状态，自动滚动
watch(showChoices, (newVal) => {
  if (newVal) {
    scrollToBottom();
  }
});

// 播放背景音乐
const playBgMusic = (sight: string) => {
  // 如果音乐已经在播放同一首，则不重复加载
  if (
    currentBgmSight.value === sight &&
    bgMusic.value &&
    !bgMusic.value.paused
  ) {
    return;
  }

  // 停止当前音乐
  if (bgMusic.value) {
    bgMusic.value.pause();
    bgMusic.value = null;
  }

  // 创建新的音频对象
  const audioPath = `/audio/bgm/${sight}.mp3`;
  bgMusic.value = new Audio(audioPath);
  bgMusic.value.loop = true;
  bgMusic.value.volume = isMusicMuted.value ? 0 : musicVolume.value;

  // 播放音乐
  bgMusic.value.play().catch((err) => {
    console.log("音乐播放失败:", err);
    // 某些浏览器需要用户交互后才能播放音频
  });

  currentBgmSight.value = sight;
};

// 切换静音
const toggleMusic = () => {
  playButtonSound();
  isMusicMuted.value = !isMusicMuted.value;
  if (bgMusic.value) {
    bgMusic.value.volume = isMusicMuted.value ? 0 : musicVolume.value;
  }
  // 保存设置到localStorage
  localStorage.setItem("gameMusicMuted", String(isMusicMuted.value));
};

// 监听背景切换，自动切换音乐
watch(currentBackgroundSight, (newSight) => {
  if (newSight) {
    playBgMusic(newSight);
  }
});

// 添加消息
const addMessage = async (
  message: Omit<Message, "id" | "timestamp">,
  delay = 1000
) => {
  isTyping.value = true;

  await new Promise((resolve) => setTimeout(resolve, delay));

  const newMessage: Message = {
    ...message,
    id: Date.now(),
    timestamp: new Date(),
  };

  messages.value.push(newMessage);
  isTyping.value = false;
  scrollToBottom();

  // 如果有选项，显示选项
  if (message.choices && message.choices.length > 0) {
    currentChoices.value = message.choices;
    showChoices.value = true;
  }
};

// 处理玩家选择
const handleChoice = async (choice: Choice) => {
  // 播放按钮音效
  playButtonSound();

  // 隐藏选项
  showChoices.value = false;
  currentChoices.value = [];

  // 如果是事件选择，直接执行action（action内部会处理计数和消息）
  if (currentEvent.value) {
    if (choice.action) {
      await choice.action();
    }
    return;
  }

  // 普通选择的处理
  // 老张对话不消耗体力

  // 添加玩家消息
  await addMessage(
    {
      type: "player",
      content: choice.description,
      speaker: t("story.characters.player"),
    },
    300
  );

  // 执行选项的动作
  if (choice.action) {
    choice.action();
  }
};

// 开始游戏序列
const startGameSequence = async () => {
  gameStarted.value = true;

  // 开始新游戏时恢复体力并清空历程
  gameStore.restoreStamina();
  gameStore.clearJourney();

  // 场景描述 - 开场动画
  await addMessage(
    {
      type: "scene",
      content: t("story.intro.scene"),
    },
    2000
  );

  // 标题文字
  await addMessage(
    {
      type: "narrator",
      content: t("story.intro.welcome"),
    },
    1000
  );

  // 场景转换
  await addMessage(
    {
      type: "scene",
      content: t("story.intro.sceneLabel"),
    },
    600
  );

  // 叙述
  await addMessage(
    {
      type: "narrator",
      content: t("story.intro.arrival1"),
    },
    1000
  );

  await addMessage(
    {
      type: "narrator",
      content: t("story.intro.arrival2"),
    },
    1000
  );

  await addMessage(
    {
      type: "narrator",
      content: t("story.intro.arrival3"),
    },
    1000
  );

  // 老张出场
  await addMessage(
    {
      type: "npc",
      speaker: t("story.characters.zhang"),
      content: t("story.npc.zhangIntro"),
      avatar: "👨‍🌾",
    },
    1000
  );

  await addMessage(
    {
      type: "narrator",
      content: t("story.npc.zhangIntro2"),
    },
    1000
  );

  // 给玩家一个选择：是否提及看到的白色巨兽
  await addMessage(
    {
      type: "choice",
      content: t("story.choices.firstMeeting"),
      choices: [
        {
          id: "mention_beast",
          label: t("story.choices.mentionBeast.label"),
          description: t("story.choices.mentionBeast.description"),
          action: async () => {
            // 玩家提及白色巨兽
            await addMessage(
              {
                type: "player",
                speaker: t("story.characters.player"),
                content: t("story.npc.zhangPoint"),
              },
              600
            );

            // 老张的反应描述
            await addMessage(
              {
                type: "narrator",
                content: t("story.npc.zhangReaction"),
              },
              1000
            );

            // 老张回答
            await addMessage(
              {
                type: "npc",
                speaker: t("story.characters.zhang"),
                content: t("story.npc.zhangPhilosophy"),
                avatar: "👨‍🌾",
              },
              1000
            );

            // 继续后续对话
            await continueAfterFirstChoice();
          },
        },
        {
          id: "stay_silent",
          label: t("story.choices.staySilent.label"),
          description: t("story.choices.staySilent.description"),
          action: async () => {
            // 玩家保持沉默
            await addMessage(
              {
                type: "narrator",
                content: t("story.choices.staySilent.narration"),
              },
              1000
            );

            // 继续后续对话
            await continueAfterFirstChoice();
          },
        },
      ],
    },
    1000
  );
};

// 第一个选择后的共同流程
const continueAfterFirstChoice = async () => {
  // 叙述
  await addMessage(
    {
      type: "narrator",
      content: t("story.npc.zhangEquipment"),
    },
    1000
  );

  await addMessage(
    {
      type: "narrator",
      content: t("story.npc.zhangRest"),
    },
    1000
  );

  await addMessage(
    {
      type: "narrator",
      content: t("story.npc.zhangAdvice"),
    },
    1000
  );

  // 第一个选择
  await addMessage(
    {
      type: "choice",
      content: t("story.choices.prompt"),
      choices: [
        {
          id: "A",
          label: t("story.choices.checkEquipment.label"),
          description: t("story.choices.checkEquipment.description"),
          action: async () => {
            console.log("选择了检查装备");

            // 添加后续对话
            await addMessage(
              {
                type: "narrator",
                content:
                  locale.value === "zh"
                    ? "你仔细检查了装备，一切准备就绪。是时候开始你的探索之旅了！"
                    : "You have carefully checked the equipment, everything is ready. Time to start your exploration journey!",
              },
              1000
            );

            // 跳转到事件10
            setTimeout(async () => {
              await showEvent(10);
            }, 2000);
          },
        },
        {
          id: "B",
          label: t("story.choices.askZhang.label"),
          description: t("story.choices.askZhang.description"),
          action: async () => {
            console.log("选择了请教老张");

            // 添加后续对话
            await addMessage(
              {
                type: "narrator",
                content:
                  locale.value === "zh"
                    ? "老张给了你一些有用的建议。带着他的指引，你踏上了探索之旅。"
                    : "Old Zhang gave you some useful advice. With his guidance, you embark on your exploration journey.",
              },
              1000
            );

            // 跳转到事件2
            setTimeout(async () => {
              await showEvent(2);
            }, 2000);
          },
        },
        {
          id: "C",
          label: t("story.choices.explore.label"),
          description: t("story.choices.explore.description"),
          action: async () => {
            console.log("选择了探索营地");

            // 添加后续对话
            await addMessage(
              {
                type: "narrator",
                content:
                  locale.value === "zh"
                    ? "你在营地附近转了转，熟悉了周围的环境。现在是时候开始真正的探索了！"
                    : "You walked around the camp and familiarized yourself with the surroundings. Now it's time to start the real exploration!",
              },
              1000
            );

            // 跳转到事件10
            setTimeout(async () => {
              await showEvent(10);
            }, 2000);
          },
        },
      ],
    },
    1500
  );
};

// API 响应类型
interface EventsResponse {
  success: boolean;
  data?: GameEvent[];
  error?: string;
}

// 加载收集数据
// 分享回顾
const shareReview = () => {
  playButtonSound();
  // 复制到剪贴板
  if (navigator.clipboard && reviewModal.value.content) {
    navigator.clipboard
      .writeText(reviewModal.value.content)
      .then(() => {
        // 显示成功提示
        reviewModal.value.copySuccess = true;
        reviewModal.value.copyMessage = t("game.reviewCopiedShort") || "已复制";

        // 1秒后自动隐藏提示
        setTimeout(() => {
          reviewModal.value.copySuccess = false;
          reviewModal.value.copyMessage = "";
        }, 1000);
      })
      .catch(() => {
        reviewModal.value.copySuccess = true;
        reviewModal.value.copyMessage =
          t("game.reviewCopyFailedShort") || "复制失败";

        // 1秒后自动隐藏提示
        setTimeout(() => {
          reviewModal.value.copySuccess = false;
          reviewModal.value.copyMessage = "";
        }, 1000);
      });
  }
};

// 生成行程回顾
const generateReview = async () => {
  reviewModal.value.isLoading = true;
  reviewModal.value.error = "";
  reviewModal.value.show = true;

  try {
    const journeyData = gameStore.getJourneyData();

    // 保存新解锁的卡片信息用于展示
    reviewModal.value.unlockedCards = journeyData.unlockedCardsInfo || [];

    interface ReviewResponse {
      success: boolean;
      review?: string;
    }

    // 只发送API需要的数据（不包含卡片ID信息）
    const response = await $fetch<ReviewResponse>("/api/generate-review", {
      method: "POST",
      body: {
        journeyLog: journeyData.journeyLog,
        unlockedGallery: journeyData.unlockedGallery,
      },
    });

    if (response.success && response.review) {
      reviewModal.value.content = response.review;
    } else {
      throw new Error("Failed to generate review");
    }
  } catch (error) {
    console.error("Error generating review:", error);
    reviewModal.value.error =
      t("game.reviewError") || "生成回顾时出现错误，请稍后重试。";
  } finally {
    reviewModal.value.isLoading = false;
  }
};

const loadCollections = async () => {
  if (collectionsLoaded.value) return;
  try {
    interface CollectionsResponse {
      success: boolean;
      data: CollectionItem[];
      error?: string;
    }
    const response = await $fetch<CollectionsResponse>("/api/collections");
    if (response.success) {
      collections.value = response.data;
      collectionsLoaded.value = true;
    }
  } catch (error) {
    console.error("Error fetching collections:", error);
  }
};

// 加载事件数据
const loadEvents = async () => {
  try {
    const response = await $fetch<EventsResponse>("/api/events");
    if (response.success && response.data) {
      events.value = response.data;
      eventsLoading.value = false;
    } else {
      console.error("Failed to load events:", response.error);
      eventsLoading.value = false;
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    eventsLoading.value = false;
  }
};

// 开始事件序列
// 游戏流程：老张对话 -> 选择ABC -> 跳转到事件id=2 -> 循环(选择->结果->继续/结束) -> 事件id=1结束
// 删除了不再使用的startEventSequence函数

// 显示事件
const showEvent = async (eventId: number) => {
  const event = events.value.find((e) => e.id === eventId);
  if (!event) {
    console.log("Event not found:", eventId);
    return;
  }

  currentEvent.value = event;

  // 根据事件切换背景
  if (event.sight && event.sight !== "0") {
    // 映射中文sight到文件名
    const sightMap: { [key: string]: string } = {
      河谷: "river",
      river: "river",
      forest: "forest",
      mountain: "mountain",
      start: "start",
    };
    currentBackgroundSight.value = sightMap[event.sight] || event.sight;
  }

  // 显示事件图片
  showEventImage.value = true;

  // 清空对话窗口
  messages.value = [];
  showChoices.value = false;

  // 显示事件标题
  await addMessage(
    {
      type: "event",
      speaker: event.name,
      content: event.content,
    },
    1000
  );

  // 特殊处理结束事件（事件1、13、14）
  const isEndingEvent = [1, 13, 14].includes(event.id);

  if (isEndingEvent) {
    // 生成并显示行程回顾
    await generateReview();
  } else if (event.choice1 && event.choice1 !== "0") {
    // 显示选项
    const choices: Choice[] = [];

    if (event.choice1 && event.choice1 !== "0") {
      choices.push({
        id: "choice1",
        label: event.choice1,
        description: event.choice1,
        action: async () => {
          await handleEventChoice(1);
        },
      });
    }

    if (event.choice2 && event.choice2 !== "0") {
      choices.push({
        id: "choice2",
        label: event.choice2,
        description: event.choice2,
        action: async () => {
          await handleEventChoice(2);
        },
      });
    }

    currentChoices.value = choices;
    showChoices.value = true;
  }
};

// 处理事件选择
const handleEventChoice = async (choiceNum: number) => {
  if (!currentEvent.value) return;

  showChoices.value = false;
  currentChoices.value = [];

  // 消耗体力（每次事件选择消耗1点体力）
  gameStore.consumeStamina();

  // 添加玩家选择消息
  const choice =
    choiceNum === 1 ? currentEvent.value.choice1 : currentEvent.value.choice2;
  await addMessage(
    {
      type: "player",
      speaker: "你",
      content: choice,
    },
    500
  );

  // 记录历程（事件内容和玩家选择）
  gameStore.addJourneyEvent(currentEvent.value.content, choice);

  // 获取选择结果
  const possibility =
    choiceNum === 1
      ? currentEvent.value.possibility1
      : currentEvent.value.possibility2;
  const reward =
    choiceNum === 1 ? currentEvent.value.reward1 : currentEvent.value.reward2;
  const result =
    choiceNum === 1 ? currentEvent.value.result1 : currentEvent.value.result2;
  const nextEventId =
    choiceNum === 1 ? currentEvent.value.next1 : currentEvent.value.next2;

  // 处理概率奖励
  const possibilityNum = parseInt(possibility.replace("%", ""));
  const randomNum = Math.random() * 100;

  if (reward && reward !== 0 && randomNum < possibilityNum) {
    // 查找卡片信息
    const collectionItem = collections.value.find((c) => c.id === reward);

    if (collectionItem) {
      // 获得卡片（传入名称用于历程记录）
      const isNewCollection = gameStore.addCard(reward, collectionItem.name);

      if (isNewCollection) {
        // 播放收集音效
        playCollectionSound();

        // 显示收集弹窗
        collectionToast.value = {
          show: true,
          name: collectionItem.name,
          imageFile: collectionItem.imageFile || "",
          cardId: reward,
        };

        // 3秒后自动隐藏
        setTimeout(() => {
          collectionToast.value.show = false;
        }, 3000);
      }
    }
  }

  // 显示结果消息
  if (result && result !== "0") {
    await addMessage(
      {
        type: "narrator",
        content: result,
      },
      1500
    );
  }

  // 显示继续探险的选择
  const adventureChoices: Choice[] = [];

  // 只有还有体力时才显示继续探险选项
  if (gameStore.hasStamina()) {
    adventureChoices.push({
      id: "continue",
      label: "继续探险",
      description: "继续前进",
      action: async () => {
        showChoices.value = false;
        if (nextEventId && nextEventId !== 0) {
          await showEvent(nextEventId);
        } else {
          // 如果没有下一个事件，跳转到结束
          await showEvent(1);
        }
      },
    });
  } else {
    // 体力耗尽时的特殊提示
    await addMessage(
      {
        type: "narrator",
        content: t("game.staminaExhausted"),
      },
      1000
    );
  }

  // 总是显示结束探险选项（放在继续探险下方）
  adventureChoices.push({
    id: "end",
    label: "结束探险",
    description: "结束今天的探险",
    action: async () => {
      showChoices.value = false;
      // 恢复体力
      gameStore.restoreStamina();
      await showEvent(1); // 跳转到事件1
    },
  });

  // 延迟显示选择
  setTimeout(() => {
    currentChoices.value = adventureChoices;
    showChoices.value = true;
  }, 1000);
};

// 组件挂载时自动开始
onMounted(async () => {
  // 加载音量设置
  const savedMuted = localStorage.getItem("gameMusicMuted");
  const savedVolume = localStorage.getItem("gameMusicVolume");

  if (savedMuted !== null) {
    isMusicMuted.value = savedMuted === "true";
  }

  if (savedVolume !== null) {
    musicVolume.value = parseFloat(savedVolume);
  }

  // 初始播放背景音乐
  playBgMusic(currentBackgroundSight.value);

  // 加载收集和事件数据
  await Promise.all([loadCollections(), loadEvents()]);

  // 延迟一秒后开始游戏序列
  setTimeout(() => {
    startGameSequence();
  }, 1000);
});

// 组件卸载时停止音乐
onUnmounted(() => {
  if (bgMusic.value) {
    bgMusic.value.pause();
    bgMusic.value = null;
  }
});
</script>

<template>
  <div class="game-container">
    <!-- 背景图片层 -->
    <Transition name="bg-transition">
      <div v-if="gameStarted" class="background-image-layer">
        <img
          v-if="currentBackgroundSight"
          :src="`/${currentBackgroundSight}.${
            currentBackgroundSight === 'start' ? 'jpg' : 'png'
          }`"
          alt="Game Background"
          class="game-bg-image"
        />
        <div class="background-overlay" />
      </div>
    </Transition>

    <!-- 事件图片（左侧） -->
    <Transition name="event-image">
      <div v-if="showEventImage && currentEvent" class="event-image-container">
        <img
          :src="`/events/${currentEvent.id}.png`"
          :alt="currentEvent.name"
          class="event-image"
        />
        <div class="event-name">{{ currentEvent.name }}</div>
      </div>
    </Transition>

    <!-- 游戏头部 -->
    <header class="game-header">
      <div class="header-content">
        <h1
          class="game-title"
          :title="$t('buttons.backToHome') || '返回主页'"
          @click="
            playButtonSound();
            navigateTo(localePath('/'));
          "
        >
          {{ $t("game.title") }}
          <i class="i-heroicons-home-20-solid home-icon" />
        </h1>

        <!-- 体力值显示（居中） -->
        <div class="stamina-display">
          <span class="stamina-label">{{ $t("game.stamina") }}</span>
          <div class="stamina-icons">
            <UIcon
              v-for="i in 5"
              :key="i"
              name="i-heroicons-heart-solid"
              :class="['stamina-icon', { depleted: i > gameStore.stamina }]"
            />
          </div>
        </div>

        <div class="header-actions">
          <button
            class="icon-btn"
            :title="$t('buttons.collection')"
            @click="
              playButtonSound();
              navigateTo(localePath('/collection'));
            "
          >
            <UIcon name="i-lucide-trophy" />
          </button>
          <button
            class="icon-btn"
            :title="$t('buttons.settings')"
            @click="playButtonSound()"
          >
            <UIcon name="i-lucide-settings" />
          </button>
          <button
            class="icon-btn music-toggle"
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
          <button
            class="lang-btn-small"
            :title="$t('language.switch')"
            @click="switchLanguage"
          >
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
          <p>{{ $t("game.loading") }}</p>
        </div>

        <!-- 消息列表 -->
        <TransitionGroup name="message">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message-wrapper', `message-${message.type}`]"
          >
            <!-- 场景描述 -->
            <div v-if="message.type === 'scene'" class="scene-message">
              <div v-if="message.image" class="scene-image-placeholder">
                <UIcon name="i-lucide-image" class="image-icon" />
                <span>{{
                  message.image === "placeholder_forest"
                    ? $t("story.images.forest")
                    : $t("story.images.cabin")
                }}</span>
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
            <div
              v-else-if="message.type === 'narrator'"
              class="narrator-message"
            >
              <p>{{ message.content }}</p>
            </div>

            <!-- NPC对话 -->
            <div v-else-if="message.type === 'npc'" class="npc-bubble">
              <div class="avatar">{{ message.avatar || "🌲" }}</div>
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
          <div
            v-if="showChoices && currentChoices.length > 0"
            class="choices-in-chat"
          >
            <div class="choices-container">
              <button
                v-for="choice in currentChoices"
                :key="choice.id"
                class="choice-bubble"
                @click="handleChoice(choice)"
              >
                <span class="choice-label">{{ choice.label }}</span>
                <span
                  v-if="
                    choice.description && choice.description !== choice.label
                  "
                  class="choice-desc"
                >
                  {{ choice.description }}
                </span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </main>
    <!-- 收集弹窗 -->
    <Transition name="slide-up">
      <div v-if="collectionToast.show" class="collection-toast">
        <div class="toast-content">
          <div class="toast-icon">
            <UIcon name="i-heroicons-trophy" />
          </div>
          <div class="toast-body">
            <CardMedia
              v-if="collectionToast.cardId"
              :card-id="collectionToast.cardId"
              :alt="collectionToast.name"
              media-class="toast-image"
            />
            <img
              v-else-if="collectionToast.imageFile"
              :src="collectionToast.imageFile"
              :alt="collectionToast.name"
              class="toast-image"
            />
            <div class="toast-text">
              <p class="toast-title">新收集！</p>
              <p class="toast-name">{{ collectionToast.name }}</p>
              <p class="toast-hint">已加入图鉴</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 行程回顾弹窗 -->
    <Transition name="modal-fade">
      <div v-if="reviewModal.show" class="review-modal-overlay">
        <div class="review-modal">
          <!-- 装饰性元素 -->
          <div class="review-decoration review-decoration-top" />
          <div class="review-decoration review-decoration-bottom" />

          <div class="review-header">
            <div class="review-header-icon">
              <UIcon name="i-heroicons-book-open" />
            </div>
            <h2 class="review-title">
              {{ $t("game.reviewTitle") || "探险回顾" }}
            </h2>
            <div class="review-subtitle">
              {{ $t("game.reviewSubtitle") || "你与森林的故事" }}
            </div>
          </div>

          <div class="review-body">
            <!-- 加载中 -->
            <div v-if="reviewModal.isLoading" class="review-loading">
              <div class="loading-animation">
                <div class="forest-loader">
                  <div class="tree tree-1" />
                  <div class="tree tree-2" />
                  <div class="tree tree-3" />
                </div>
              </div>
              <p class="loading-text">
                {{
                  $t("game.reviewGenerating") || "正在生成您的专属探险回顾..."
                }}
              </p>
              <div class="loading-progress">
                <div class="progress-bar" />
              </div>
            </div>

            <!-- 错误提示 -->
            <div v-else-if="reviewModal.error" class="review-error">
              <div class="error-icon-wrapper">
                <UIcon
                  name="i-heroicons-exclamation-triangle"
                  class="error-icon"
                />
              </div>
              <p class="error-message">{{ reviewModal.error }}</p>
              <button class="retry-button" @click="generateReview()">
                <UIcon name="i-heroicons-arrow-path" />
                重试
              </button>
            </div>

            <!-- 回顾内容 -->
            <div v-else class="review-content">
              <div class="content-wrapper">
                <p class="review-text">{{ reviewModal.content }}</p>
              </div>

              <!-- 新解锁的图鉴展示 -->
              <div
                v-if="
                  reviewModal.unlockedCards &&
                  reviewModal.unlockedCards.length > 0
                "
                class="unlocked-cards-section"
              >
                <div class="unlocked-cards-title">
                  <UIcon name="i-heroicons-sparkles" />
                  {{ $t("game.unlockedCards") || "本次收集的图鉴" }}
                </div>
                <div class="unlocked-cards-grid">
                  <div
                    v-for="card in reviewModal.unlockedCards"
                    :key="card.id"
                    class="unlocked-card-item"
                  >
                    <CardMedia
                      :card-id="card.id"
                      :alt="card.name"
                      media-class="unlocked-card-image"
                    />
                  </div>
                </div>
              </div>

              <!-- 哲理金句 -->
              <div class="wisdom-quote">
                <span class="quote-text">
                  {{
                    $t("game.wisdomQuote") ||
                    "所有选择都是正确的，只要你还记得为什么出发。"
                  }}
                </span>
              </div>
            </div>
          </div>

          <div class="review-footer">
            <div class="footer-decoration" />
            <button
              class="review-button primary"
              :disabled="reviewModal.isLoading"
              @click="
                playButtonSound();
                navigateTo(localePath('/'));
              "
            >
              <UIcon name="i-heroicons-home" />
              {{ $t("buttons.back") || "回到首页" }}
            </button>
            <div class="share-button-wrapper">
              <button
                v-if="
                  !reviewModal.isLoading &&
                  !reviewModal.error &&
                  reviewModal.content
                "
                class="review-button secondary"
                @click="shareReview()"
              >
                <UIcon name="i-heroicons-share" />
                {{ $t("buttons.share") || "分享" }}
              </button>
              <Transition name="copy-fade">
                <span v-if="reviewModal.copySuccess" class="copy-message">
                  {{ reviewModal.copyMessage }}
                </span>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </Transition>
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
  animation: bgFadeIn 2s ease-out, bgZoomIn 4s ease-out,
    bgParallax 30s ease-in-out infinite;
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
  0%,
  100% {
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

/* 体力值显示 */
.stamina-display {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 0.4rem 0.8rem;
}

.stamina-label {
  color: #fecaca;
  font-weight: 600;
  font-size: 0.95rem;
  margin-right: 0.25rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.stamina-icons {
  display: flex;
  gap: 0.2rem;
  align-items: center;
}

.stamina-icon {
  width: 1.2rem;
  height: 1.2rem;
  color: #ef4444;
  transition: all 0.3s ease;
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.5));
  animation: heartbeat 1.5s ease-in-out infinite;
}

.stamina-icon.depleted {
  color: #6b7280;
  filter: none;
  opacity: 0.3;
  animation: none;
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.5));
  }
  14% {
    transform: scale(1.1);
    filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.8));
  }
  28% {
    transform: scale(1);
    filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.5));
  }
  42% {
    transform: scale(1.1);
    filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.8));
  }
  70% {
    transform: scale(1);
    filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.5));
  }
}

.game-title {
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
  position: relative;
  text-shadow: 0 2px 4px rgba(34, 197, 94, 0.1);
  letter-spacing: 0.05em;
  user-select: none;
}

.game-title:hover {
  transform: translateY(-2px) scale(1.05);
  filter: brightness(1.2);
}

.game-title:active {
  transform: translateY(0) scale(0.98);
}

.game-title::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  transition: width 0.3s ease;
}

.game-title:hover::after {
  width: 100%;
}

.home-icon {
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 0.9em;
  opacity: 0.7;
  transition: all 0.3s ease;
  vertical-align: middle;
}

.game-title:hover .home-icon {
  opacity: 1;
  transform: translateX(3px);
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

/* 音量按钮样式 */
.music-toggle {
  transition: all 0.3s ease;
}

.music-toggle.muted {
  opacity: 0.6;
  background: rgba(255, 100, 100, 0.1);
  border-color: rgba(255, 100, 100, 0.3);
}

.music-toggle.muted:hover {
  background: rgba(255, 100, 100, 0.2);
  opacity: 1;
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

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

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

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}
.typing-dot:nth-child(3) {
  animation-delay: 0s;
}

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
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.08) 0%,
    rgba(74, 222, 128, 0.08) 100%
  );
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
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(74, 222, 128, 0.1) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.choice-bubble:hover::before {
  transform: translateX(100%);
}

.choice-bubble:hover {
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.25) 0%,
    rgba(74, 222, 128, 0.25) 100%
  );
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
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes typing {
  0%,
  80%,
  100% {
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
  left: 25%; /* 固定在屏幕左侧四分之一位置 */
  top: 50%;
  transform: translate(-50%, -50%); /* 同时水平和垂直居中 */
  z-index: 15;
  max-width: 600px; /* 放大图片 */
  width: 40vw; /* 调整宽度确保不超过左半屏 */
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
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.8),
    0 0 40px rgba(255, 255, 255, 0.6), 0 0 60px rgba(255, 255, 255, 0.4),
    2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.1em;
  position: relative;
}

/* 文字下方添加微妙的光晕效果 */
.event-name::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.6) 50%,
    transparent 100%
  );
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

/* 事件消息样式 */
.event-message {
  background: linear-gradient(
    135deg,
    rgba(251, 191, 36, 0.1) 0%,
    rgba(245, 158, 11, 0.1) 100%
  );
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin: 0.5rem auto; /* 居中显示 */
  width: 100%; /* 固定宽度 */
  max-width: 600px; /* 最大宽度限制 */
  min-width: 400px; /* 最小宽度限制 */
  box-sizing: border-box; /* 确保padding包含在宽度内 */
}

.event-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #f59e0b;
  justify-content: center; /* 标题居中 */
}

.event-icon {
  font-size: 1.25rem;
  flex-shrink: 0; /* 图标不缩小 */
}

.event-text {
  color: #fefefe;
  line-height: 1.6;
  text-align: center; /* 文字居中 */
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
  0%,
  100% {
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
    width: 90%; /* 移动端更宽 */
    min-width: auto; /* 移动端不设置最小宽度 */
    max-width: 100%; /* 移动端最大宽度100% */
    margin: 0.5rem auto;
  }

  .stamina-display {
    position: static;
    transform: none;
    margin: 0 auto;
    padding: 0.4rem 0.8rem;
    font-size: 0.875rem;
  }

  .stamina-icon {
    width: 1rem;
    height: 1rem;
  }

  .stamina-label {
    font-size: 0.85rem;
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

  .game-title::after {
    display: none; /* 移动端隐藏下划线动画 */
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

/* 收集弹窗 */
.collection-toast {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}

.toast-content {
  background: linear-gradient(
    135deg,
    rgba(30, 30, 40, 0.98) 0%,
    rgba(50, 50, 70, 0.95) 100%
  );
  border: 2px solid rgba(255, 215, 0, 0.6);
  border-radius: 20px;
  padding: 1rem 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 215, 0, 0.3),
    inset 0 0 20px rgba(255, 215, 0, 0.1);
  animation: collectionGlow 2s ease-in-out infinite;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 320px;
}

.toast-icon {
  font-size: 2.5rem;
  animation: bounce 1s ease-in-out infinite;
  color: #ffd700;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.6));
}

.toast-body {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toast-image {
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid rgba(255, 215, 0, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.toast-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toast-title {
  color: #ffd700;
  font-size: 0.9rem;
  font-weight: bold;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.toast-name {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.toast-hint {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin: 0;
}

/* 弹窗动画 */
.slide-up-enter-active {
  animation: slideUp 0.5s ease-out;
}

.slide-up-leave-active {
  animation: slideDown 0.5s ease-in;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(100px);
  }
}

@keyframes collectionGlow {
  0%,
  100% {
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 215, 0, 0.3),
      inset 0 0 20px rgba(255, 215, 0, 0.1);
  }
  50% {
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 80px rgba(255, 215, 0, 0.5),
      inset 0 0 30px rgba(255, 215, 0, 0.2);
  }
}

/* 行程回顾弹窗样式 */
.review-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(34, 197, 94, 0.1),
    rgba(0, 0, 0, 0.8)
  );
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  animation: overlayFadeIn 0.4s ease-out;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}

.review-modal {
  position: relative;
  background: linear-gradient(145deg, #ffffff 0%, #f0fdf4 50%, #dcfce7 100%);
  border-radius: 24px;
  max-width: 700px;
  width: 92%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.1),
    0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 0 80px rgba(34, 197, 94, 0.2);
  animation: modalBounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  overflow: hidden;
}

@keyframes modalBounceIn {
  0% {
    transform: scale(0.8) translateY(50px);
    opacity: 0;
  }
  50% {
    transform: scale(1.02) translateY(-5px);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* 装饰性元素 */
.review-decoration {
  position: absolute;
  pointer-events: none;
  opacity: 0.1;
}

.review-decoration-top {
  top: 0;
  left: 0;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, #22c55e 0%, transparent 70%);
  animation: floatDecoration 8s ease-in-out infinite;
}

.review-decoration-bottom {
  bottom: 0;
  right: 0;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, #4ade80 0%, transparent 70%);
  animation: floatDecoration 8s ease-in-out infinite reverse;
}

@keyframes floatDecoration {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-20px, -20px) scale(1.1);
  }
}

.review-header {
  padding: 2.5rem 2rem 1.5rem;
  text-align: center;
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.5) 100%
  );
}

.review-header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  border-radius: 50%;
  margin-bottom: 1rem;
  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);
  animation: iconPulse 2s ease-in-out infinite;
  color: white;
  font-size: 1.5rem;
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
  }
}

.review-title {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.5px;
}

.review-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  font-style: italic;
  margin-top: 0.25rem;
}

.review-body {
  flex: 1;
  padding: 1.5rem 2rem;
  overflow-y: auto;
  min-height: 200px;
  position: relative;
}

/* 自定义滚动条 */
.review-body::-webkit-scrollbar {
  width: 8px;
}

.review-body::-webkit-scrollbar-track {
  background: rgba(34, 197, 94, 0.05);
  border-radius: 4px;
}

.review-body::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  border-radius: 4px;
}

.review-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

/* 加载状态 */
.review-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 3rem;
  min-height: 300px;
}

.loading-animation {
  position: relative;
  width: 120px;
  height: 80px;
}

.forest-loader {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 15px;
  height: 100%;
}

.tree {
  width: 20px;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  border-radius: 10px 10px 0 0;
  animation: treeGrow 1.5s ease-in-out infinite;
}

.tree-1 {
  height: 40px;
  animation-delay: 0s;
}

.tree-2 {
  height: 60px;
  animation-delay: 0.2s;
}

.tree-3 {
  height: 45px;
  animation-delay: 0.4s;
}

@keyframes treeGrow {
  0%,
  100% {
    transform: scaleY(1);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1.3);
    opacity: 1;
  }
}

.loading-text {
  color: #6b7280;
  font-size: 1rem;
  text-align: center;
  animation: fadeInOut 2s ease-in-out infinite;
}

@keyframes fadeInOut {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.loading-progress {
  width: 200px;
  height: 4px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
  width: 30%;
  border-radius: 2px;
  animation: progressMove 2s ease-in-out infinite;
}

@keyframes progressMove {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}

/* 错误状态 */
.review-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 3rem;
  min-height: 300px;
}

.error-icon-wrapper {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fecaca 0%, #ef4444 100%);
  border-radius: 50%;
  animation: errorShake 0.5s ease-in-out;
}

@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

.error-icon {
  font-size: 2.5rem;
  color: white;
}

.error-message {
  color: #ef4444;
  font-size: 1rem;
  text-align: center;
  max-width: 80%;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #991b1b;
  border: 1px solid #ef4444;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: linear-gradient(135deg, #fca5a5 0%, #ef4444 100%);
  color: white;
  transform: scale(1.05);
}

/* 回顾内容 */
.review-content {
  animation: contentFadeIn 0.8s ease-out;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.content-wrapper {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
}

.review-text {
  font-size: 1.05rem;
  color: #374151;
  white-space: pre-wrap;
  line-height: 1.9;
  margin: 0;
  text-align: justify;
  letter-spacing: 0.3px;
}

/* 新解锁的图鉴展示 */
.unlocked-cards-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(34, 197, 94, 0.15);
}

.unlocked-cards-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #22c55e;
  margin-bottom: 1.2rem;
  text-align: center;
  justify-content: center;
  text-shadow: 0 2px 4px rgba(34, 197, 94, 0.1);
}

.unlocked-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2rem;
  padding: 0.5rem;
  max-width: 100%;
  justify-items: center;
}

.unlocked-card-item {
  display: block;
  animation: cardFadeIn 0.6s ease-out;
  animation-fill-mode: both;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.unlocked-card-item:hover {
  transform: translateY(-3px);
}

.unlocked-card-item:nth-child(1) {
  animation-delay: 0.1s;
}
.unlocked-card-item:nth-child(2) {
  animation-delay: 0.15s;
}
.unlocked-card-item:nth-child(3) {
  animation-delay: 0.2s;
}
.unlocked-card-item:nth-child(4) {
  animation-delay: 0.25s;
}
.unlocked-card-item:nth-child(5) {
  animation-delay: 0.3s;
}
.unlocked-card-item:nth-child(6) {
  animation-delay: 0.35s;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.unlocked-card-image {
  width: 100%;
  max-width: 120px;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%);
  border: 2px solid rgba(34, 197, 94, 0.2);
  display: block;
}

.unlocked-card-item:hover .unlocked-card-image {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(34, 197, 94, 0.3);
  border-color: rgba(34, 197, 94, 0.5);
}

/* 哲理金句 */
.wisdom-quote {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  text-align: center;
  position: relative;
}

.wisdom-quote::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 200, 0.3) 20%,
    rgba(255, 255, 200, 0.5) 50%,
    rgba(255, 255, 200, 0.3) 80%,
    transparent 100%
  );
}

.quote-text {
  font-size: 1.15rem;
  font-weight: 700;
  color: #8b8b13;
  text-shadow: 0 0 20px rgba(255, 255, 0, 0.9), 0 0 40px rgba(255, 255, 0, 0.6),
    0 0 60px rgba(255, 255, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.08em;
  line-height: 1.6;
  display: inline-block;
  position: relative;
  animation: glowPulse 3s ease-in-out infinite;
  padding: 0.5rem 1rem;
}

@keyframes glowPulse {
  0%,
  100% {
    filter: brightness(1) drop-shadow(0 0 15px rgba(255, 255, 0, 0.6));
  }
  50% {
    filter: brightness(1.1) drop-shadow(0 0 25px rgba(255, 255, 0, 0.8));
  }
}

/* 页脚 */
.review-footer {
  position: relative;
  padding: 1.5rem 2rem 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
}

.share-button-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.copy-message {
  font-size: 0.85rem;
  color: #22c55e;
  white-space: nowrap;
  animation: fadeInOut 1s ease-in-out;
  position: absolute;
  left: calc(100% + 0.75rem);
  top: 50%;
  transform: translateY(-50%);
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

/* 复制消息动画 */
.copy-fade-enter-active {
  transition: all 0.2s ease-out;
}

.copy-fade-leave-active {
  transition: all 0.2s ease-in;
}

.copy-fade-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(-10px);
}

.copy-fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(10px);
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
  }
  20%,
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.footer-decoration {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    #22c55e 50%,
    transparent 100%
  );
  opacity: 0.3;
}

.review-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.8rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.review-button.primary {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.25);
}

.review-button.primary:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.35);
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.review-button.secondary {
  background: rgba(255, 255, 255, 0.9);
  color: #22c55e;
  border: 2px solid rgba(34, 197, 94, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.review-button.secondary:hover {
  background: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
  transform: translateY(-1px);
}

.review-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 弹窗动画 */
.modal-fade-enter-active {
  transition: all 0.4s ease-out;
}

.modal-fade-leave-active {
  transition: all 0.3s ease-in;
}

.modal-fade-enter-from {
  opacity: 0;
}

.modal-fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .review-modal {
    width: 95%;
    max-height: 90vh;
    border-radius: 16px;
  }

  .review-header {
    padding: 2rem 1.5rem 1rem;
  }

  .review-title {
    font-size: 1.5rem;
  }

  .review-subtitle {
    font-size: 0.85rem;
  }

  .review-body {
    padding: 1rem 1.5rem;
  }

  .review-text {
    font-size: 0.95rem;
    line-height: 1.7;
  }

  .review-footer {
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem 1.5rem 1.5rem;
  }

  .review-button {
    width: 100%;
    justify-content: center;
  }

  .share-button-wrapper {
    width: 100%;
    position: relative;
  }

  .share-button-wrapper .review-button {
    width: 100%;
  }

  .copy-message {
    position: fixed;
    left: 50%;
    top: auto;
    bottom: 100px;
    transform: translateX(-50%);
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
  }

  .copy-fade-enter-from {
    transform: translateX(-50%) translateY(10px);
  }

  .copy-fade-leave-to {
    transform: translateX(-50%) translateY(-10px);
  }

  .review-decoration-top {
    width: 150px;
    height: 150px;
  }

  .review-decoration-bottom {
    width: 180px;
    height: 180px;
  }

  .forest-loader {
    gap: 10px;
  }

  .tree {
    width: 16px;
  }

  .tree-1 {
    height: 30px;
  }

  .tree-2 {
    height: 45px;
  }

  .tree-3 {
    height: 35px;
  }

  .loading-text {
    font-size: 0.9rem;
  }

  .error-message {
    font-size: 0.9rem;
  }

  /* 图鉴展示响应式 */
  .unlocked-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0.25rem;
  }

  .unlocked-cards-title {
    font-size: 1rem;
  }

  .unlocked-card-image {
    max-width: 100px;
    border-radius: 6px;
  }

  .unlocked-cards-section {
    margin-top: 1.5rem;
    padding-top: 1rem;
  }

  .wisdom-quote {
    margin-top: 1.5rem;
    padding-top: 1rem;
  }

  .wisdom-quote::before {
    width: 80%;
  }

  .quote-text {
    font-size: 0.95rem;
    padding: 0 1rem;
  }
}
</style>
