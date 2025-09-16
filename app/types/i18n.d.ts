// i18n 类型声明
declare module '#app' {
  interface NuxtApp {
    $t: (key: string, values?: any) => string
  }
}

declare global {
  const useI18n: () => {
    locale: Ref<string>
    locales: Ref<Array<any>>
    t: (key: string, values?: any) => string
  }
  const useLocalePath: () => (path: string, locale?: string) => string
  const navigateTo: (path: string | object, options?: any) => Promise<void>
  const computed: typeof import('vue')['computed']
}

export {}
