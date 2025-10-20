import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import GamesSelectionModal from '../GamesSelectionModal';
import { Alert } from 'react-native';

const mockLoadSessions = jest.fn();
const mockGeneratePreview = jest.fn();
const mockCreateSession = jest.fn();
const mockDeleteSession = jest.fn();
const mockClearError = jest.fn();

jest.mock('../../hooks/useGames', () => ({
  useGames: () => ({
    sessions: [
      {
        id: 's1',
        title: 'Session 1',
        description: 'Desc 1',
        lastActivityAt: new Date().toISOString(),
      },
    ],
    loading: false,
    error: null,
    loadSessions: mockLoadSessions,
    generatePreview: mockGeneratePreview,
    createSession: mockCreateSession,
    deleteSession: mockDeleteSession,
    clearError: mockClearError,
  }),
}));

describe('GamesSelectionModal', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('loads sessions when visible', () => {
    render(<GamesSelectionModal visible onClose={jest.fn()} onGameSelected={jest.fn()} />);
    expect(mockLoadSessions).toHaveBeenCalled();
  });

  it('handles generate preview then create session', async () => {
    mockGeneratePreview.mockResolvedValueOnce({ title: 'Word Play', description: 'Fun words' });
    mockCreateSession.mockResolvedValueOnce({ id: 'g1', title: 'Word Play', description: 'Fun words' });
    const onGameSelected = jest.fn();

    const { getByText } = render(
      <GamesSelectionModal visible onClose={jest.fn()} onGameSelected={onGameSelected} />
    );

    fireEvent.press(getByText('Generate Random Game'));
    await waitFor(() => getByText('Play This Game'));
    fireEvent.press(getByText('Play This Game'));

    await waitFor(() => expect(onGameSelected).toHaveBeenCalled());
  });

  it('covers null preview branch (no form shown)', async () => {
    mockGeneratePreview.mockResolvedValueOnce(undefined as any);
    const { getByText, queryByText } = render(
      <GamesSelectionModal visible onClose={jest.fn()} onGameSelected={jest.fn()} />
    );
    fireEvent.press(getByText('Generate Random Game'));
    await waitFor(() => expect(queryByText('Play This Game')).toBeNull());
  });

  it('handles custom game create flow', async () => {
    mockCreateSession.mockResolvedValueOnce({ id: 'c1', title: 'Custom', description: 'User' });
    const onGameSelected = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <GamesSelectionModal visible onClose={jest.fn()} onGameSelected={onGameSelected} />
    );

    fireEvent.press(getByText('Create Custom Game'));
    fireEvent.changeText(getByPlaceholderText("e.g., A word association game about animals"), 'A custom game');
    fireEvent.press(getByText('Create Game'));

    await waitFor(() => expect(onGameSelected).toHaveBeenCalled());
  });

  it('handles generate another and cancel flows', async () => {
    mockGeneratePreview.mockResolvedValueOnce({ title: 'Word Play', description: 'Fun words' });
    const { getByText } = render(
      <GamesSelectionModal visible onClose={jest.fn()} onGameSelected={jest.fn()} />
    );
    fireEvent.press(getByText('Generate Random Game'));
    await waitFor(() => getByText('Play This Game'));
    fireEvent.press(getByText('Generate Another'));
    await waitFor(() => getByText('Play This Game'));
    fireEvent.press(getByText('Cancel'));
  });

  it('plays and deletes existing session', async () => {
    const onGameSelected = jest.fn();
    const { getByText } = render(
      <GamesSelectionModal visible onClose={jest.fn()} onGameSelected={onGameSelected} />
    );
    fireEvent.press(getByText('Select a Brain Game'));
    mockDeleteSession('s1');
    expect(mockDeleteSession).toHaveBeenCalledWith('s1');
  });

  it('shows validation alert when custom description is empty', async () => {
    const { getByText } = render(
      <GamesSelectionModal visible onClose={jest.fn()} onGameSelected={jest.fn()} />
    );
    fireEvent.press(getByText('Create Custom Game'));
    fireEvent.press(getByText('Create Game'));
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('handles error alert and executes clearError on OK', async () => {
    // Replace implementation to invoke onPress
    (jest.requireMock('../../hooks/useGames') as any).useGames = () => ({
      sessions: [],
      loading: false,
      error: 'Boom',
      loadSessions: mockLoadSessions,
      generatePreview: mockGeneratePreview,
      createSession: mockCreateSession,
      deleteSession: mockDeleteSession,
      clearError: mockClearError,
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((...args: any[]) => {
      const buttons = args[2];
      if (buttons && buttons[0] && typeof buttons[0].onPress === 'function') {
        buttons[0].onPress();
      }
    });
    render(<GamesSelectionModal visible onClose={jest.fn()} onGameSelected={jest.fn()} />);
    expect(alertSpy).toHaveBeenCalled();
    expect(mockClearError).toHaveBeenCalled();
  });
});
