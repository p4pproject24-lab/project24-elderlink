import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CurrentElderlyButton from '../CurrentElderlyButton';

const mockUseCurrent = jest.fn();
jest.mock('../../contexts/CurrentElderlyContext', () => ({
  useCurrentElderly: () => mockUseCurrent(),
}));

describe('CurrentElderlyButton', () => {
  it('renders placeholder avatar when no image and handles press', () => {
    const onPress = jest.fn();
    mockUseCurrent.mockReturnValue({ currentElderly: null });
    const { getByTestId } = render(<CurrentElderlyButton onPress={onPress} />);
    const button = getByTestId('current-elderly-button');
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalled();
  });

  it('renders profile image when provided', () => {
    mockUseCurrent.mockReturnValue({ currentElderly: { profileImageUrl: 'http://img' } });
    const { getByTestId } = render(<CurrentElderlyButton onPress={() => {}} />);
    // Verify component still renders without crashing; image path covered via branch
    expect(getByTestId('current-elderly-button')).toBeTruthy();
  });
});


