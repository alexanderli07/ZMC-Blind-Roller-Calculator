import { render, screen } from '@testing-library/react-native';
import App from '../App';

jest.mock('../src/storage', () => ({
  loadFabricTypes: jest.fn(async () => []),
  loadTubes: jest.fn(async () => []),
  loadBottomBars: jest.fn(async () => []),
  addFabricType: jest.fn(),
  addTube: jest.fn(),
  addBottomBar: jest.fn(),
  clearFabricTypes: jest.fn(),
  clearTubes: jest.fn(),
  clearBottomBars: jest.fn(),
}));

test('starts with placeholders instead of fallback calculations', async () => {
  await render(<App />);
  expect(screen.getByTestId('total-weight-result')).toHaveTextContent('—');
  expect(screen.getByTestId('roller-diameter-result')).toHaveTextContent('—');
  expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent('—');
});
