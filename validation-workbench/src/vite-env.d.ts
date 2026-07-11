/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STAGING_API_URL: string;
  readonly VITE_STAGING_API_TOKEN: string;
  readonly VITE_STAGING_REGION: string;
  readonly VITE_STAGING_WEBHOOK_QUEUE_URL: string;
  readonly VITE_STAGING_WEBHOOK_DLQ_URL: string;
  readonly VITE_STAGING_ENVIRONMENT: string;
  readonly VITE_LOCAL_API_URL: string;
  readonly VITE_LOCAL_API_TOKEN: string;
  readonly VITE_LOCAL_WEBHOOK_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
