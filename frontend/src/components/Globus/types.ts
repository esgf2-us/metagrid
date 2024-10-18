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

export interface GlobusEndpointSearchResults {
  data: GlobusEndpoint[];
  status: number;
  statusText: string;
  headers: object;
  config: object;
}

export interface GlobusEndpoint {
  canonical_name: string;
  contact_email: string;
  display_name: string;
  entity_type: string;
  id: string;
  owner_id: string;
  owner_string: string;
  path: string | null;
  subscription_id: string;
}

export type GlobusTaskItem = {
  taskId: string;
  submitDate: string;
  taskStatusURL: string;
};
