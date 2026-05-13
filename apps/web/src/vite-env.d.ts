/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AI_SERVICE_URL?: string;
  readonly VITE_ANALYTICS_ENABLED?: string;
  readonly VITE_ANALYTICS_DEBUG?: string;
  readonly VITE_ANALYTICS_ENDPOINT?: string;
  readonly VITE_ANALYTICS_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
