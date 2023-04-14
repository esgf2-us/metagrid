export enum MessageTemplates {
  Welcome,
  ChangeLog,
  Notice,
}

export type ChangeLogProps = {
  changeList: string[];
  intro: string;
  version: string;
};

export type WelcomeProps = {
  welcomeMessage: string;
};

export type ValidTemplateProps = ChangeLogProps | WelcomeProps;

export type TemplateProps = {
  templateProps: ValidTemplateProps;
};

export type MessageData = {
  messageId: string;
  template: MessageTemplates;
  props: ValidTemplateProps;
};

export type StartPopupData = {
  messageToShow: string;
  defaultMessageId: string;
  messageData: MessageData[];
};
