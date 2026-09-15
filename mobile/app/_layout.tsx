import "../global.css";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { resolveRedirect } from "../src/lib/routing";
import { useAuth } from "../src/store/auth";
import { useOnboarding } from "../src/store/onboarding";

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { token, user, hydrated, hydrate } = useAuth();
  const hydrateOnboarding = useOnboarding((state) => state.hydrate);

  useEffect(() => {
    hydrate();
    hydrateOnboarding();
  }, [hydrate, hydrateOnboarding]);

  useEffect(() => {
    const target = resolveRedirect({
      hydrated,
      authenticated: Boolean(token && user),
      onboarded: Boolean(user?.profile?.onboarded),
      segment: segments[0],
    });
    if (target) {
      router.replace(target as never);
    }
  }, [hydrated, token, user, segments, router]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50">
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F8F9FC" } }} />;
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGate />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}