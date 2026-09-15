import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { authApi } from "../../src/api/endpoints";
import { ErrorBanner } from "../../src/components/Banners";
import { AppTextInput } from "../../src/components/AppTextInput";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { extractApiError } from "../../src/lib/errors";
import { useAuth } from "../../src/store/auth";

type Mode = "signin" | "signup";

export default function EmailAuthScreen() {
  const router = useRouter();
  const setSession = useAuth((state) => state.setSession);

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    if (mode === "signup") {
      if (!name.trim()) next.name = "Please enter your name.";
      if (password !== confirmPassword) next.confirmPassword = "Passwords do not match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const session =
        mode === "signin"
          ? await authApi.login({ email: email.trim(), password })
          : await authApi.register({
              email: email.trim(),
              password,
              password_confirm: confirmPassword,
              name: name.trim(),
            });
      await setSession(session);
      router.replace(session.user.profile.onboarded ? "/(tabs)" : "/onboarding/language");
    } catch (err) {
      setError(extractApiError(err, "Authentication failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setError(null);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-surface-50"
    >
      <ScrollView contentContainerClassName="grow px-6 pt-16 pb-10" keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <Text className="text-lg text-surface-600">←</Text>
        </Pressable>

        <Text className="text-3xl font-bold text-surface-900">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </Text>
        <Text className="mt-1 text-sm text-surface-400">
          {mode === "signin"
            ? "Sign in with your email and password."
            : "Join MindEase in under a minute."}
        </Text>

        <View className="mt-6 flex-row rounded-xl2 bg-surface-100 p-1">
          {(["signin", "signup"] as Mode[]).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              testID={`mode-${option}`}
              onPress={() => switchMode(option)}
              className={`h-11 flex-1 items-center justify-center rounded-xl ${
                mode === option ? "bg-white shadow-sm" : ""
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  mode === option ? "text-primary-600" : "text-surface-400"
                }`}
              >
                {option === "signin" ? "Sign in" : "Sign up"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-6">
          <ErrorBanner message={error} />

          {mode === "signup" ? (
            <View className="mb-4">
              <AppTextInput
                label="Full name"
                testID="input-name"
                placeholder="Aarav Sharma"
                value={name}
                onChangeText={setName}
                error={errors.name}
                autoCapitalize="words"
              />
            </View>
          ) : null}

          <View className="mb-4">
            <AppTextInput
              label="Email"
              testID="input-email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View className="mb-4">
            <AppTextInput
              label="Password"
              testID="input-password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
            />
          </View>

          {mode === "signup" ? (
            <View className="mb-4">
              <AppTextInput
                label="Confirm password"
                testID="input-confirm-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={errors.confirmPassword}
                secureTextEntry
              />
            </View>
          ) : null}

          {mode === "signin" ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/auth/forgot")}
              className="mb-2 self-end"
            >
              <Text className="text-sm font-medium text-primary-600">Forgot password?</Text>
            </Pressable>
          ) : null}

          <PrimaryButton
            label={mode === "signin" ? "Sign in" : "Create account"}
            loading={loading}
            onPress={handleSubmit}
            testID="submit-button"
            className="mt-4"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}