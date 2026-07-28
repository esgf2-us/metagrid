import React from 'react';
import { Alert, Button, Col, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  children: React.ReactNode;
  onError?: (uuid: string) => void;
  uuid: string;
  searchData?: {
    projectName?: string;
    url?: string;
  };
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class SearchCardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Unknown error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('SearchCard rendering error for UUID:', this.props.uuid, error, errorInfo);
  }

  handleDelete = (): void => {
    if (this.props.onError) {
      this.props.onError(this.props.uuid);
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const { searchData } = this.props;

      return (
        <Col xs={20} sm={16} md={12} lg={10} xl={8}>
          <Alert
            message="Failed to load search"
            description={
              <div>
                <p>This search has corrupted data and cannot be displayed.</p>
                {searchData?.projectName && (
                  <p>
                    <Text strong>Project:</Text> {searchData.projectName}
                  </p>
                )}
                {searchData?.url && (
                  <p>
                    <Text strong>URL:</Text>{' '}
                    <Text code ellipsis style={{ maxWidth: 300 }}>
                      {searchData.url}
                    </Text>
                  </p>
                )}
                <p style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
                  <Text type="secondary">
                    Error: {this.state.errorMessage}
                  </Text>
                </p>
                <p style={{ marginTop: 8 }}>
                  <Text type="warning">
                    You can delete this search and try saving it again from the search page.
                  </Text>
                </p>
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={this.handleDelete}
                title="Delete this corrupted search"
              >
                Delete
              </Button>
            }
          />
        </Col>
      );
    }

    return this.props.children;
  }
}

export default SearchCardErrorBoundary;
