export enum MessageTemplates {
  Welcome,
  ChangeLog,
  Notice,
}

export type ChangeLogData = {
  changeList: string[];
  intro: string;
  version: string;
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
  template: MessageTemplates;
  data: ValidTemplateData;
};

export type StartPopupData = {
  messageToShow: string;
  defaultMessageId: string;
  messageData: MessageData[];
};
