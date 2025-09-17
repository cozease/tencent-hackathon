import { ref } from "vue";

export const useSound = () => {
  // 音效实例
  const buttonSound = ref<HTMLAudioElement | null>(null);
  const collectionSound = ref<HTMLAudioElement | null>(null);

  // 初始化音效
  const initSounds = () => {
    if (typeof window !== "undefined") {
      // 按钮音效
      buttonSound.value = new Audio("/audio/sfx/button.mp3");
      if (buttonSound.value) {
        buttonSound.value.volume = 0.3;
        buttonSound.value.preload = "auto";
      }

      // 收集音效
      collectionSound.value = new Audio("/audio/sfx/collections.mp3");
      if (collectionSound.value) {
        collectionSound.value.volume = 0.4;
        collectionSound.value.preload = "auto";
      }
    }
  };

  // 播放按钮音效
  const playButtonSound = () => {
    if (!buttonSound.value) {
      initSounds();
    }

    if (buttonSound.value) {
      // 重置音频位置以支持快速连续点击
      buttonSound.value.currentTime = 0;
      buttonSound.value.play().catch(() => {
        // 忽略自动播放限制错误
      });
    }
  };

  // 播放收集音效
  const playCollectionSound = () => {
    if (!collectionSound.value) {
      initSounds();
    }

    if (collectionSound.value) {
      collectionSound.value.currentTime = 0;
      collectionSound.value.play().catch(() => {
        // 忽略自动播放限制错误
      });
    }
  };

  // 初始化
  if (typeof window !== "undefined") {
    initSounds();
  }

  return {
    playButtonSound,
    playCollectionSound,
  };
};
