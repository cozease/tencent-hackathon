// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: "%s",
      title: "绿野寻踪",
    },
  },
  runtimeConfig: {
    openaiBaseUrl:
      process.env.NUXT_OPENAI_BASE_URL || "https://api.deepseek.com",
    openaiApiKey: process.env.NUXT_OPENAI_API_KEY || "",
    openaiModel: process.env.NUXT_OPENAI_MODEL || "deepseek-chat",
    public: {
      // Public runtime config
    },
  },
  devtools: { enabled: true },

  modules: ["@nuxt/ui", "@nuxt/eslint", "@nuxtjs/i18n", "@pinia/nuxt"],

  css: ["~/assets/css/main.css"],

  compatibilityDate: "2025-07-16",

  // 禁用 Google Fonts provider，避免连接超时
  fonts: {
    providers: {
      google: false,
      googleicons: false,
    },
  },

  // 禁用 @nuxt/ui 的图标下载
  ui: {
    icons: {
      dynamic: false,
    },
  },

  // i18n 配置
  i18n: {
    langDir: "locales/",
    locales: [
      {
        code: "zh",
        name: "中文",
        file: "zh.json",
      },
      {
        code: "en",
        name: "English",
        file: "en.json",
      },
    ],
    defaultLocale: "zh",
    lazy: true,
    strategy: "prefix_and_default",
    // detectBrowserLanguage: {
    //   useCookie: true,
    //   cookieKey: 'i18n_redirected',
    //   redirectOn: 'root'
    // }
  },
});
