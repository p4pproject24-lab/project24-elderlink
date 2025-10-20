import { act, renderHook } from '@testing-library/react-native';
import { useTTS } from '../useTTS';

jest.mock('../../services/ttsService', () => ({
  ttsService: {
    speak: jest.fn(async (_t: string, opts: any) => { opts.onStart?.(); opts.onDone?.(); }),
    stop: jest.fn(async () => {}),
  }
}));

describe('useTTS', () => {
  beforeEach(() => jest.clearAllMocks());

  it('speaks text, handles done, and stop', async () => {
    const { result } = renderHook(() => useTTS());
    await act(async () => {
      await result.current.speak('hello');
    });
    const svc = require('../../services/ttsService');
    expect(svc.ttsService.speak).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.currentText).toBe('');

    await act(async () => {
      await result.current.stop();
    });
    const t = require('../../services/ttsService');
    expect(t.ttsService.stop).toHaveBeenCalled();
  });

  it('speaking same text triggers stop and speak error path', async () => {
    const { result } = renderHook(() => useTTS());
    const svc = require('../../services/ttsService');
    // first speak
    await act(async () => {
      await result.current.speak('hello');
    });
    // mock speak to throw
    svc.ttsService.speak.mockRejectedValueOnce(new Error('tts boom'));
    // speaking a new text should catch error and reset state
    await act(async () => {
      try {
        await result.current.speak('new');
      } catch {}
    });
    expect(result.current.isSpeaking).toBe(false);
    // speaking same text again should early-stop
    await act(async () => {
      await result.current.speak('new');
    });
    expect(svc.ttsService.stop).toHaveBeenCalled();
  });

  it('onError branch only resets when matching current text', async () => {
    const { result } = renderHook(() => useTTS());
    const svc = require('../../services/ttsService');
    // speak text A
    await act(async () => {
      await result.current.speak('A');
    });
    // simulate onError from previous speak while a different text is current
    await act(async () => {
      await result.current.speak('B');
    });
    // call onError with A (should not reset because current is B inside hook logic)
    const firstOpts = svc.ttsService.speak.mock.calls[0][1];
    firstOpts.onError?.(new Error('x'));
    // previous onError should not affect current state
    expect(result.current.isSpeaking).toBe(false);
  });

  it('onStart callback is invoked when speaking', async () => {
    const { result } = renderHook(() => useTTS());
    const svc = require('../../services/ttsService');
    const onStartFn = jest.fn();
    await act(async () => {
      await result.current.speak('hello', { onStart: onStartFn });
    });
    expect(onStartFn).toHaveBeenCalled();
    expect(svc.ttsService.speak).toHaveBeenCalled();
  });

  it('stop handles error branch and resets state', async () => {
    const { result } = renderHook(() => useTTS());
    const svc = require('../../services/ttsService');
    await act(async () => {
      await result.current.speak('hello');
    });
    svc.ttsService.stop.mockRejectedValueOnce(new Error('stop boom'));
    await act(async () => {
      await result.current.stop();
    });
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.currentText).toBe('');
  });

  it('isCurrentTextSpeaking reflects global speaking state', async () => {
    const { result } = renderHook(() => useTTS());
    expect(result.current.isCurrentTextSpeaking('x')).toBe(false);
    await act(async () => {
      await result.current.speak('x');
    });
    // After speak completes (onDone), it should be false again
    expect(result.current.isCurrentTextSpeaking('x')).toBe(false);
  });

  it('onError for current speak resets state', async () => {
    const { result } = renderHook(() => useTTS());
    const svc = require('../../services/ttsService');
    await act(async () => {
      await result.current.speak('C');
    });
    // Grab options used for the last speak call and trigger onError for the same text
    const lastCall = svc.ttsService.speak.mock.calls[svc.ttsService.speak.mock.calls.length - 1];
    const opts = lastCall[1];
    act(() => {
      opts.onError?.(new Error('err'));
    });
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.currentText).toBe('');
  });

  it('rapid same-text calls trigger early stop path', async () => {
    const { result } = renderHook(() => useTTS());
    const svc = require('../../services/ttsService');
    await act(async () => {
      await result.current.speak('RAPID');
    });
    // speak same text again; should call stop early and not error
    await act(async () => {
      await result.current.speak('RAPID');
    });
    expect(svc.ttsService.stop).toHaveBeenCalled();
  });

  it('stop error still resets global and local state', async () => {
    const { result } = renderHook(() => useTTS());
    const svc = require('../../services/ttsService');
    await act(async () => { await result.current.speak('Z'); });
    svc.ttsService.stop.mockRejectedValueOnce(new Error('stop err'));
    await act(async () => { await result.current.stop(); });
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.currentText).toBe('');
  });

  it('stop during speak transitions to reset state', async () => {
    const { result } = renderHook(() => useTTS());
    const svc = require('../../services/ttsService');
    // Make speak not call onDone immediately; simulate long speech
    svc.ttsService.speak.mockImplementationOnce(async (_t: string, _opts: any) => {
      // do nothing (no onDone), emulate in-progress
    });
    await act(async () => {
      await result.current.speak('long');
    });
    await act(async () => {
      await result.current.stop();
    });
    expect(result.current.isSpeaking).toBe(false);
  });
});

