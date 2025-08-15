import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Button as NativeButton, IButtonProps, Text } from 'native-base';
import { theme } from '../core/theme';

interface ButtonProps extends IButtonProps {
  title: string;
  bordered?: boolean;
}

const Button: React.FC<ButtonProps> = ({ bordered = false, style, title, ...props }) => {
  return (
    <NativeButton
      w="100%"
      style={[styles.button, style] as any} // cast fixes TS error
      variant={bordered ? 'outline' : 'solid'}
      borderColor={bordered ? theme.colors.primary : undefined}
      bg={bordered ? theme.colors.surface : theme.colors.primary}
      _text={{
        color: bordered ? theme.colors.primary : theme.colors.secondary,
        fontWeight: 'bold',
        fontSize: 16,
        lineHeight: 26,
      }}
      {...props}
    >
      {title}
    </NativeButton>

  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: 10,
    borderRadius: 6,
  },
});

export default memo(Button);
