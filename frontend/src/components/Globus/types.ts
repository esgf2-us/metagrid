export type RawEndpoint = {
  id: string;
  display_name: string;
  organization: string;
  username: string;
  description: string;
  /* public: boolean;
  isGlobusConnect: boolean;
  globusConnectSetupKey: string;
  activated: boolean;
  expiresIn: number;
  expireTime: string;
  shareable: boolean;
  servers: [
    {
      hostname: string;
      uri: string;
      port: number;
      id: number;
      subject: string;
    }
  ];*/
};

export type RawEndpointList = {
  offset: number;
  limit: number;
  has_next_page: boolean;
  DATA: RawEndpoint[];
};
