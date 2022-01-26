import { JoyrideTour } from './JoyrideTour';

/**
 * name: The identifier to use when locating the target
 * class: The actual classname of the target
 * selector: The css selector which can be used to get the target
 */
export type TourTarget = {
  name: string;
  class: string;
  selector: string;
};

export class TourTargets {
  private name: string;

  private targets: Map<string, TourTarget>;

  private defaultTarget: TourTarget;

  constructor(name: string) {
    this.name = name;
    this.targets = new Map<string, TourTarget>();
    this.defaultTarget = {
      name: 'default',
      class: 'navbar-logo',
      selector: '#root .navbar-logo',
    };
  }

  create(targetId: string): TourTargets {
    const newTarget: TourTarget = {
      name: targetId,
      class: `${this.name}_target-${targetId}`,
      selector: `.${this.name}_target-${targetId}`,
    };
    this.targets.set(targetId, newTarget);
    return this;
  }

  getClass(targetId: string, state?: string): string {
    const target = this.targets.get(targetId);
    if (target) {
      return `${target.class}${state ? ` target-state_${state}` : ''}`;
    }
    return this.defaultTarget.class;
  }

  getSelector(targetId: string, state?: string): string {
    const target = this.targets.get(targetId);
    if (target) {
      return `${target.selector}${state ? `.target-state_${state}` : ''}`;
    }
    return this.defaultTarget.selector;
  }

  getTarget(targetId: string): TourTarget | undefined {
    return this.targets.get(targetId);
  }

  createTestTourOfTargets(): JoyrideTour {
    const testTour = new JoyrideTour(`Test Tour of ${this.name} Targets`);
    this.targets.forEach((target) => {
      testTour.addNextStep(
        target.selector,
        `Target Name: ${target.name} __ Target Selector: ${target.selector}`
      );
    });

    return testTour;
  }
}
