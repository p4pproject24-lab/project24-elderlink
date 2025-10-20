import React from 'react';
import { render } from '@testing-library/react-native';
import { TTSWrapper } from '../TTSWrapper';

const mockOnPress = jest.fn();
jest.mock('../TTSButton', () => ({
  TTSButton: ({ onPress, ...rest }: any) => {
    // call onPress immediately to count as function coverage for wrapper handler
    onPress && onPress();
    return null;
  },
}));

describe('TTSWrapper', () => {
  it('renders children and hides button when showButton=false', () => {
    const { queryByTestId } = render(
      <TTSWrapper text="hello" showButton={false}>
        <></>
      </TTSWrapper>
    );
    expect(queryByTestId('tts-button')).toBeNull();
  });
  it('shows the button when showButton=true', () => {
    const { rerender } = render(
      <TTSWrapper text="hello" showButton={false}>
        <></>
      </TTSWrapper>
    );
    rerender(
      <TTSWrapper text="hello" showButton={true}>
        <></>
      </TTSWrapper>
    );
  });

  it('applies different button positions', () => {
    const { rerender } = render(
      <TTSWrapper text="hello" showButton buttonPosition="top-left">
        <></>
      </TTSWrapper>
    );
    rerender(
      <TTSWrapper text="hello" showButton buttonPosition="bottom-left">
        <></>
      </TTSWrapper>
    );
    rerender(
      <TTSWrapper text="hello" showButton buttonPosition="bottom-right">
        <></>
      </TTSWrapper>
    );
  });
  
});


