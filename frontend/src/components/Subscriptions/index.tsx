import { Card, Layout, Tabs } from 'antd';
import 'antd/dist/antd.css';
import {
  CreateSubscriptions,
  ISubscribeState,
  Subscription,
  ViewSubscriptions,
} from 'esgf-subscriptions';
import React from 'react';

enum ActiveTab {
  'AddSubs' = '1',
  'ViewSubs' = '2',
}

export type Props = {
  userSubscriptions: Subscription[];
  onCreateSubscription: (state: ISubscribeState) => void;
  onDeleteSubscriptions: (subs: Subscription[]) => void;
};

export const Subscriptions: React.FC<Props> = ({
  userSubscriptions,
  onCreateSubscription,
  onDeleteSubscriptions,
}) => {

  const [activeTab, setActiveTab] = React.useState<ActiveTab>(
    JSON.parse(localStorage.getItem('activeTab') || ActiveTab.AddSubs)
  );

  const { Content } = Layout;

  const submitSubscriptions = (subscriptionState: ISubscribeState): void => {
    onCreateSubscription(subscriptionState);
    setActiveTab(ActiveTab.ViewSubs);
  };

  React.useEffect(() => {
    localStorage.setItem('activeTab', JSON.stringify(activeTab));
  }, [activeTab]);

  return (
    <Layout>
      <Content>
        <Card>
          <Tabs
            activeKey={activeTab}
            defaultActiveKey="addSub"
            type="card"
            size="large"
            onTabClick={(key: string): void => {
              setActiveTab(key as ActiveTab);
            }}
          >
            <Tabs.TabPane tab="Add Subscription" key={ActiveTab.AddSubs}>
              <CreateSubscriptions submitSubscriptions={submitSubscriptions} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="View Subscriptions" key={ActiveTab.ViewSubs}>
              <ViewSubscriptions
                deleteSubscriptions={onDeleteSubscriptions}
                currentSubs={userSubscriptions}
              />
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </Content>
    </Layout>
  );
};
