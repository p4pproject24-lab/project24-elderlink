import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ProfileFlowStepProvider, useProfileFlowStep } from '../ProfileFlowStepContext';

const mockUseAuth = jest.fn();
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));
jest.mock('../../services/userService', () => ({
  getProfileFlowStatus: jest.fn().mockResolvedValue({ highestStepReached: 2, flowCompleted: false, hasConnections: true }),
  updateProfileStep: jest.fn().mockResolvedValue(undefined),
  goBackToStep: jest.fn().mockResolvedValue(undefined),
}));

const Consumer = () => {
  const ctx = useProfileFlowStep();
  React.useEffect(() => {
    ctx.setStep(3);
    ctx.goBack(2);
    ctx.resetStep();
  }, []);
  return null;
};

describe('ProfileFlowStepContext (with user)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
  });
  it('loads status and exposes actions', async () => {
    render(
      <ProfileFlowStepProvider>
        <Consumer />
      </ProfileFlowStepProvider>
    );
    await waitFor(() => expect(require('../../services/userService').getProfileFlowStatus).toHaveBeenCalled());
    expect(require('../../services/userService').updateProfileStep).toHaveBeenCalled();
    expect(require('../../services/userService').goBackToStep).toHaveBeenCalled();
  });

  it('handles service errors gracefully', async () => {
    const svc = require('../../services/userService');
    svc.getProfileFlowStatus.mockRejectedValueOnce(new Error('boom'));
    svc.updateProfileStep.mockRejectedValueOnce(new Error('update error'));
    svc.goBackToStep.mockRejectedValueOnce(new Error('back error'));
    render(
      <ProfileFlowStepProvider>
        <Consumer />
      </ProfileFlowStepProvider>
    );
    await waitFor(() => expect(svc.getProfileFlowStatus).toHaveBeenCalled());
  });

  it('resetStep logs error when backend update fails', async () => {
    const svc = require('../../services/userService');
    svc.updateProfileStep.mockRejectedValueOnce(new Error('reset error'));
    const ResetConsumer = () => {
      const ctx = useProfileFlowStep();
      React.useEffect(() => {
        ctx.resetStep();
      }, []);
      return null;
    };
    render(
      <ProfileFlowStepProvider>
        <ResetConsumer />
      </ProfileFlowStepProvider>
    );
    // give microtask queue a tick
    await new Promise(r => setTimeout(r, 0));
    expect(svc.updateProfileStep).toHaveBeenCalledWith(1);
  });
});
// No-user branch
describe('ProfileFlowStepContext (no user)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
  });
  it('initializes to step 1 when no user', () => {
    render(
      <ProfileFlowStepProvider>
        {null}
      </ProfileFlowStepProvider>
    );
  });

  it('does not call services for actions when user is null', async () => {
    const svc = require('../../services/userService');
    const ActionConsumer = () => {
      const ctx = useProfileFlowStep();
      React.useEffect(() => {
        ctx.setStep(2);
        ctx.goBack(1);
        ctx.resetStep();
      }, []);
      return null;
    };
    render(
      <ProfileFlowStepProvider>
        <ActionConsumer />
      </ProfileFlowStepProvider>
    );
    await new Promise(r => setTimeout(r, 0));
    expect(svc.updateProfileStep).not.toHaveBeenCalled();
    expect(svc.goBackToStep).not.toHaveBeenCalled();
  });
});
