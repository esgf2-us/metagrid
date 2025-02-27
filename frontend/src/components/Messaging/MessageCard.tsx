import React, { useEffect } from 'react';
import Markdown from 'react-markdown';
import axios from '../../lib/axios';

type Props = {
  fileName: string;
};

const MessageCard: React.FC<React.PropsWithChildren<Props>> = (props) => {
  const [content, setContent] = React.useState<string>('Content is empty.');

  useEffect(() => {
    axios
      .get<string>(props.fileName)
      .then((response) => {
        setContent(response.data);
      })
      // eslint-disable-next-line no-console
      .catch((error) => console.error(error));
  }, []);

  return <Markdown>{content}</Markdown>;
};

export default MessageCard;
