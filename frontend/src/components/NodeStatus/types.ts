type NodeEpochTimestamp = number;
type NodeIsOnline = string;

export type RawSingleNodeStatus = {
  metric: {
    __name__: string;
    instance: string;
    job: string;
    target: string;
  };
  value: [NodeEpochTimestamp, NodeIsOnline];
};

export type RawNodeStatus = {
  status: string;
  data: {
    resultType: string;
    result: RawSingleNodeStatus[];
  };
};

export type NodeStatusElement = {
  name: string;
  source: string;
  timestamp: string;
  isOnline: boolean;
};

export type NodeStatusArray = NodeStatusElement[];
