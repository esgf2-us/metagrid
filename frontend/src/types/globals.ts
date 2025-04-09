import { FrontendConfig } from '../common/types';

export {};

declare global {
  interface Window {
    METAGRID: FrontendConfig;
  }
}
