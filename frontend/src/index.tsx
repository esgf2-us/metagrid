import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { getSearchFromUrl } from './common/utils';
import App from './components/App/App';
import { AuthProvider } from './contexts/AuthContext';
import { ReactJoyrideProvider } from './contexts/ReactJoyrideContext';
import './index.css';

ReactDOM.render(
  <AuthProvider>
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <ReactJoyrideProvider>
        <App searchQuery={getSearchFromUrl()} />
      </ReactJoyrideProvider>
    </BrowserRouter>
  </AuthProvider>,
  document.getElementById('root')
);
