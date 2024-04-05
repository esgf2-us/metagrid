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

export interface GlobusEndpoint {
  canonical_name: string;
  contact_email: string;
  display_name: string;
  entity_type: string;
  id: string;
  owner_id: string;
  owner_string: string;
  subscription_id: string;
}

export type SavedEndpoint = {
  contact_email: string;
  entity_type: string;
  label: string; // display_name
  key: string; // id
  subscription_id: string;
  path: string;
};

export interface GlobusEndpointSearchResults {
  data: GlobusEndpoint[];
  status: number;
  statusText: string;
  headers: object;
  config: object;
}

export type GlobusEndpointData = {
  endpoint: string | null;
  label: string | null;
  path: string | null;
  globfs: string | null;
  endpointId?: string | null;
};

export type GlobusTaskItem = {
  taskId: string;
  submitDate: string;
  taskStatusURL: string;
};
