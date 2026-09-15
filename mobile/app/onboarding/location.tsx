import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { meApi } from "../../src/api/endpoints";
import { ErrorBanner } from "../../src/components/Banners";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { extractApiError } from "../../src/lib/errors";
import { useAuth } from "../../src/store/auth";
import { COUNTRIES, useOnboarding } from "../../src/store/onboarding";
import { StepDots } from "./language";

export default function LocationScreen() {
  const router = useRouter();
  const { country, setCountry } = useOnboarding();
  const setUser = useAuth((state) => state.setUser);

  const [selected, setSelected] = useState(country || "IN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish() {
    setError(null);
    setLoading(true);
    try {
      await setCountry(selected);
      const user = await meApi.update({ country: selected, onboarded: true });
      await setUser(user);
      router.replace("/(tabs)");
    } catch (err) {
      setError(extractApiError(err, "Could not save your location."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-surface-50 px-6 pt-16">
      <StepDots step={2} total={2} />
      <Text className="mt-6 text-3xl font-bold text-surface-900">Where are you based?</Text>
      <Text className="mt-1 text-sm text-surface-400">
        We&apos;ll show therapists licensed to practise in your region.
      </Text>

      <View className="mt-8">
        <ErrorBanner message={error} />
        {COUNTRIES.map((option) => {
          const isSelected = selected === option.code;
          return (
            <Pressable
              key={option.code}
              testID={`country-${option.code}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => setSelected(option.code)}
              className={`mb-3 flex-row items-center justify-between rounded-xl2 border p-4 ${
                isSelected ? "border-primary-500 bg-primary-50" : "border-surface-200 bg-white"
              }`}
            >
              <View className="flex-row items-center">
                <Text className="mr-3 text-2xl">{option.flag}</Text>
                <Text className="text-base font-semibold text-surface-900">{option.label}</Text>
              </View>
              <View
                className={`h-6 w-6 items-center justify-center rounded-full border ${
                  isSelected ? "border-primary-500 bg-primary-500" : "border-surface-400"
                }`}
              >
                {isSelected ? <Text className="text-xs text-white">✓</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-1" />
      <PrimaryButton
        label="Finish setup"
        loading={loading}
        onPress={handleFinish}
        testID="location-finish"
        className="mb-8"
      />
    </View>
  );
}