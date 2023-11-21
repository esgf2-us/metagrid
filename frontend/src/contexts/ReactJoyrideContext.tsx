import React from 'react';
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS } from 'react-joyride';
import { useNavigate } from 'react-router-dom';
import { JoyrideTour } from '../common/JoyrideTour';
import { getCurrentAppPage } from '../common/reactJoyrideSteps';
import { AppPage } from '../common/types';

export type RawTourState = {
  getTour: JoyrideTour;
  setTour: (tour: JoyrideTour) => void;
  startTour: () => void;
  setCurrentAppPage: (page: number) => void;
};

/* istanbul ignore next */
export const ReactJoyrideContext = React.createContext<RawTourState>({
  getTour: new JoyrideTour('Empty Tour'),
  setTour: () => {},
  startTour: () => {},
  setCurrentAppPage: () => {},
});

type Props = { children: React.ReactNode };

const defaultTour = new JoyrideTour('Empty Tour');

export const ReactJoyrideProvider: React.FC<React.PropsWithChildren<Props>> = ({
  children,
}) => {
  const navigate = useNavigate();
  const [running, setRunning] = React.useState<boolean>(false);
  const [getTour, setTour] = React.useState<JoyrideTour>(defaultTour);
  const [getStepIndex, setStepIndex] = React.useState<number>(0);

  /* istanbul ignore next */
  const nextStep = (index: number): void => {
    const stepCount = getTour.getSteps().length;
    try {
      if (index < stepCount) {
        setStepIndex(index + 1);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  /* istanbul ignore next */
  const previousStep = (index: number): void => {
    try {
      if (index >= 0) {
        setStepIndex(index - 1);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  /* istanbul ignore next */
  const handleJoyrideCallback = async (data: CallBackProps): Promise<void> => {
    const { status, index, type, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      await getTour.onFinish(); // Run the callback for finished tour

      setRunning(false);
      setStepIndex(0);
      setTour(defaultTour);
    } else if (action === ACTIONS.PREV && type === EVENTS.STEP_AFTER) {
      previousStep(index);
    } else if (type === EVENTS.STEP_AFTER) {
      const stepAction = getTour.getActionByStepIndex(index);
      if (stepAction) {
        // If an action exists, perform the action
        await stepAction.action();
      }
      nextStep(index);
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      nextStep(index);
    }
  };

  /* istanbul ignore next */
  const startTour = (): void => {
    if (getTour) {
      setStepIndex(0);
    }
    setRunning(true);
  };

  /* istanbul ignore next */
  const setCurrentAppPage = (page: AppPage): void => {
    if (getCurrentAppPage() !== page) {
      setTimeout(() => {
        if (navigate) {
          switch (page) {
            case AppPage.Main:
              navigate('/search');
              break;
            case AppPage.Cart:
              navigate('/cart/items');
              break;
            case AppPage.NodeStatus:
              navigate('/nodes');
              break;
            case AppPage.SavedSearches:
              navigate('/cart/searches');
              break;
            default:
          }
        }
      }, 100);
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
        disableScrolling
        disableScrollParentFix
        continuous
      />
      {children}
    </ReactJoyrideContext.Provider>
  );
};
