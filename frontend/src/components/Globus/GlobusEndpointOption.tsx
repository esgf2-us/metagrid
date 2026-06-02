import React from 'react';
import { Divider } from 'antd';
import { GlobusEndpoint } from './types';

export interface GlobusEndpointOptionData {
  key: string;
  value: string;
  label: string;
  path: string | null;
  endpoint: GlobusEndpoint;
}

export interface GlobusEndpointOptionProps {
  label: React.ReactNode;
  value: string | number;
  endpoint: GlobusEndpoint;
}

const GlobusEndpointOption: React.FC<GlobusEndpointOptionProps> = ({ label, value, endpoint }) => {
  // Render placeholder differently
  if (value === '') {
    return <strong>{label}</strong>;
  }

  const isGuest = endpoint?.entity_type === 'GCSv5_guest_collection';
  const isManaged =
    endpoint?.entity_type === 'GCSv5_mapped_collection' && endpoint?.subscription_id !== '';

  return (
    <>
      <strong>{label}</strong>
      <br />
      ID: {value}
      <br />
      <span>
        {endpoint?.path && `Path: ${endpoint.path}`}
        {endpoint?.path && <br />}
        {isManaged && 'Managed '}
        {isGuest ? 'Guest Collection' : 'Mapped Collection'} <br />
        {endpoint?.contact_email && endpoint.contact_email}
      </span>
      <Divider style={{ marginBottom: '0px', marginTop: '0px' }} />
    </>
  );
};

export default GlobusEndpointOption;
