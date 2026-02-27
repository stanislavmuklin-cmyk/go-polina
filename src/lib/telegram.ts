declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
          auth_date?: number;
          hash?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        colorScheme: "light" | "dark";
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
      };
    };
  }
}

export function isTelegramMiniApp(): boolean {
  return !!(window.Telegram?.WebApp?.initData);
}

export function getTelegramInitData(): string | null {
  return window.Telegram?.WebApp?.initData || null;
}

export function getTelegramUser() {
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

export function initTelegramWebApp() {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }
}
