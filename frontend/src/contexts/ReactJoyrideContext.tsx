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
  const [actionRunning, setActionRunning] = useState<boolean>(false);
  const [clickCount, setClickCount] = useState<number>(0);

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
      setActionRunning(false);
      setClickCount(0);
    } else if (action === ACTIONS.PREV && type === EVENTS.STEP_AFTER) {
      previousStep(index);
    } else if (type === EVENTS.STEP_AFTER) {
      const stepAction = getTour.getActionByStepIndex(index);
      if (stepAction) {
        setActionRunning(true);
        setClickCount(0);
        await stepAction.action();
        setActionRunning(false);
        setClickCount(0);
      }
      nextStep(index);
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      nextStep(index);
    }
  };

  const handleOverlayClick = useCallback(() => {
    setClickCount((prev) => prev + 1);
  }, []);

  // Inject loading message into Joyride tooltip when user clicks multiple times
  React.useEffect(() => {
    /* istanbul ignore next -- @preserve */
    if (!actionRunning || clickCount < 2) return undefined;

    const tooltip = document.querySelector('.react-joyride__tooltip') as HTMLElement;
    /* istanbul ignore next -- @preserve */
    if (!tooltip) return undefined;

    // Check if message already exists
    /* istanbul ignore next -- @preserve */
    if (tooltip.querySelector('.loading-message')) return undefined;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'loading-message';
    /* istanbul ignore next -- @preserve */
    messageDiv.style.cssText = `
      margin-top: 12px;
      padding: 12px 16px;
      background-color: ${isDarkMode ? '#444' : '#f0f0f0'};
      border-left: 4px solid ${isDarkMode ? '#666' : '#1890ff'};
      border-radius: 4px;
      font-size: 14px;
      color: ${isDarkMode ? '#eee' : '#333'};
      line-height: 1.5;
    `;
    // Use custom message if provided, otherwise use default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const customMsg = (window as any).tourLoadingMessage as string | undefined;
    /* istanbul ignore next -- @preserve */
    messageDiv.innerHTML =
      customMsg ||
      '<strong>Note:</strong> U.I. elements are still loading... Please click <strong>Skip</strong> if you want to cancel the tutorial.';

    tooltip.appendChild(messageDiv);

    /* istanbul ignore next -- @preserve */
    return () => {
      messageDiv.remove();
    };
  }, [actionRunning, clickCount, isDarkMode]);

  /* istanbul ignore next -- @preserve */
  const startTour = useCallback((): void => {
    setStepIndex(0);
    setRunning(true);
  }, []);

  /* istanbul ignore next -- @preserve */
  const setCurrentAppPage = useCallback(
    (page: AppPage): void => {
      if (getCurrentAppPage() !== page) {
        setTimeout(() => {
          if (!navigate) {
            // eslint-disable-next-line no-console
            console.error('Navigate function is not available');
            return;
          }

          let targetPath = '';
          switch (page) {
            case AppPage.Main:
              targetPath = '/search';
              break;
            case AppPage.Cart:
              targetPath = '/cart/items';
              break;
            case AppPage.NodeStatus:
              targetPath = '/nodes';
              break;
            case AppPage.SavedSearches:
              targetPath = '/cart/searches';
              break;
            default:
              break;
          }

          if (targetPath) {
            navigate(targetPath);
          }
        }, 300);
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
            /* istanbul ignore next -- @preserve */
            backgroundColor: isDarkMode ? '#222' : '#fff',
            /* istanbul ignore next -- @preserve */
            color: isDarkMode ? '#eee' : '#333',
          },
          buttonNext: {
            /* istanbul ignore next -- @preserve */
            backgroundColor: isDarkMode ? '#eee' : '#f04',
            /* istanbul ignore next -- @preserve */
            color: isDarkMode ? '#b00' : '#fff',
          },
          buttonSkip: {
            /* istanbul ignore next -- @preserve */
            backgroundColor: isDarkMode ? '#222' : '#fff',
            /* istanbul ignore next -- @preserve */
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
      {/* istanbul ignore next -- @preserve */}
      {actionRunning && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleOverlayClick}
          onKeyDown={
            /* istanbul ignore next -- @preserve */
            (e) => {
              /* istanbul ignore next -- @preserve */
              if (e.key === 'Enter' || e.key === ' ') {
                handleOverlayClick();
              }
            }
          }
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
          aria-label="Loading overlay"
        />
      )}
      {children}
    </ReactJoyrideContext.Provider>
  );
};
export default ReactJoyrideContext;
