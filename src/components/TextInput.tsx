import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Input, FormControl } from 'native-base';
import { theme } from '../core/theme';

interface TextInputProps {
  label?: string;
  errorText?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  [key: string]: any; // allow other props like keyboardType, etc.
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  errorText,
  ...props
}) => {
  return (
    <FormControl isInvalid={!!errorText} style={styles.container}>
      {label && <FormControl.Label _text={{ color: theme.colors.secondary }}>{label}</FormControl.Label>}
      <Input
        {...props}
        style={styles.input}
        selectionColor={theme.colors.primary}
        placeholderTextColor={theme.colors.secondary + '99'} // subtle placeholder
      />
      {errorText && <FormControl.ErrorMessage>{errorText}</FormControl.ErrorMessage>}
    </FormControl>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    width: '100%',
  },
  input: {
    color: theme.colors.secondary,
  },
});

export default memo(TextInput);
