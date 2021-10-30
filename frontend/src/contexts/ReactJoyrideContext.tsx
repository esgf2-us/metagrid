import React from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useHistory } from 'react-router-dom';
import { mainTourUnloadedTable } from '../common/reactJoyrideSteps';
import { AppPage } from '../common/types';

export type TourCallback = () => () => void;

export type RawTourState = {
  running: boolean;
  setRunning: (running: boolean) => void;
  getSteps: Step[];
  setSteps: (steps: Step[]) => void;
  startTour: () => void;
  setFinishCallback: (tourCallback: TourCallback) => void;
  getCurrentAppPage: () => number;
  setCurrentAppPage: (page: number) => void;
};

export const ReactJoyrideContext = React.createContext<RawTourState>({
  running: false,
  setRunning: () => {},
  getSteps: [],
  setSteps: () => {},
  startTour: () => {},
  setFinishCallback: () => {},
  getCurrentAppPage: () => 0,
  setCurrentAppPage: () => {},
});

type Props = { children: React.ReactNode };

export const ReactJoyrideProvider: React.FC<Props> = ({ children }) => {
  const history = useHistory();
  const [running, setRunning] = React.useState<boolean>(false);
  const [getSteps, setSteps] = React.useState<Step[]>(mainTourUnloadedTable);
  const [getFinishCallback, setFinishCallback] = React.useState<() => void>(
    () => {}
  );

  const handleJoyrideCallback = (data: CallBackProps): void => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunning(false);
      console.log('Tour complete!');
      if (getFinishCallback) {
        getFinishCallback();
        setFinishCallback(() => {});
      }
    }
  };

  const startTour = (): void => {
    setRunning(true);
  };

  const getCurrentAppPage = (): number => {
    const { pathname } = window.location;
    switch (pathname) {
      case '/search':
        return AppPage.Main;
      case '/cart/items':
        return AppPage.Cart;
      case '/nodes':
        return AppPage.NodeStatus;
      case '/cart/searches':
        return AppPage.SavedSearches;
      default:
        return -1;
    }
  };

  const setCurrentAppPage = (page: AppPage): void => {
    if (getCurrentAppPage() !== page) {
      setTimeout(() => {
        if (history) {
          switch (page) {
            case AppPage.Main:
              history.push('/search');
              break;
            case AppPage.Cart:
              history.push('/cart/items');
              break;
            case AppPage.NodeStatus:
              history.push('/nodes');
              break;
            case AppPage.SavedSearches:
              history.push('/cart/searches');
              break;
            default:
          }
        }
      }, 0);
    }
  };

  return (
    <ReactJoyrideContext.Provider
      value={{
        running,
        setRunning,
        getSteps,
        setSteps,
        startTour,
        setFinishCallback,
        getCurrentAppPage,
        setCurrentAppPage,
      }}
    >
      <Joyride
        steps={getSteps}
        run={running}
        callback={handleJoyrideCallback}
        continuous
      />
      {children}
    </ReactJoyrideContext.Provider>
  );
};
