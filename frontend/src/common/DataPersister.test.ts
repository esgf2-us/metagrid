import { DataPersister } from './DataPersister';

describe('Test DataPersister Class', () => {
  it('returns the DataPersistor singleton instance', () => {
    const persistor = DataPersister.Instance;

    expect(persistor).toBeInstanceOf(DataPersister);
  });
});
