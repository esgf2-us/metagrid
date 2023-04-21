import { StartPopupData, MessageTemplates, MarkdownMessage } from './types';

export const markdownMessages: MarkdownMessage[] = [
  { title: 'Important Messages', fileName: 'messages/metagrid_messages.md' },
  { title: 'Test Message', fileName: 'messages/test_message.md' },
];

const startupMessages: StartPopupData = {
  messageToShow: 'v1.0.8-beta',
  defaultMessageId: 'welcome',
  messageData: [
    {
      messageId: 'v1.0.8-beta',
      template: MessageTemplates.ChangeLog,
      data: {
        changeList: [
          'Added new notification drawer on the right which provides admins a way to communicate with users information relevant to Metagrid. Markdown docs can be displayed and content modified at run-time will be shown.',
          'Created new Welcome dialog for first time users which includes buttons to start feature tours or view latest changes.',
          'Created Change Log dialog that allows users to see details about latest update',
          'Refactored the Joyride tours to improve ease and reliability of future updates',
          'Updated test suite to handle latest major package updates and modifications',
          'Migrated to the react-router-dom major version 6',
          'Upgraded to Django 4.1.7 and upgraded various backend dependencies',
          'Added support for backend url settings ',
          'Updated various minor frontend dependencies',
        ],
        intro: '',
        version: '1.0.8 Beta',
      },
    },
    {
      messageId: 'v1.0.7-beta',
      template: MessageTemplates.ChangeLog,
      data: {
        changeList: [
          'Added expand/collapse button for the search facets',
          'Updated deployement configuration implementation',
          'Fixed wget download issues with multiple dataset results',
          'Various package updates and some other minor bug fixes.',
        ],
        intro: '',
        version: '1.0.7 Beta',
      },
    },
    {
      messageId: 'welcome',
      template: MessageTemplates.Welcome,
      data: {
        welcomeMessage:
          "If you wish to become familiar with Metagrid's search and download features, we recommend checking out the interface tours below:",
      },
    },
  ],
};

export default startupMessages;
