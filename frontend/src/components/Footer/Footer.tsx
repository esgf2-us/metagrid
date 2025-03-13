import React from 'react';
import Markdown from 'react-markdown';
import startupDisplayData from '../Messaging/messageDisplayData';

const metagridVersion: string = startupDisplayData.messageToShow;

const Footer: React.FC = () => {
  return (
    <footer style={{ fontSize: '11px' }}>
      Metagrid Version: {metagridVersion}
      <Markdown className="footerMarkdown">{window.METAGRID.FOOTER_TEXT}</Markdown>
    </footer>
  );
};

export default Footer;
