import React from 'react';
import { screen } from '@testing-library/react';
import { parsedNodeStatusFixture } from '../../test/mock/fixtures';
import StatusToolTip from './StatusToolTip';
import { NodeStatusArray } from './types';
import customRender from '../../test/custom-render';

const nodeStatusArr: NodeStatusArray = parsedNodeStatusFixture();

describe('test status tooltip used in the results table', () => {
  it('renders status tooltip with question circle icon for undefined node status.', async () => {
    customRender(<StatusToolTip dataNode="'aims3.llnl.gov'" />);

    const nodeStat = await screen.findByRole('img', {
      name: 'question-circle',
    });
    expect(nodeStat).toBeTruthy();
  });

  it('renders status tooltip with question circle icon for unidentified data node value', async () => {
    customRender(
      <StatusToolTip dataNode="'aims3.llnl.gov'" nodeStatus={nodeStatusArr} />
    );

    const nodeStat = await screen.findByRole('img', {
      name: 'question-circle',
    });
    expect(nodeStat).toBeTruthy();
  });

  it('renders component with check circle icon', async () => {
    customRender(
      <StatusToolTip dataNode="aims3.llnl.gov" nodeStatus={nodeStatusArr} />
    );

    const nodeStat = await screen.findByRole('img', {
      name: 'check-circle',
    });
    expect(nodeStat).toBeTruthy();
  });

  it('renders component with close circle icon', async () => {
    customRender(
      <StatusToolTip dataNode="esgf1.dkrz.de" nodeStatus={nodeStatusArr} />
    );

    const nodeStat = await screen.findByRole('img', {
      name: 'close-circle',
    });
    expect(nodeStat).toBeTruthy();
  });
});

describe('test status tooltip used in the facets form on the left.', () => {
  it('renders status tooltip with question circle icon for undefined node status.', async () => {
    customRender(
      <StatusToolTip dataNode="'aims3.llnl.gov'">
        <p>Child</p>
      </StatusToolTip>
    );

    const nodeStat = await screen.findByRole('img', {
      name: 'question-circle',
    });
    expect(nodeStat).toBeTruthy();
  });

  it('renders status tooltip with question circle icon for unidentified data node value', async () => {
    customRender(
      <StatusToolTip dataNode="'aims3.llnl.gov'" nodeStatus={nodeStatusArr}>
        <p>Child</p>
      </StatusToolTip>
    );

    const nodeStat = await screen.findByRole('img', {
      name: 'question-circle',
    });
    expect(nodeStat).toBeTruthy();
  });

  it('renders component with check circle icon', async () => {
    customRender(
      <StatusToolTip dataNode="aims3.llnl.gov" nodeStatus={nodeStatusArr}>
        <p>Child</p>
      </StatusToolTip>
    );

    const nodeStat = await screen.findByRole('img', {
      name: 'check-circle',
    });
    expect(nodeStat).toBeTruthy();
  });

  it('renders component with close circle icon', async () => {
    customRender(
      <StatusToolTip dataNode="esgf1.dkrz.de" nodeStatus={nodeStatusArr}>
        <p>Child</p>
      </StatusToolTip>
    );

    const nodeStat = await screen.findByRole('img', {
      name: 'close-circle',
    });
    expect(nodeStat).toBeTruthy();
  });
});
