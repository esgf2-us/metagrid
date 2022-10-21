import React from 'react';
import EndpointModal from '../components/Globus/EndpointModal';
import { RawSearchResults } from '../components/Search/types';
import Support from '../components/Support';

export type RawModalState = {
  supportVisible: boolean;
  setSupportVisible: (visible: boolean) => void;
  endpointListVisible: boolean;
  setEndpointListVisible: (visible: boolean) => void;
  searchResults: RawSearchResults | null;
  setSearchResults: (searchResults: RawSearchResults) => void;
};

export const ModalContext = React.createContext<RawModalState>({
  supportVisible: false,
  setSupportVisible: () => {},
  endpointListVisible: false,
  setEndpointListVisible: () => {},
  searchResults: null,
  setSearchResults: () => {},
});

type Props = { children: React.ReactNode };

export const ModalProvider: React.FC<Props> = ({ children }) => {
  const [supportVisible, setSupportVisible] = React.useState<boolean>(false);
  const [endpointListVisible, setEndpointListVisible] = React.useState<boolean>(
    false
  );
  const [
    searchResults,
    setSearchResults,
  ] = React.useState<RawSearchResults | null>(null);

  return (
    <ModalContext.Provider
      value={{
        supportVisible,
        setSupportVisible,
        endpointListVisible,
        setEndpointListVisible,
        searchResults,
        setSearchResults,
      }}
    >
      <Support
        visible={supportVisible}
        onClose={() => setSupportVisible(false)}
      />
      <EndpointModal
        visible={endpointListVisible}
        onClose={() => {
          setEndpointListVisible(false);
        }}
        searchResults={searchResults}
      />
      {children}
    </ModalContext.Provider>
  );
};
