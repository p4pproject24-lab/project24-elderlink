import React from 'react';
import { render } from '@testing-library/react-native';
import ScreenContainer from '../ScreenContainer';
import Text from '../Text';

describe('ScreenContainer', () => {
  it('renders children non-scrollable', () => {
    const { getByText } = render(
      <ScreenContainer>
        <Text>Content</Text>
      </ScreenContainer>
    );
    expect(getByText('Content')).toBeTruthy();
  });

  it('renders children scrollable', () => {
    const { getByText } = render(
      <ScreenContainer scrollable>
        <Text>Scrollable</Text>
      </ScreenContainer>
    );
    expect(getByText('Scrollable')).toBeTruthy();
  });
});


