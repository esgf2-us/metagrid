import React from 'react';
import Markdown from 'react-markdown';

export type Props = {
  metagridVersion: string;
};

const Footer: React.FC<React.PropsWithChildren<Props>> = ({ metagridVersion }) => {
  return (
    <footer style={{ fontSize: '11px' }}>
      Metagrid Version: {metagridVersion}
      <Markdown className="footerMarkdown">{window.METAGRID.FOOTER_TEXT}</Markdown>
    </footer>
  );
};

export default Footer;
