import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { meApi } from "../../src/api/endpoints";
import { ErrorBanner } from "../../src/components/Banners";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { extractApiError } from "../../src/lib/errors";
import { useAuth } from "../../src/store/auth";
import { LANGUAGES, useOnboarding } from "../../src/store/onboarding";

export default function LanguageScreen() {
  const router = useRouter();
  const { language, setLanguage } = useOnboarding();
  const setUser = useAuth((state) => state.setUser);

  const [selected, setSelected] = useState(language);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    setLoading(true);
    try {
      await setLanguage(selected);
      const user = await meApi.update({ language: selected });
      await setUser(user);
      router.push("/onboarding/location");
    } catch (err) {
      setError(extractApiError(err, "Could not save your language."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-surface-50 px-6 pt-16">
      <StepDots step={1} total={2} />
      <Text className="mt-6 text-3xl font-bold text-surface-900">Choose your language</Text>
      <Text className="mt-1 text-sm text-surface-400">
        We&apos;ll use this for the app and session reminders. More languages are coming soon.
      </Text>

      <ScrollView className="mt-8" showsVerticalScrollIndicator={false}>
        <ErrorBanner message={error} />
        {LANGUAGES.map((option) => {
          const isSelected = selected === option.code;
          return (
            <Pressable
              key={option.code}
              testID={`language-${option.code}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: !option.enabled }}
              disabled={!option.enabled}
              onPress={() => setSelected(option.code)}
              className={`mb-3 flex-row items-center justify-between rounded-xl2 border p-4 ${
                isSelected ? "border-primary-500 bg-primary-50" : "border-surface-200 bg-white"
              } ${!option.enabled ? "opacity-50" : ""}`}
            >
              <View>
                <Text className="text-base font-semibold text-surface-900">{option.label}</Text>
                <Text className="text-sm text-surface-400">{option.native}</Text>
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
        <Text className="mt-2 text-xs text-surface-400">
          Hindi and Tamil are disabled in this release.
        </Text>
      </ScrollView>

      <PrimaryButton
        label="Continue"
        loading={loading}
        onPress={handleContinue}
        testID="language-continue"
        className="mb-8"
      />
    </View>
  );
}

export function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <View className="flex-row items-center">
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className={`mr-2 h-2 rounded-full ${
            index < step ? "w-6 bg-primary-500" : "w-2 bg-surface-200"
          }`}
        />
      ))}
      <Text className="ml-auto text-xs font-medium text-surface-400">
        Step {step} of {total}
      </Text>
    </View>
  );
}