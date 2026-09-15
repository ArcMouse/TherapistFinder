import React, { useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function AppTextInput({ label, error, className = "", ...rest }: AppTextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-2 text-sm font-medium text-surface-600">{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor="#9AA1B4"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`h-14 rounded-xl border bg-white px-4 text-base text-surface-900 ${
          error ? "border-danger-500" : focused ? "border-primary-500" : "border-surface-200"
        } ${className}`}
        {...rest}
      />
      {error ? <Text className="mt-1 text-sm text-danger-500">{error}</Text> : null}
    </View>
  );
}

export default AppTextInput;