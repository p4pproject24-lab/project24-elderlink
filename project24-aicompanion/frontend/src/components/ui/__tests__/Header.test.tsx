import React from 'react';
import { render } from '@testing-library/react-native';
import Header from '../Header';
import Text from '../Text';

describe('Header', () => {
  it('renders title and left/right slots', () => {
    const { getByText } = render(
      <Header title="Title" left={<Text>Left</Text>} right={<Text>Right</Text>} />
    );
    expect(getByText('Title')).toBeTruthy();
    expect(getByText('Left')).toBeTruthy();
    expect(getByText('Right')).toBeTruthy();
  });
});


