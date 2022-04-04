import { TourTargets } from './TourTargets';

describe('Test TourTarget class', () => {
  it('returns default tour targets', () => {
    expect(new TourTargets('Test Targets')).toBeTruthy();
  });

  it('Creates appropriate tour targets and strings', () => {
    const testTargets = new TourTargets('TestTargets');
    testTargets.create('firstTarget').create('nextTarget');

    // Make sure bad target id returns default
    expect(testTargets.getTarget('badTargetId')).toBeUndefined();
    expect(testTargets.getClass('badTargetId')).toEqual('navbar-logo');
    expect(testTargets.getSelector('badTargetId')).toEqual(
      '#root .navbar-logo'
    );

    // Good target returns proper values
    expect(testTargets.getTarget('firstTarget')?.name).toEqual('firstTarget');
    expect(testTargets.getTarget('firstTarget')?.class).toEqual(
      testTargets.getClass('firstTarget')
    );
    expect(testTargets.getTarget('firstTarget')?.selector).toEqual(
      testTargets.getSelector('firstTarget')
    );
    expect(testTargets.getClass('firstTarget', 'test')).toContain(
      'target-state_test'
    );
    expect(testTargets.getSelector('firstTarget', 'test')).toContain(
      '.target-state_test'
    );
  });

  it('returns a joyride tour of targets', () => {
    const testTargets = new TourTargets('TestTargets');
    testTargets.create('firstTarget').create('nextTarget');

    const testTour = testTargets.createTestTourOfTargets();

    // Test that a test tour is created
    expect(testTour.getSteps().length).toEqual(2);
    expect(testTour.getActionByStepIndex(0)?.step.target).toEqual(
      testTargets.getSelector('firstTarget')
    );
  });
});
