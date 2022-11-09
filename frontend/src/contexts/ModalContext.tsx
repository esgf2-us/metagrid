import React from 'react';
import EndpointModal from '../components/Globus/EndpointModal';
import { RawSearchResults } from '../components/Search/types';
import Support from '../components/Support';

export type RawModalState = {
  supportVisible: boolean;
  setSupportVisible: (visible: boolean) => void;
  endpointModalVisible: boolean;
  setEndpointModalVisible: (visible: boolean) => void;
  searchResults: RawSearchResults | null;
  setSearchResults: (searchResults: RawSearchResults) => void;
};

export const ModalContext = React.createContext<RawModalState>({
  supportVisible: false,
  setSupportVisible: () => {},
  endpointModalVisible: false,
  setEndpointModalVisible: () => {},
  searchResults: null,
  setSearchResults: () => {},
});

type Props = { children: React.ReactNode };

export const ModalProvider: React.FC<Props> = ({ children }) => {
  const [supportVisible, setSupportVisible] = React.useState<boolean>(false);
  const [
    endpointModalVisible,
    setEndpointModalVisible,
  ] = React.useState<boolean>(false);
  const [
    searchResults,
    setSearchResults,
  ] = React.useState<RawSearchResults | null>(null);

  return (
    <ModalContext.Provider
      value={{
        supportVisible,
        setSupportVisible,
        endpointModalVisible,
        setEndpointModalVisible,
        searchResults,
        setSearchResults,
      }}
    >
      <Support
        visible={supportVisible}
        onClose={() => setSupportVisible(false)}
      />
      <EndpointModal
        visible={endpointModalVisible}
        onClose={() => {
          setEndpointModalVisible(false);
        }}
        searchResults={searchResults}
      />
      {children}
    </ModalContext.Provider>
  );
};
