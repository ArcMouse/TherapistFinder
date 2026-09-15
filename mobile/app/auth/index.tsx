import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { authApi } from "../../src/api/endpoints";
import { ErrorBanner } from "../../src/components/Banners";
import { GoogleButton } from "../../src/components/GoogleButton";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import {
  GOOGLE_DISCOVERY,
  buildGoogleRequestConfig,
  getDevGoogleToken,
  getGoogleClientId,
  promptGoogleIdToken,
} from "../../src/lib/google";
import { useAuth } from "../../src/store/auth";

WebBrowser.maybeCompleteAuthSession();

export default function AuthChoiceScreen() {
  const router = useRouter();
  const setSession = useAuth((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [, response, promptAsync] = AuthSession.useAuthRequest(
    buildGoogleRequestConfig(),
    GOOGLE_DISCOVERY
  );

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = (response.params as Record<string, string>).id_token;
      if (idToken) {
        void completeGoogleSignIn(idToken);
      }
    } else if (response?.type === "error") {
      setError("Google sign-in failed. Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  async function completeGoogleSignIn(idToken: string) {
    try {
      const session = await authApi.google(idToken);
      await setSession(session);
      router.replace(session.user.profile.onboarded ? "/(tabs)" : "/onboarding/language");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed. Please try again.";
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleGooglePress() {
    setError(null);
    setGoogleLoading(true);

    const devToken = getDevGoogleToken();
    if (!getGoogleClientId()) {
      if (devToken) {
        await completeGoogleSignIn(devToken);
        return;
      }
      setGoogleLoading(false);
      setError(
        "Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID to enable it."
      );
      return;
    }

    const result = await promptGoogleIdToken(promptAsync);
    if (result.type === "success") {
      await completeGoogleSignIn(result.idToken);
    } else if (result.type === "error") {
      setError(result.message);
      setGoogleLoading(false);
    } else {
      setGoogleLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-surface-50">
      <ScrollView contentContainerClassName="grow" showsVerticalScrollIndicator={false}>
        <View className="relative overflow-hidden bg-primary-500 px-8 pb-16 pt-24">
          <View className="absolute -right-16 -top-10 h-48 w-48 rounded-full bg-white/10" />
          <View className="absolute -left-10 top-32 h-32 w-32 rounded-full bg-accent-500/30" />
          <Text className="text-4xl font-bold text-white">MindEase</Text>
          <Text className="mt-3 max-w-xs text-base leading-6 text-white/90">
            Find the right therapist for you — with natural-language search, real
            availability and one-tap Zoom sessions.
          </Text>
        </View>

        <View className="-mt-8 flex-1 rounded-t-3xl bg-surface-50 px-6 pt-8">
          <Text className="text-2xl font-bold text-surface-900">Welcome</Text>
          <Text className="mt-1 text-sm text-surface-400">
            Sign in to continue. Your data stays private and secure.
          </Text>

          <View className="mt-8">
            <ErrorBanner message={error} />

            <GoogleButton onPress={handleGooglePress} loading={googleLoading} />

            <View className="my-5 flex-row items-center">
              <View className="h-px flex-1 bg-surface-200" />
              <Text className="mx-3 text-xs uppercase text-surface-400">or</Text>
              <View className="h-px flex-1 bg-surface-200" />
            </View>

            <PrimaryButton
              label="Continue with Email"
              variant="secondary"
              onPress={() => router.push("/auth/email")}
              testID="email-button"
            />

            <Text className="mt-8 text-center text-xs leading-5 text-surface-400">
              By continuing you agree to our{" "}
              <Text className="text-primary-600">Terms &amp; Privacy</Text>.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}