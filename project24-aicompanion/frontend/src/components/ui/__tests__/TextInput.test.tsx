import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TextInput from '../TextInput';

describe('TextInput', () => {
  it('renders placeholder and updates value', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <TextInput placeholder="Type here" value="" onChangeText={onChangeText} />
    );
    const input = getByPlaceholderText('Type here');
    fireEvent.changeText(input, 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('shows error state (branch coverage)', () => {
    const { getByText } = render(
      <TextInput placeholder="Type here" value="" onChangeText={() => {}} error="Required" />
    );
    // error text rendered
    expect(getByText('Required')).toBeTruthy();
  });
});


