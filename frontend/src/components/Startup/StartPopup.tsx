import { GithubOutlined } from '@ant-design/icons';
import React, { useEffect } from 'react';
import Modal from '../Feedback/Modal';
import startupDisplayData, { StartPopupData } from './startupDisplayData';
import WelcomeTemplate, { WelcomeProps } from './Templates/Welcome';
import ChangeLogTemplate, { ChangeLogProps } from './Templates/ChangeLog';

const StartPopup: React.FC = () => {
  const startup: StartPopupData = startupDisplayData;

  // Startup visibility
  const [visible, setVisible] = React.useState<boolean>(false);
  const [title, setTitle] = React.useState<JSX.Element>(<></>);
  const [welcome, setWelcome] = React.useState<boolean>(false);

  const setMessageSeen = (): void => {
    localStorage.setItem(
      'startupMessageSeen',
      startupDisplayData.latestVersion
    );
  };

  const showLatestChangeLog = (): void => {
    const props = startup.displayData[startup.latestVersion]
      .props as ChangeLogProps;
    const titleComponent = <ChangeLogTemplate changeList={props.changeList} />;
    setVisible(true);
    setTitle(titleComponent);
  };

  const showWelcomeMessage = (): void => {
    const props = startup.displayData.welcome.props as WelcomeProps;
    const titleComponent = (
      <WelcomeTemplate welcomeMessage={props.welcomeMessage} />
    );
    setTitle(titleComponent);
    setVisible(true);
  };

  useEffect(() => {
    const startupMessageSeen = localStorage.getItem('startupMessageSeen');
    if (startupMessageSeen === null) {
      setWelcome(true);
      showWelcomeMessage();
    } else if (startupMessageSeen !== startup.latestVersion) {
      showLatestChangeLog();
    }
  }, []);

  return (
    <>
      <div data-testid="startup-window">
        <Modal
          visible={visible}
          title={title}
          onClose={() => {
            if (welcome) {
              setWelcome(false);
              showLatestChangeLog();
            } else {
              setVisible(false);
              setMessageSeen();
            }
          }}
          centered
        >
          <p>
            Questions, suggestions, or problems? Please visit our GitHub page to
            open an issue.
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              margin: '12px',
            }}
          >
            <a
              href="https://github.com/aims-group/metagrid/issues"
              rel="noopener noreferrer"
              target="_blank"
            >
              <GithubOutlined style={{ fontSize: '32px' }} /> GitHub Issues
            </a>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default StartPopup;
