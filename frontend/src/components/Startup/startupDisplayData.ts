export type StartPopupData = {
  latestVersion: string;
  displayData: { [version: string]: { props: unknown } };
};

export default {
  latestVersion: 'v1.0.8-beta',
  displayData: {
    'v1.0.8-beta': {
      props: {
        changeList: ['Did this thing.', 'Did that thing.', 'Also this thing'],
      },
    },
    'v1.0.7-beta': {
      props: { changeList: [] },
    },
    welcome: {
      props: {
        welcomeMessage:
          "If you wish to become familiar with Metagrid's search and download features, we recommend checking out the interface tours below: You can always access these tours, as well as Metagrid related support and documentation, by clicking on the 'help' button in the top-right or clicking the blue question mark icon in the lower-right corner.",
      },
    },
  },
};
