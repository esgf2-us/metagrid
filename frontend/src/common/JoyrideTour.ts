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

  private finish: () => () => void | Promise<void>;

  constructor(title?: string, locale?: Locale) {
    this.title = title || 'Metagrid Tour';
    this.locale = locale || { back: 'Previous', last: 'End' };
    this.actions = [];
    this.stepCount = 0;
    this.finish = () => {
      return () => {
        console.log('Tour complete!');
      };
    };
  }

  getActionByStepIndex(stepIndex: number): ActionStep | undefined {
    return this.actions.find((action) => {
      return action.stepIndex === stepIndex;
    });
  }

  getSteps(): Step[] {
    return this.actions.map((actionStep) => {
      return actionStep.step;
    });
  }

  getLocale(): Locale {
    return this.locale;
  }

  async onFinish(): Promise<void> {
    const func = this.finish();
    await func();
  }

  addNextStep(
    target: string | HTMLElement,
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
        disableOverlayClose: true,
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
}
