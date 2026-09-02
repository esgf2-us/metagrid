/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FEDERATED_NODES_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
