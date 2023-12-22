import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MarkdownMessage } from './types';

const MessageCard: React.FC<React.PropsWithChildren<MarkdownMessage>> = ({
  fileName,
}) => {
  const [content, setContent] = React.useState<string>('Content is empty.');

  /* istanbul ignore next */
  useEffect(() => {
    fetch(fileName)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((error) => {
        // eslint-disable-next-line
        console.error(error);
      });
  }, []);

  return <ReactMarkdown>{content}</ReactMarkdown>;
};

export default MessageCard;
