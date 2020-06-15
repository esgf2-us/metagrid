// Mock file for axios
// https://stackoverflow.com/questions/51393952/mock-inner-axios-create
import axios from 'axios';

const mockAxios: jest.Mocked<typeof axios> = jest.genMockFromModule('axios');
mockAxios.create = jest.fn(() => mockAxios);

export default mockAxios;
