import { FrontendConfig } from '../common/types';

export {};

declare global {
  interface Window {
    METAGRID: FrontendConfig;
    dataLayer: [...args: Gtag.GtagCommands[]];
    gtag: Gtag.Gtag;
  }
}
