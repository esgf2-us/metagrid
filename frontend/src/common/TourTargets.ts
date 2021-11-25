import { JoyrideTour } from './JoyrideTour';

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

  getClass(targetId: string): string {
    return this.targets.get(targetId)?.class || this.defaultTarget.class;
  }

  getSelector(targetId: string): string {
    return this.targets.get(targetId)?.selector || this.defaultTarget.selector;
  }

  createTestTourOfTargets(): JoyrideTour {
    const testTour = new JoyrideTour(`Test Tour of ${this.name} Targets`);
    this.targets.forEach((target, id) => {
      testTour.addNextStep(
        target.selector,
        `Target Name: ${target.name} __ Target Selector: ${target.selector}`
      );
    });

    return testTour;
  }
}
