import React, { useEffect } from 'react';
import Markdown from 'react-markdown';
import { MarkdownMessage } from './types';
import axios from '../../lib/axios';

const MessageCard: React.FC<React.PropsWithChildren<MarkdownMessage>> = ({ fileName }) => {
  const [content, setContent] = React.useState<string>('Content is empty.');

  useEffect(() => {
    axios
      .get<string>(fileName)
      .then((response) => {
        setContent(response.data);
      })
      // eslint-disable-next-line no-console
      .catch((error) => console.error(error));
  }, []);

  return <Markdown>{content}</Markdown>;
};

export default MessageCard;
