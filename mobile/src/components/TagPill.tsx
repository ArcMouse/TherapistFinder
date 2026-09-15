import React from "react";
import { Text, View } from "react-native";

const PALETTE = [
  { bg: "bg-primary-50", text: "text-primary-600" },
  { bg: "bg-accent-50", text: "text-accent-600" },
  { bg: "bg-surface-100", text: "text-surface-600" },
  { bg: "bg-danger-50", text: "text-danger-600" },
];

export function TagPill({
  label,
  tone = 0,
  size = "md",
}: {
  label: string;
  tone?: number;
  size?: "sm" | "md";
}) {
  const colors = PALETTE[tone % PALETTE.length];
  const padding = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  return (
    <View className={`mr-2 mb-2 rounded-full ${colors.bg} ${padding}`}>
      <Text className={`${textSize} font-medium ${colors.text}`}>{label}</Text>
    </View>
  );
}

export default TagPill;