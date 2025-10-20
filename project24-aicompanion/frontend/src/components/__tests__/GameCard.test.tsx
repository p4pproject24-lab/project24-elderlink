import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GameCard from '../GameCard';
import * as RN from 'react-native';

const session = {
  id: '1',
  userId: 'u',
  title: 'Logic Labyrinth',
  description: 'Solve puzzles through conversation',
  gameType: 'generated',
  userDescription: '',
  lastActivityAt: new Date().toISOString(),
} as any;

describe('GameCard', () => {
  it('renders and triggers actions', () => {
    const onPlay = jest.fn();
    const onDelete = jest.fn();
    const { getByText, getAllByTestId } = render(
      <GameCard session={session} onPlay={onPlay} onDelete={onDelete} />
    );
    expect(getByText('Logic Labyrinth')).toBeTruthy();
    const buttons = getAllByTestId('gamecard-button');
    fireEvent.press(buttons[0]); // play
    fireEvent.press(buttons[1]); // delete
    expect(onPlay).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });

  it('renders with dark theme branch', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark' as any);
    const { getByText } = render(
      <GameCard session={session} onPlay={jest.fn()} onDelete={jest.fn()} />
    );
    expect(getByText('Logic Labyrinth')).toBeTruthy();
  });
});


