import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { authApi, meApi } from "../../src/api/endpoints";
import { ErrorBanner } from "../../src/components/Banners";
import { Avatar } from "../../src/components/GoogleButton";
import { extractApiError } from "../../src/lib/errors";
import { labelForTimezone, TIMEZONES } from "../../src/lib/timezones";
import { useAuth } from "../../src/store/auth";
import { COUNTRIES, LANGUAGES } from "../../src/store/onboarding";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-surface-100 py-4">
      <Text className="text-sm text-surface-400">{label}</Text>
      <Text className="text-sm font-medium text-surface-800">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, refreshToken, clear, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tzOpen, setTzOpen] = useState(false);
  const [tzSaving, setTzSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeZone = user?.profile.preferred_timezone ?? "Asia/Kolkata";
  const languageLabel =
    LANGUAGES.find((l) => l.code === user?.profile.language)?.label ?? "English";
  const countryLabel =
    COUNTRIES.find((c) => c.code === user?.profile.country)?.label ?? "India";

  async function handleTimezone(value: string) {
    setTzSaving(true);
    setError(null);
    try {
      const updated = await meApi.update({ preferred_timezone: value });
      await setUser(updated);
      setTzOpen(false);
    } catch (err) {
      setError(extractApiError(err, "Could not update your timezone."));
    } finally {
      setTzSaving(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Best-effort: the local session is cleared regardless.
    } finally {
      await clear();
      queryClient.clear();
      router.replace("/auth");
      setLoading(false);
    }
  }

  return (
    <SafeAreaView testID="profile-screen" edges={["top"]} className="flex-1 bg-surface-50">
      <ScrollView contentContainerClassName="px-5 pb-10 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-surface-900">Profile</Text>

        <View className="mt-5 flex-row items-center rounded-xl2 bg-white p-5 shadow-sm">
          <Avatar name={user?.name ?? "User"} size={64} />
          <View className="ml-4 flex-1">
            <Text className="text-lg font-semibold text-surface-900">
              {user?.name ?? "MindEase user"}
            </Text>
            <Text className="text-sm text-surface-400">{user?.email}</Text>
          </View>
        </View>

        <View className="mt-5">
          <ErrorBanner message={error} />
        </View>

        <View className="mt-1 rounded-xl2 bg-white px-5 shadow-sm">
          <InfoRow label="Language" value={languageLabel} />
          <InfoRow label="Country" value={countryLabel} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change time zone"
            testID="timezone-select"
            onPress={() => setTzOpen(true)}
            className="flex-row items-center justify-between border-b border-surface-100 py-4"
          >
            <Text className="text-sm text-surface-400">Time zone</Text>
            <View className="flex-row items-center">
              <Text className="text-sm font-medium text-primary-600">
                {labelForTimezone(timeZone)}
              </Text>
              <Text className="ml-2 text-surface-400">›</Text>
            </View>
          </Pressable>
          <View className="flex-row items-center justify-between py-4">
            <Text className="text-sm text-surface-400">Onboarding</Text>
            <Text className="text-sm font-medium text-success-500">
              {user?.profile.onboarded ? "Complete" : "Incomplete"}
            </Text>
          </View>
        </View>

        <Text className="mt-3 px-1 text-xs text-surface-400">
          All session times are shown in your selected time zone.
        </Text>

        <Pressable
          accessibilityRole="button"
          testID="logout-button"
          onPress={handleLogout}
          disabled={loading}
          className="mt-6 h-14 items-center justify-center rounded-xl2 border border-danger-500/40 bg-danger-50"
        >
          <Text className="text-base font-semibold text-danger-600">
            {loading ? "Signing out…" : "Log out"}
          </Text>
        </Pressable>

        <Text className="mt-6 text-center text-xs text-surface-400">
          MindEase · v1.0.0 · Sessions via Zoom
        </Text>
      </ScrollView>

      <Modal visible={tzOpen} animationType="slide" transparent onRequestClose={() => setTzOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[75%] rounded-t-3xl bg-white p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-surface-900">Select time zone</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                testID="timezone-close"
                onPress={() => setTzOpen(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-surface-100"
              >
                <Text className="text-surface-600">✕</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {TIMEZONES.map((zone) => {
                const active = zone.value === timeZone;
                return (
                  <Pressable
                    key={zone.value}
                    testID={`timezone-${zone.value}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    disabled={tzSaving}
                    onPress={() => handleTimezone(zone.value)}
                    className={`mb-2 flex-row items-center justify-between rounded-xl2 border p-4 ${
                      active ? "border-primary-500 bg-primary-50" : "border-surface-200 bg-white"
                    }`}
                  >
                    <View>
                      <Text className="text-base font-semibold text-surface-900">{zone.abbr}</Text>
                      <Text className="text-sm text-surface-400">{zone.label}</Text>
                    </View>
                    {active ? <Text className="text-primary-600">✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}