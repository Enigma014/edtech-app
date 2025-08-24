import React, { useState } from "react";
import { TextInput as RNTextInput, StyleSheet, View, Text } from "react-native";
import { theme } from "../core/theme";

interface Props {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  errorText?: string;
  placeholder?: string;
  error?: boolean;
  autoComplete?:string
}

const TextInput: React.FC<Props> = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  errorText,
  placeholder,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          { borderColor: isFocused ? theme.colors.primary : theme.colors.secondary + "66" },
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.secondary + "99"}
        selectionColor={theme.colors.primary}
      />
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    width: "100%",
  },
  label: {
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.secondary,
    fontSize: 16,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});

export default TextInput;
