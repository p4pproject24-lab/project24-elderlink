import React from 'react';
import { render } from '@testing-library/react-native';
import Card from '../Card';
import Text from '../Text';

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Card>
        <Text>Inside</Text>
      </Card>
    );
    expect(getByText('Inside')).toBeTruthy();
  });

  it('renders highlight branch', () => {
    const { getByText } = render(
      <Card highlight>
        <Text>Highlight</Text>
      </Card>
    );
    expect(getByText('Highlight')).toBeTruthy();
  });
});


