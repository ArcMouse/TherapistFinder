import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Describe what you need…",
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}) {
  return (
    <View className="mb-4 flex-row items-center rounded-xl2 border border-surface-200 bg-white px-4 shadow-sm">
      <Text className="mr-2 text-base text-surface-400">🔍</Text>
      <TextInput
        testID="search-bar"
        accessibilityLabel="Search therapists"
        className="h-14 flex-1 text-base text-surface-900"
        placeholder={placeholder}
        placeholderTextColor="#9AA1B4"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => {
            onChangeText("");
            onSubmit?.();
          }}
          className="p-2"
        >
          <Text className="text-surface-400">✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default SearchBar;