/**
 * Test componentă — Button (folosind React Native Testing Library)
 */
import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../components/ui/Button';
import { ThemeProvider } from '../components/theme-provider';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('Button', () => {
  it('randează titlul', () => {
    const { getByText } = render(
      <Button title="Conectează-te" onPress={() => {}} />,
      { wrapper }
    );
    expect(getByText('Conectează-te')).toBeTruthy();
  });

  it('apelează onPress la tap', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Salvează" onPress={onPress} />,
      { wrapper }
    );
    fireEvent.press(getByText('Salvează'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('nu apelează onPress când e disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Salvează" onPress={onPress} disabled />,
      { wrapper }
    );
    fireEvent.press(getByText('Salvează'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
