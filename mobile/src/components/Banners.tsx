import React from "react";
import { Text, View } from "react-native";

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View
      accessibilityRole="alert"
      testID="error-banner"
      className="mb-4 rounded-xl border border-danger-500/30 bg-danger-50 px-4 py-3"
    >
      <Text className="text-sm font-medium text-danger-600">{message}</Text>
    </View>
  );
}

export function SuccessBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View className="mb-4 rounded-xl border border-success-500/30 bg-success-50 px-4 py-3">
      <Text className="text-sm font-medium text-success-500">{message}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-center text-lg font-semibold text-surface-800">{title}</Text>
      {subtitle ? (
        <Text className="mt-2 text-center text-sm text-surface-400">{subtitle}</Text>
      ) : null}
      {action ? <View className="mt-6">{action}</View> : null}
    </View>
  );
}

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="mb-3">
      <Text className="text-base font-semibold text-surface-900">{title}</Text>
      {subtitle ? <Text className="mt-0.5 text-sm text-surface-400">{subtitle}</Text> : null}
    </View>
  );
}