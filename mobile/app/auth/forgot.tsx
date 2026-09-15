import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { authApi } from "../../src/api/endpoints";
import { ErrorBanner, SuccessBanner } from "../../src/components/Banners";
import { AppTextInput } from "../../src/components/AppTextInput";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { extractApiError } from "../../src/lib/errors";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await authApi.passwordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(extractApiError(err, "Could not send the reset email."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-surface-50 px-6 pt-16">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => router.back()}
        className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
      >
        <Text className="text-lg text-surface-600">←</Text>
      </Pressable>

      <Text className="text-3xl font-bold text-surface-900">Reset password</Text>
      <Text className="mt-1 text-sm text-surface-400">
        Enter your email and we&apos;ll send you a reset link.
      </Text>

      <View className="mt-8">
        <ErrorBanner message={error} />
        <SuccessBanner
          message={sent ? "If an account exists, a reset link is on its way." : null}
        />
        <View className="mb-4">
          <AppTextInput
            label="Email"
            testID="forgot-email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <PrimaryButton label="Send reset link" loading={loading} onPress={handleSubmit} />
      </View>
    </View>
  );
}