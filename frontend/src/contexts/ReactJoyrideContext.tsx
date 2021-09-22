import React from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { mainTour } from '../common/reactJoyrideSteps';
import { RawTourState } from './types';

export const ReactJoyrideContext = React.createContext<RawTourState>({
  running: false,
  setRunning: () => {},
  steps: [],
  setSteps: () => {},
  startTour: () => {},
});

type Props = { children: React.ReactNode };

export const ReactJoyrideProvider: React.FC<Props> = ({ children }) => {
  const [getRunTutorial, setRunTutorial] = React.useState<boolean>(false);
  const [getJoyrideSteps, setJoyrideSteps] = React.useState<Step[]>(mainTour);

  const handleJoyrideCallback = (data: CallBackProps): void => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTutorial(false);
    }
  };

  const handleStartTour = (): void => {
    setRunTutorial(true);
  };

  return (
    <ReactJoyrideContext.Provider
      value={{
        running: getRunTutorial,
        setRunning: setRunTutorial,
        steps: getJoyrideSteps,
        setSteps: setJoyrideSteps,
        startTour: handleStartTour,
      }}
    >
      <Joyride
        steps={getJoyrideSteps}
        run={getRunTutorial}
        callback={handleJoyrideCallback}
        continuous
      />
      {children}
    </ReactJoyrideContext.Provider>
  );
};
