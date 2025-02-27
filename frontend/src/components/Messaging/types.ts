import { CSSProperties } from 'react';

export enum MessageTemplates {
  Welcome,
  ChangeLog,
  Notice,
}

export type ChangeLogData = {
  version: string;
  changesFile: string;
};

export type WelcomeData = {
  welcomeMessage: string;
};

export type MessageActions = {
  close: () => void;
  viewChanges: () => void;
};

export type ValidTemplateData = ChangeLogData | WelcomeData;

export type TemplateProps = {
  templateData: ValidTemplateData;
  templateActions: MessageActions;
};

export type MessageData = {
  messageId: string;
  fileName: string;
  template: MessageTemplates;
  data: ValidTemplateData;
  style?: CSSProperties;
};

export type StartPopupData = {
  messageToShow: string;
  defaultMessageId: string;
  messageData: MessageData[];
};

export type MessageJSON = {
  changelogVersions: string[];
  messages: {
    title: string;
    fileName: string;
  }[];
};
