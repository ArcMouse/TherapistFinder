import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { initials } from "../lib/format";

interface GoogleLogoProps {
  size?: number;
}

export function GoogleLogo({ size = 20 }: GoogleLogoProps) {
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      <Image
        source={{
          uri:
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.9 32.91 29.37 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.348 0-9.865-3.064-11.282-7.446l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>'
            ),
        }}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

interface GoogleButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function GoogleButton({ onPress, loading = false, disabled = false }: GoogleButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      testID="google-button"
      disabled={disabled || loading}
      onPress={onPress}
      className={`h-14 w-full flex-row items-center justify-center rounded-xl2 border border-surface-200 bg-white px-5 shadow-sm ${
        disabled || loading ? "opacity-60" : "active:opacity-90"
      }`}
    >
      <View className="mr-3">
        <GoogleLogo />
      </View>
      <Text className="text-base font-semibold text-surface-800">
        {loading ? "Signing in…" : "Continue with Google"}
      </Text>
    </Pressable>
  );
}

export function Avatar({
  uri,
  name,
  size = 56,
}: {
  uri?: string;
  name: string;
  size?: number;
}) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={dimension} accessibilityLabel={name} />;
  }
  return (
    <View
      style={dimension}
      className="items-center justify-center bg-primary-100"
      accessibilityLabel={name}
    >
      <Text className="font-semibold text-primary-600">{initials(name)}</Text>
    </View>
  );
}