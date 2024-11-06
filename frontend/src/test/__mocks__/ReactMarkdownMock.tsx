import React, { ReactNode } from 'react';

interface ChildrenProps {
  children: ReactNode;
}

function ReactMarkdownMock({ children }: ChildrenProps): ReactNode {
  return <p>{children}</p>;
}

export default ReactMarkdownMock;
