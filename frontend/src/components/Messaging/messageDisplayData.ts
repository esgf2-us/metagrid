import { StartPopupData, MessageTemplates, MarkdownMessage } from './types';

export const rightDrawerMessages: MarkdownMessage[] = [
  { title: 'Messages', fileName: 'messages/metagrid_messages.md' },
];

export const rightDrawerChanges: MarkdownMessage[] = [
  { title: 'V1.1.2-rc', fileName: 'changelog/v1.1.2-rc.md' },
  { title: 'V1.1.1-pre', fileName: 'changelog/v1.1.1-pre.md' },
  { title: 'V1.1.0', fileName: 'changelog/v1.1.0.md' },
  { title: 'V1.0.10', fileName: 'changelog/v1.0.10-beta.md' },
  { title: 'V1.0.9', fileName: 'changelog/v1.0.9-beta.md' },
  { title: 'V1.0.8', fileName: 'changelog/v1.0.8-beta.md' },
  { title: 'V1.0.7', fileName: 'changelog/v1.0.7-beta.md' },
];

const startupMessages: StartPopupData = {
  messageToShow: 'v1.1.2-rc',
  defaultMessageId: 'welcome',
  messageData: [
    {
      messageId: 'v1.1.2-rc',
      template: MessageTemplates.ChangeLog,
      style: { minWidth: '700px' },
      data: {
        changesFile: 'changelog/v1.1.2-rc.md',
        version: '1.1.2-rc',
      },
    },
    {
      messageId: 'v1.1.1-pre',
      template: MessageTemplates.ChangeLog,
      style: { minWidth: '700px' },
      data: {
        changesFile: 'changelog/v1.1.1-pre.md',
        version: '1.1.1-pre',
      },
    },
    {
      messageId: 'v1.1.0',
      template: MessageTemplates.ChangeLog,
      style: { minWidth: '700px' },
      data: {
        changesFile: 'changelog/v1.1.0.md',
        version: '1.1.0',
      },
    },
    {
      messageId: 'v1.0.10-beta',
      template: MessageTemplates.ChangeLog,
      style: { minWidth: '700px' },
      data: {
        changesFile: 'changelog/v1.0.10-beta.md',
        version: '1.0.10 Beta',
      },
    },
    {
      messageId: 'v1.0.9-beta',
      template: MessageTemplates.ChangeLog,
      style: { minWidth: '700px' },
      data: {
        changesFile: 'changelog/v1.0.9-beta.md',
        version: '1.0.9 Beta',
      },
    },
    {
      messageId: 'v1.0.8-beta',
      template: MessageTemplates.ChangeLog,
      style: { minWidth: '700px' },
      data: {
        changesFile: 'changelog/v1.0.8-beta.md',
        version: '1.0.8 Beta',
      },
    },
    {
      messageId: 'v1.0.7-beta',
      template: MessageTemplates.ChangeLog,
      data: {
        changesFile: 'changelog/v1.0.7-beta.md',
        version: '1.0.7 Beta',
      },
    },
    {
      messageId: 'welcome',
      template: MessageTemplates.Welcome,
      data: {
        welcomeMessage:
          "If you wish to become familiar with Metagrid's search, download and transfer features, we recommend checking out the interface tours below:",
      },
    },
  ],
};

export default startupMessages;
