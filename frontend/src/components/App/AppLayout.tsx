import React from 'react';
import { HomeOutlined } from '@ant-design/icons';
import { Layout, Breadcrumb } from 'antd';
import { CSSinJS } from '../../common/types';

export type Props = {
  pageName: string;
  sider: React.ReactNode;
  pageContent: React.ReactNode;
};

const styles: CSSinJS = {
  bodySider: {
    background: '#fff',
    padding: '12px 12px 12px 12px',
    width: '384px',
    marginRight: '2px',
    boxShadow: '2px 0 4px 0 rgba(0, 0, 0, 0.2)',
  },
  bodyContent: { padding: '12px 12px', margin: 0 },
  messageAddIcon: { color: '#90EE90' },
  messageRemoveIcon: { color: '#ff0000' },
};

const appVersion = '1.0.2-beta';

const AppLayout: React.FC<Props> = ({ pageName, sider, pageContent }) => {
  return (
    <>
      <Layout id="body-layout">
        <Layout.Sider
          style={styles.bodySider}
          width={styles.bodySider.width as number}
        >
          {sider}
        </Layout.Sider>
        <Layout>
          <Layout.Content style={styles.bodyContent}>
            <Breadcrumb>
              <Breadcrumb.Item>
                <HomeOutlined /> Home
              </Breadcrumb.Item>
              <Breadcrumb.Item>{pageName}</Breadcrumb.Item>
            </Breadcrumb>
            {pageContent}
          </Layout.Content>
          <Layout.Footer>
            <p style={{ fontSize: '10px' }}>
              {`Metagrid Version: ${appVersion} `}
              <br />
              Privacy &amp; Legal Notice:{' '}
              <a href="https://www.llnl.gov/disclaimer.html">
                https://www.llnl.gov/disclaimer.html
              </a>
              <br />
              Learn about the Department of Energy&apos;s Vulnerability
              Disclosure Program (VDP):{' '}
              <a href="https://doe.responsibledisclosure.com/hc/en-us">
                https://doe.responsibledisclosure.com/hc/en-us
              </a>
            </p>
          </Layout.Footer>
        </Layout>
      </Layout>
    </>
  );
};

export default AppLayout;
