import React from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

interface PrimaryButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}

const VARIANTS: Record<string, { container: string; text: string }> = {
  primary: { container: "bg-primary-500", text: "text-white" },
  secondary: { container: "bg-primary-50 border border-primary-100", text: "text-primary-600" },
  ghost: { container: "bg-transparent", text: "text-primary-600" },
  danger: { container: "bg-danger-500", text: "text-white" },
};

export function PrimaryButton({
  label,
  loading = false,
  variant = "primary",
  disabled,
  className = "",
  ...rest
}: PrimaryButtonProps) {
  const styles = VARIANTS[variant] ?? VARIANTS.primary;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`h-14 flex-row items-center justify-center rounded-xl2 px-5 shadow-sm ${
        styles.container
      } ${isDisabled ? "opacity-50" : "active:opacity-90"} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : "#6C63FF"} />
      ) : (
        <Text className={`text-base font-semibold ${styles.text}`}>{label}</Text>
      )}
    </Pressable>
  );
}

export default PrimaryButton;