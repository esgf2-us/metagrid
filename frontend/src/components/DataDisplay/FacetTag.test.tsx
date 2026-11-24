import userEvent from '@testing-library/user-event';
import React from 'react';
import { screen } from '@testing-library/react';
import customRender from '../../test/custom-render';
import FacetTag from './FacetTag';

const user = userEvent.setup();

describe('FacetTag', () => {
  it('renders a basic facet tag without count', () => {
    customRender(<FacetTag value="TestModel" />);

    expect(screen.getByText('TestModel')).toBeInTheDocument();
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it('renders a facet tag with count', () => {
    customRender(<FacetTag value="TestModel" count={42} />);

    expect(screen.getByText('TestModel')).toBeInTheDocument();
    expect(screen.getByText(/\(42\)/)).toBeInTheDocument();
  });

  it('renders a facet tag with count of 0', () => {
    customRender(<FacetTag value="TestModel" count={0} />);

    expect(screen.getByText('TestModel')).toBeInTheDocument();
    expect(screen.getByText(/\(0\)/)).toBeInTheDocument();
  });

  it('does not render count when count is null', () => {
    customRender(<FacetTag value="TestModel" count={null} />);

    expect(screen.getByText('TestModel')).toBeInTheDocument();
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it('renders a clickable facet tag with link', async () => {
    const clickableConfig = {
      urlTemplate: 'https://example.com/docs?model={value}',
    };

    customRender(<FacetTag value="TestModel" clickableConfig={clickableConfig} />);

    const link = await screen.findByRole('link', { name: /TestModel/i });
    expect(link).toHaveAttribute('href', 'https://example.com/docs?model=testmodel');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a clickable facet tag with link and count', async () => {
    const clickableConfig = {
      urlTemplate: 'https://example.com/docs?model={value}',
    };

    customRender(<FacetTag value="TestModel" clickableConfig={clickableConfig} count={100} />);

    const link = await screen.findByRole('link', { name: /TestModel/i });
    expect(link).toHaveAttribute('href', 'https://example.com/docs?model=testmodel');
    expect(screen.getByText(/\(100\)/)).toBeInTheDocument();
  });

  it('renders non-clickable facet tag without clickableConfig', () => {
    customRender(<FacetTag value="TestModel" />);

    const link = screen.queryByRole('link', { name: /TestModel/i });
    expect(link).not.toBeInTheDocument();
    expect(screen.getByText('TestModel')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onCloseMock = vi.fn();

    customRender(<FacetTag value="TestModel" closable={true} onClose={onCloseMock} />);

    const closeBtn = await screen.findByRole('img', { name: /close/i });
    await user.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when closable is false', () => {
    customRender(<FacetTag value="TestModel" closable={false} />);

    const closeBtn = screen.queryByRole('img', { name: 'close' });
    expect(closeBtn).not.toBeInTheDocument();
  });

  it('renders with custom color', () => {
    const { container } = customRender(<FacetTag value="TestModel" color="warning" />);

    // Check that the tag has the warning color class
    const tag = container.querySelector('.ant-tag-warning');
    expect(tag).toBeInTheDocument();
  });

  it('calls onMouseDown when provided', async () => {
    const onMouseDownMock = vi.fn();

    customRender(<FacetTag value="TestModel" onMouseDown={onMouseDownMock} />);

    const tag = screen.getByText('TestModel').closest('.ant-tag');
    if (tag) {
      await user.pointer({ keys: '[MouseLeft>]', target: tag });
      expect(onMouseDownMock).toHaveBeenCalled();
    }
  });

  it('applies custom style', () => {
    const customStyle = { marginRight: 10, backgroundColor: 'red' };
    const { container } = customRender(<FacetTag value="TestModel" style={customStyle} />);

    const tag = container.querySelector('.ant-tag');
    expect(tag).toHaveStyle({ marginRight: '10px' });
  });
});
