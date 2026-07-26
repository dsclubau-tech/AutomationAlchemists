interface ChromeStorageArea {
  get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

interface ChromeStorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

interface ChromeRuntimeSender {
  tab?: {
    id?: number;
    url?: string;
  };
}

interface ChromeRuntimeApi {
  id?: string;
  sendMessage<T = unknown>(message: unknown): Promise<T>;
  onMessage: {
    addListener(
      callback: (
        message: unknown,
        sender: ChromeRuntimeSender,
        sendResponse: (response?: unknown) => void,
      ) => boolean | void,
    ): void;
  };
  onInstalled: {
    addListener(callback: () => void): void;
  };
}

interface ChromeExtensionApi {
  runtime: ChromeRuntimeApi;
  storage: {
    local: ChromeStorageArea;
    session?: ChromeStorageArea;
    onChanged: {
      addListener(
        callback: (changes: Record<string, ChromeStorageChange>, areaName: "local" | "session" | "sync" | "managed") => void,
      ): void;
    };
  };
}

declare const chrome: ChromeExtensionApi;
