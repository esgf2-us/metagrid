import React, { useState, useCallback, useMemo } from 'react';
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS } from 'react-joyride';
import { useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';
import { AppPage } from '../common/types';
import { getCurrentAppPage } from '../common/utils';
import { isDarkModeAtom } from '../common/atoms';
import { JoyrideTour } from '../common/joyrideTutorials/JoyrideTour';

export type RawTourState = {
  getTour: JoyrideTour;
  setTour: (tour: JoyrideTour) => void;
  startTour: () => void;
  setCurrentAppPage: (page: number) => void;
  startSpecificTour: (tour: JoyrideTour) => void;
};

/* istanbul ignore next -- @preserve */
const emptyTour = {
  getTour: new JoyrideTour('Empty Tour'),
  setTour: () => {},
  startTour: () => {},
  setCurrentAppPage: () => {},
  startSpecificTour: () => {},
};

export const ReactJoyrideContext = React.createContext<RawTourState>(emptyTour);

type Props = { children: React.ReactNode };

const defaultTour = new JoyrideTour('Empty Tour');

export const ReactJoyrideProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const navigate = useNavigate();
  const [running, setRunning] = useState<boolean>(false);
  const [getTour, setTour] = useState<JoyrideTour>(defaultTour);
  const [getStepIndex, setStepIndex] = useState<number>(0);

  const isDarkMode = useAtomValue<boolean>(isDarkModeAtom);

  /* istanbul ignore next -- @preserve */
  const nextStep = useCallback(
    (index: number): void => {
      const stepCount = getTour.getSteps().length;
      try {
        if (index < stepCount) {
          setStepIndex(index + 1);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    },
    [getTour],
  );

  /* istanbul ignore next -- @preserve */
  const previousStep = useCallback((index: number): void => {
    try {
      if (index >= 0) {
        setStepIndex(index - 1);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, []);

  /* istanbul ignore next -- @preserve */
  const handleJoyrideCallback = async (data: CallBackProps): Promise<void> => {
    const { status, index, type, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      await getTour.onFinish();

      setRunning(false);
      setStepIndex(0);
      setTour(defaultTour);
    } else if (action === ACTIONS.PREV && type === EVENTS.STEP_AFTER) {
      previousStep(index);
    } else if (type === EVENTS.STEP_AFTER) {
      const stepAction = getTour.getActionByStepIndex(index);
      if (stepAction) {
        await stepAction.action();
      }
      nextStep(index);
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      nextStep(index);
    }
  };

  /* istanbul ignore else -- @preserve */
  const startTour = useCallback((): void => {
    setStepIndex(0);
    setRunning(true);
  }, []);

  /* istanbul ignore next -- @preserve */
  const setCurrentAppPage = useCallback(
    (page: AppPage): void => {
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
                break;
            }
          }
        }, 100);
      }
    },
    [navigate],
  );

  const startSpecificTour = useCallback((tour: JoyrideTour): void => {
    setTour(tour);
    setStepIndex(0);
    setRunning(true);
  }, []);

  const contextValue = useMemo(
    () => ({
      getTour,
      setTour,
      startTour,
      setCurrentAppPage,
      startSpecificTour,
    }),
    [getTour, startTour, setCurrentAppPage, startSpecificTour],
  );

  return (
    <ReactJoyrideContext.Provider value={contextValue}>
      <Joyride
        steps={getTour.getSteps()}
        stepIndex={getStepIndex}
        styles={{
          tooltip: {
            backgroundColor: isDarkMode ? '#222' : '#fff',
            color: isDarkMode ? '#eee' : '#333',
          },
          buttonNext: {
            backgroundColor: isDarkMode ? '#eee' : '#f04',
            color: isDarkMode ? '#b00' : '#fff',
          },
          buttonSkip: {
            backgroundColor: isDarkMode ? '#222' : '#fff',
            color: isDarkMode ? '#eee' : '#333',
          },
        }}
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
export default ReactJoyrideContext;
