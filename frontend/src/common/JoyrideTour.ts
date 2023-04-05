import { Placement, Step, Locale } from 'react-joyride';

export type ActionStep = {
  stepIndex: number;
  step: Step;
  action: () => void | Promise<void>;
};

export class JoyrideTour {
  private title: string;

  private locale: Locale;

  private actions: ActionStep[];

  private stepCount: number;

  private tourFlags: Map<string, boolean>;

  private finish: () => () => void | Promise<void>;

  constructor(title?: string, locale?: Locale) {
    this.title = title || 'Metagrid Tour';
    this.locale = locale || { back: 'Previous', last: 'End' };
    this.actions = [];
    this.stepCount = 0;
    this.tourFlags = new Map<string, boolean>();
    this.finish = () => {
      return () => {};
    };
  }

  getActionByStepIndex(stepIndex: number): ActionStep | undefined {
    return this.actions.find((action) => {
      return action.stepIndex === stepIndex;
    });
  }

  getLocale(): Locale {
    return this.locale;
  }

  getSteps(): Step[] {
    return this.actions.map((actionStep) => {
      return actionStep.step;
    });
  }

  getTourFlag(name: string): boolean {
    return this.tourFlags.get(name) || false;
  }

  async onFinish(): Promise<void> {
    const func = this.finish();
    await func();
  }

  /**
   *
   * @param target The element to highlight (CSS selector or an HTML Element)
   * @param content The content of the tour window
   * @param placement Default location for displaying the window
   * @param action A function to call when the tour passes this step
   * @returns This tour object
   */
  addNextStep(
    target: string,
    content: string,
    placement?: Placement | 'auto' | 'center' | undefined,
    action?: () => void | Promise<void>
  ): JoyrideTour {
    this.actions.push({
      stepIndex: this.stepCount,
      step: {
        target,
        content,
        title: this.title,
        showSkipButton: true,
        hideBackButton: true,
        hideCloseButton: true,
        disableBeacon: true,
        disableScrolling: false,
        placement,
        styles: {
          options: {
            zIndex: 10000,
          },
        },
      },
      action: action || ((): void => {}),
    });
    this.stepCount += 1;
    return this;
  }

  setOnFinish(callback: () => () => void | Promise<void>): JoyrideTour {
    this.finish = callback;
    return this;
  }

  setTourFlag(name: string, value: boolean): JoyrideTour {
    this.tourFlags.set(name, value);
    return this;
  }
}
