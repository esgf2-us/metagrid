import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MarkdownMessage } from './types';

const MessageCard: React.FC<MarkdownMessage> = ({ fileName }) => {
  const [content, setContent] = React.useState<string>('Content is empty.');

  useEffect(() => {
    fetch(fileName)
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, []);

  return <ReactMarkdown>{content}</ReactMarkdown>;
};

export default MessageCard;
