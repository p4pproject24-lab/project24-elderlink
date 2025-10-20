import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button', () => {
  it('renders title and handles press', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={onPress} />);
    const node = getByText('Click Me');
    fireEvent.press(node);
    expect(onPress).toHaveBeenCalled();
  });

  it('respects disabled state', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Disabled" onPress={onPress} disabled />);
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders secondary variant and loading (branch coverage)', () => {
    const { getByLabelText, rerender } = render(
      <Button title="Load" onPress={() => {}} variant="secondary" loading />
    );
    // accessibilityLabel defaults to title
    expect(getByLabelText('Load')).toBeTruthy();
    rerender(<Button title="Load" onPress={() => {}} variant="secondary" />);
  });
});


