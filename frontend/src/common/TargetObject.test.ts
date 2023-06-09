import { TargetObject, createTestTour } from './TargetObject';

describe('Test TourTarget class', () => {
  it('returns target object with uuid', () => {
    const targetObject: TargetObject = new TargetObject();
    expect(targetObject).toBeTruthy();
    expect(targetObject.class()).toContain('joyrideTarget-');
    expect(targetObject.selector()).toContain('.joyrideTarget-');
  });
  it('returns target object with specified className', () => {
    const targetObject: TargetObject = new TargetObject('testClass');
    expect(targetObject).toBeTruthy();
    expect(targetObject.class()).toEqual('testClass');
    expect(targetObject.selector()).toEqual('#root .testClass');
    expect(targetObject.class('testState')).toEqual(
      'testClass target-state_testState'
    );
    expect(targetObject.selector('testState')).toEqual(
      '#root .testClass .target-state_testState'
    );
  });
  it('returns target object with uuid', () => {
    const targetObject: TargetObject = new TargetObject('testGroup', 'testId');
    expect(targetObject).toBeTruthy();
    expect(targetObject.class()).toEqual('testGroup_target-testId');
    expect(targetObject.selector()).toEqual('.testGroup_target-testId');
  });

  it('Successfully creates an empty test joyride tour', () => {
    createTestTour('testGroup', {});
  });

  it('Successfully creates joyride tour fron test targets', () => {
    const testTargets = {
      test1: new TargetObject('test1'),
      test2: new TargetObject('test2'),
      test3: new TargetObject('test3'),
    };
    createTestTour('testGroup', testTargets);
  });
});
