/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-capture-protection', () => ({
  CaptureProtection: {
    prevent: jest.fn(() => Promise.resolve()),
    allow: jest.fn(() => Promise.resolve()),
  },
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
