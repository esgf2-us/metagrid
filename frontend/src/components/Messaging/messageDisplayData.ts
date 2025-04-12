import { StartPopupData, MessageTemplates, MessageData, MessageJSON } from './types';
import messageData from '../../../messageData.json';

export const messageDataJSON: MessageJSON = messageData;

export const changeLogMessages = (): MessageData[] =>
  messageDataJSON.changelogVersions.map((versionId) => ({
    messageId: versionId,
    fileName: `changelog/${versionId}.md`,
    template: MessageTemplates.ChangeLog,
    data: {
      style: { minWidth: '700px' },
      changesFile: `changelog/${versionId}.md`,
      version: versionId,
    },
  }));

const welcomeMessage: MessageData = {
  messageId: 'welcome',
  fileName: '',
  template: MessageTemplates.Welcome,
  data: {
    welcomeMessage:
      "If you wish to become familiar with Metagrid's search, download and transfer features, we recommend checking out the interface tours below:",
  },
};

/* istanbul ignore next */
const startupMessages: StartPopupData = {
  messageToShow: (messageDataJSON.changelogVersions.at(0) as string) || '', // Version in footer
  defaultMessageId: 'welcome',
  messageData: [welcomeMessage, ...changeLogMessages()],
};

export default startupMessages;
