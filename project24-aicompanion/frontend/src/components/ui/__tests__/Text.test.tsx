import React from 'react';
import { render } from '@testing-library/react-native';
import Text from '../Text';

describe('Text', () => {
  it('renders children', () => {
    const { getByText } = render(<Text>hello</Text>);
    expect(getByText('hello')).toBeTruthy();
  });

  it('renders with different variants (branch)', () => {
    const { getByText, rerender } = render(<Text variant="heading2">v</Text>);
    expect(getByText('v')).toBeTruthy();
    rerender(<Text variant="button">v</Text>);
    expect(getByText('v')).toBeTruthy();
  });
});


