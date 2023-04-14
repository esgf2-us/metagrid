import { StartPopupData, MessageTemplates } from './types';

const startupMessages: StartPopupData = {
  messageToShow: 'v1.0.9-beta',
  defaultMessageId: 'welcome',
  messageData: [
    {
      messageId: 'v1.0.9-beta',
      template: MessageTemplates.ChangeLog,
      props: {
        changeList: [
          'Did this new thing.',
          'Did that thing.',
          'Also this thing',
          'Did this new thing.',
          'Did that thing.',
          'Also this thing',
          'Did this new thing.',
          'Did that thing.',
          'Also this thing',
          'Did this new thing.',
          'Did that thing.',
          'Also this thing',
        ],
        intro:
          'This update includes ways to provide more information to users.',
        version: '1.0.9 Beta',
      },
    },
    {
      messageId: 'v1.0.8-beta',
      template: MessageTemplates.ChangeLog,
      props: {
        changeList: ['Did this thing.', 'Did that thing.', 'Also this thing'],
        intro: '',
        version: '1.0.8 Beta',
      },
    },
    {
      messageId: 'v1.0.7-beta',
      template: MessageTemplates.ChangeLog,
      props: {
        changeList: ['Did this thing.', 'Did that thing.', 'Also this thing'],
        intro: '',
        version: '1.0.7 Beta',
      },
    },
    {
      messageId: 'welcome',
      template: MessageTemplates.Welcome,
      props: {
        welcomeMessage:
          "If you wish to become familiar with Metagrid's search and download features, we recommend checking out the interface tours below:",
      },
    },
  ],
};

export default startupMessages;
