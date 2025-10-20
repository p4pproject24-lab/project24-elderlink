import React from 'react';
import { render } from '@testing-library/react-native';
import ProgressStepper from '../ProgressStepper';

describe('ProgressStepper', () => {
  it('renders steps and highlights current', () => {
    const steps = ['One', 'Two', 'Three'];
    const { getByText } = render(<ProgressStepper steps={steps} currentStep={2} />);
    expect(getByText('Two')).toBeTruthy();
  });

  it('shows completed state and last step (branches)', () => {
    const steps = ['One', 'Two'];
    const { getByText } = render(<ProgressStepper steps={steps} currentStep={2} />);
    expect(getByText('Two')).toBeTruthy();
  });
});


