import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import IconButton from '../IconButton';

describe('IconButton', () => {
  it('renders icon and handles press', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <IconButton name="add" onPress={onPress} />
    );
    const btn = getByTestId('icon-button');
    fireEvent.press(btn);
    expect(onPress).toHaveBeenCalled();
  });
});


