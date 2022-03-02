import { JoyrideTour } from './JoyrideTour';

describe('Test JoyrideTour class', () => {
  it('returns a default tour object', () => {
    expect(new JoyrideTour()).toBeTruthy();
  });

  it('returns a tour object with title', () => {
    expect(new JoyrideTour('TEST')).toBeTruthy();
  });

  it('tour object has appropriate test locale', () => {
    const testTour = new JoyrideTour('TEST', { back: 'BACK', next: 'NEXT' });
    expect(testTour.getLocale().back).toEqual('BACK');
    expect(testTour.getLocale().next).toEqual('NEXT');
  });

  it('runs the on finish function', async () => {
    const testTour = new JoyrideTour();
    let testValue = 0;

    // This should do nothing
    await testTour.onFinish();

    // Now it should do something
    testTour.setOnFinish(() => {
      return () => {
        testValue = 5;
      };
    });
    await testTour.onFinish();
    expect(testValue).toEqual(5);
  });

  it('Creates a tour and steps', async () => {
    const testTour = new JoyrideTour();
    let testValue = 0;

    testTour.addNextStep('testTarget1', 'This is a test.');
    testTour.addNextStep('testTarget2', 'This is a test too.');
    testTour.addNextStep(
      'testTarget3',
      'This is a test as well.',
      'auto',
      () => {
        testValue = 5;
      }
    );

    // Make sure tour steps added and step index is counting up
    expect(testTour.getSteps().length).toEqual(3);
    expect(testTour.getActionByStepIndex(2)?.stepIndex).toEqual(2);

    // Check that action functions work
    await testTour.getActionByStepIndex(0)?.action(); // should do nothing
    expect(testValue).toEqual(0);
    await testTour.getActionByStepIndex(2)?.action(); // Should set value to 5
    expect(testValue).toEqual(5);

    // Test tour flags
    testTour.setTourFlag('TestFlag', false);
    expect(testTour.getTourFlag('TestFlag')).toEqual(false);
    testTour.setTourFlag('TestFlag', true);
    expect(testTour.getTourFlag('TestFlag')).toEqual(true);
  });
});
