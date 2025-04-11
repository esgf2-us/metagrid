import { v4 as uuidv4 } from 'uuid';
import { JoyrideTour } from './JoyrideTour';

export class TargetObject {
  private className: string;

  private selectorName: string;

  /**
   *
   * @param args
   */
  public constructor(...args: string[]) {
    if (args.length === 0) {
      const targetId = uuidv4();
      this.className = `joyrideTarget-${targetId}`;
      this.selectorName = `.joyrideTarget-${targetId}`;
    } else if (args.length === 1) {
      const className = args[0];
      this.className = className;
      this.selectorName = `#root .${className}`;
    } else {
      const groupName = args[0];
      const id = args[1];
      this.className = `${groupName}_target-${id}`;
      this.selectorName = `.${groupName}_target-${id}`;
    }
  }

  class(state?: string): string {
    return `${this.className}${state ? ` target-state_${state}` : ''}`;
  }

  selector(state?: string): string {
    return `${this.selectorName}${state ? `.target-state_${state}` : ''}`;
  }
}

export const createTestTour = (
  groupName: string,
  targetGroup: {
    [target: string]: TargetObject;
  }
): JoyrideTour => {
  const testTour = new JoyrideTour(`Test Tour of ${Object.name} Targets`);
  Object.entries(targetGroup).forEach((entry) => {
    const name = entry[0];
    const target = entry[1];
    testTour.addNextStep(
      target.selector(),
      `Group: ${groupName}__ Name: ${name}__ Selector: ${target.selector()}`
    );
  });

  return testTour;
};
