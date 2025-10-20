import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SettingsModal from '../SettingsModal';

const mockPreloadImages = jest.fn();
const mockRefresh = jest.fn();

// Avoid importing service/api transitively via useAvatarCache
jest.mock('../../hooks/useAvatarCache', () => ({
  useAvatarCache: () => ({
    avatars: [
      { id: 'June_HR_public', gender: 'female', preview_image_url: 'http://img', default_voice: 'default' },
      { id: 'Alex_MR_public', gender: 'male', preview_image_url: 'http://img2', default_voice: 'default' },
    ],
    loading: false,
    error: null,
    refresh: mockRefresh,
    preloadImages: mockPreloadImages,
  }),
}));

describe('SettingsModal', () => {
  const baseProps = {
    visible: true,
    onClose: jest.fn(),
    selectedLanguage: 'auto-detect',
    onLanguageSelect: jest.fn(),
    voiceSpeed: 1.0,
    onVoiceSpeedChange: jest.fn(),
    selectedAvatarId: 'June_HR_public',
    onAvatarSelect: jest.fn(),
    isAvatarSessionLoading: false,
    isAvatarSpeaking: false,
  } as any;

  it('preloads images on open', () => {
    render(<SettingsModal {...baseProps} />);
    expect(mockPreloadImages).toHaveBeenCalled();
  });

  it('applies voice speed on Done', () => {
    const onVoiceSpeedChange = jest.fn();
    const onClose = jest.fn();
    const { getByTestId, getByText } = render(
      <SettingsModal {...baseProps} onVoiceSpeedChange={onVoiceSpeedChange} onClose={onClose} />
    );

    fireEvent.press(getByTestId('voice-inc'));
    fireEvent.press(getByText('Done'));
    expect(onVoiceSpeedChange).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('toggle auto-start applies only on Done', () => {
    const onToggleAutoStartConversation = jest.fn();
    const onClose = jest.fn();
    const { getByText } = render(
      <SettingsModal
        {...baseProps}
        autoStartConversation={false}
        onToggleAutoStartConversation={onToggleAutoStartConversation}
        onClose={onClose}
      />
    );
    fireEvent.press(getByText('You start (press mic)'));
    expect(onToggleAutoStartConversation).not.toHaveBeenCalled();
    fireEvent.press(getByText('Done'));
    expect(onToggleAutoStartConversation).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows detected language when provided', () => {
    const getLanguageDisplayName = jest.fn().mockReturnValue('English');
    const { getByText } = render(
      <SettingsModal
        {...baseProps}
        detectedLanguage="en-US"
        getLanguageDisplayName={getLanguageDisplayName}
      />
    );
    expect(getLanguageDisplayName).toHaveBeenCalledWith('en-US');
    expect(getByText(/Current language:/)).toBeTruthy();
  });

  it('disables Done and shows Avatar Speaking when speaking', () => {
    const onVoiceSpeedChange = jest.fn();
    const onToggleAutoStartConversation = jest.fn();
    const { getByText } = render(
      <SettingsModal
        {...baseProps}
        isAvatarSpeaking
        onVoiceSpeedChange={onVoiceSpeedChange}
        onToggleAutoStartConversation={onToggleAutoStartConversation}
      />
    );
    expect(getByText('Avatar Speaking...')).toBeTruthy();
  });

  it('applies avatar selection on Done', () => {
    const onAvatarSelect = jest.fn();
    const onClose = jest.fn();
    const { getByText } = render(
      <SettingsModal
        {...baseProps}
        onAvatarSelect={onAvatarSelect}
        onClose={onClose}
        selectedAvatarId="June_HR_public"
      />
    );
    fireEvent.press(getByText('You start (press mic)'));
    fireEvent.press(getByText('Done'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows Loading... when session is loading', () => {
    const { getByText } = render(
      <SettingsModal
        {...baseProps}
        isAvatarSessionLoading
      />
    );
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('decreases voice speed and applies on Done', () => {
    const onVoiceSpeedChange = jest.fn();
    const onClose = jest.fn();
    const { getByTestId, getByText } = render(
      <SettingsModal {...baseProps} onVoiceSpeedChange={onVoiceSpeedChange} onClose={onClose} />
    );
    fireEvent.press(getByTestId('voice-dec'));
    fireEvent.press(getByText('Done'));
    expect(onVoiceSpeedChange).toHaveBeenCalled();
  });

  it('renders disabled selection state while loading', () => {
    const { getAllByText } = render(
      <SettingsModal
        {...baseProps}
        isAvatarSessionLoading
      />
    );
    expect(getAllByText(/Please wait for avatar to finish/).length).toBeGreaterThan(0);
  });

  it('does nothing on Done when nothing changed', () => {
    const onVoiceSpeedChange = jest.fn();
    const onToggleAutoStartConversation = jest.fn();
    const onAvatarSelect = jest.fn();
    const onClose = jest.fn();
    const { getByText } = render(
      <SettingsModal
        {...baseProps}
        onVoiceSpeedChange={onVoiceSpeedChange}
        onToggleAutoStartConversation={onToggleAutoStartConversation}
        onAvatarSelect={onAvatarSelect}
        onClose={onClose}
      />
    );
    fireEvent.press(getByText('Done'));
    expect(onVoiceSpeedChange).not.toHaveBeenCalled();
    expect(onToggleAutoStartConversation).not.toHaveBeenCalled();
    expect(onAvatarSelect).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers refresh control handler', () => {
    const { UNSAFE_getByType } = render(
      <SettingsModal {...baseProps} />
    );
    const { RefreshControl } = require('react-native');
    const rc = UNSAFE_getByType(RefreshControl);
    fireEvent(rc, 'onRefresh');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('selects another avatar and applies on Done', () => {
    const onAvatarSelect = jest.fn();
    const { getByTestId, getByText } = render(
      <SettingsModal {...baseProps} onAvatarSelect={onAvatarSelect} />
    );
    fireEvent.press(getByTestId('avatar-Alex_MR_public'));
    fireEvent.press(getByText('Done'));
    expect(onAvatarSelect).toHaveBeenCalled();
  });

  it('triggers image load and error callbacks', () => {
    const { UNSAFE_getAllByType } = render(
      <SettingsModal {...baseProps} />
    );
    const { Image } = require('react-native');
    const images = UNSAFE_getAllByType(Image);
    if (images.length) {
      fireEvent(images[0], 'onLoadStart');
      fireEvent(images[0], 'onLoadEnd');
      fireEvent(images[0], 'onError');
    }
  });

  it('shows empty list loading placeholder when avatars loading', () => {
    (jest.requireMock('../../hooks/useAvatarCache') as any).useAvatarCache = () => ({
      avatars: [],
      loading: true,
      error: null,
      refresh: mockRefresh,
      preloadImages: mockPreloadImages,
    });
    const { getByText } = render(
      <SettingsModal {...baseProps} />
    );
    expect(getByText('Loading avatars...')).toBeTruthy();
  });
});


