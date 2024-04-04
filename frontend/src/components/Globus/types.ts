import ITokenResponse from 'js-pkce/dist/ITokenResponse';

export const MAX_TASK_LIST_LENGTH = 10;

export interface GlobusTokenResponse extends ITokenResponse {
  id_token: string;
  resource_server: string;
  other_tokens: unknown;
  created_on: number;
  expires_in: number;
  error?: unknown;
}

export type GlobusEndpointData = {
  endpoint: string | null;
  label: string | null;
  path: string | null;
  globfs: string | null;
  endpointId?: string | null;
};

export type GlobusEndpointSearch = {
  display_name: string | null;
  id: string | null;
};

export type GlobusEndpointSearchArray = GlobusEndpointSearch[];

export type GlobusTaskItem = {
  taskId: string;
  submitDate: string;
  taskStatusURL: string;
};

export type GlobusEndpoint = {
  contact_email: string;
  entity_type: string;
  label: string; // display_name
  key: string; // id
  subscription_id: string;
};
