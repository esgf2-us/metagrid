import React from 'react';
import Markdown from 'react-markdown';
import startupDisplayData from '../Messaging/messageDisplayData';

const metagridVersion: string = startupDisplayData.messageToShow;

const Footer: React.FC = () => {
  /* istanbul ignore next */
  const footerText = window.METAGRID ? window.METAGRID.FOOTER_TEXT : '';
  return (
    <footer style={{ fontSize: '11px' }}>
      Metagrid Version: {metagridVersion}
      <div className="footerMarkdown">
        <Markdown>{footerText}</Markdown>
      </div>
    </footer>
  );
};

export default Footer;
