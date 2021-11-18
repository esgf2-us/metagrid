import React from 'react';
import Joyride, { CallBackProps, EVENTS, STATUS } from 'react-joyride';
import { useHistory } from 'react-router-dom';
import { JoyrideTour } from '../common/JoyrideTour';
import { getCurrentAppPage } from '../common/reactJoyrideSteps';
import { AppPage } from '../common/types';

export type RawTourState = {
  getTour: JoyrideTour;
  setTour: (tour: JoyrideTour) => void;
  startTour: () => void;
  setCurrentAppPage: (page: number) => void;
};

export const ReactJoyrideContext = React.createContext<RawTourState>({
  getTour: new JoyrideTour('Empty Tour'),
  setTour: () => {},
  startTour: () => {},
  setCurrentAppPage: () => {},
});

type Props = { children: React.ReactNode };

const defaultTour = new JoyrideTour('Empty Tour');

export const ReactJoyrideProvider: React.FC<Props> = ({ children }) => {
  const history = useHistory();
  const [running, setRunning] = React.useState<boolean>(false);
  const [getTour, setTour] = React.useState<JoyrideTour>(defaultTour);
  const [getStepIndex, setStepIndex] = React.useState<number>(0);

  const handleJoyrideCallback = async (data: CallBackProps): Promise<void> => {
    const { status, index, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      await getTour.onFinish(); // Run the callback for finished tour

      setRunning(false);
      setStepIndex(0);
      setTour(defaultTour);
    } else if (
      type === EVENTS.STEP_AFTER
      // ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type)
    ) {
      const action = getTour.getActionByStepIndex(index);
      if (action) {
        // If an action exists, perform the action
        await action.action();
        setStepIndex(index + 1);
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + 1);
    }
  };

  const startTour = (): void => {
    if (getTour) {
      setStepIndex(0);
    }
    setRunning(true);
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
        getTour,
        setTour,
        startTour,
        setCurrentAppPage,
      }}
    >
      <Joyride
        steps={getTour.getSteps()}
        stepIndex={getStepIndex}
        run={running}
        callback={handleJoyrideCallback}
        locale={getTour.getLocale()}
        continuous
      />
      {children}
    </ReactJoyrideContext.Provider>
  );
};
