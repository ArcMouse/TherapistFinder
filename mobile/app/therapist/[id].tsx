import { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { therapistApi } from "../../src/api/endpoints";
import { AvailabilityGrid } from "../../src/components/AvailabilityGrid";
import { EmptyState, ErrorBanner, SectionHeader } from "../../src/components/Banners";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { RatingStars } from "../../src/components/RatingStars";
import { TagPill } from "../../src/components/TagPill";
import { extractApiError } from "../../src/lib/errors";
import { currentWeek, formatDuration, formatPrice, weekdayShort } from "../../src/lib/format";
import { abbreviationForTimezone } from "../../src/lib/timezones";
import { useTimeZone } from "../../src/hooks/useTimeZone";
import type { Slot } from "../../src/types";

export default function TherapistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const timeZone = useTimeZone();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const week = useMemo(() => currentWeek(weekOffset), [weekOffset]);

  const detailQuery = useQuery({
    queryKey: ["therapist", id],
    queryFn: () => therapistApi.detail(id),
    enabled: Boolean(id),
  });

  const availabilityQuery = useQuery({
    queryKey: ["availability", id, week],
    queryFn: () => therapistApi.availability(id, week),
    enabled: Boolean(id),
  });

  if (detailQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50">
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 px-5 pt-16">
        <ErrorBanner message={extractApiError(detailQuery.error, "Could not load this therapist.")} />
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const therapist = detailQuery.data;
  const slots: Slot[] = availabilityQuery.data?.slots ?? [];

  return (
    <View testID="therapist-detail" className="flex-1 bg-surface-50">
      <ScrollView contentContainerClassName="pb-40" showsVerticalScrollIndicator={false}>
        <View className="relative">
          <Image
            source={{ uri: therapist.photo_url }}
            className="h-72 w-full rounded-b-3xl bg-surface-200"
            resizeMode="cover"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            className="absolute left-5 top-14 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
          >
            <Text className="text-lg text-surface-700">←</Text>
          </Pressable>
        </View>

        <View className="-mt-8 rounded-t-3xl bg-surface-50 px-5 pt-6">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-2xl font-bold text-surface-900" testID="detail-name">
                {therapist.name}
              </Text>
              <Text className="mt-1 text-sm text-surface-400" testID="detail-degree">
                {therapist.degree}
              </Text>
              <Text className="mt-1 text-sm font-medium text-accent-600">
                {therapist.experience_years} yrs experience
              </Text>
            </View>
            <View className="rounded-xl2 bg-white px-3 py-2 shadow-sm">
              <RatingStars rating={therapist.rating} />
            </View>
          </View>

          <View className="mt-4 flex-row flex-wrap">
            {(therapist.tags ?? []).map((tag, index) => (
              <TagPill key={tag} label={tag} tone={index} />
            ))}
          </View>

          <View className="mt-4">
            <SectionHeader title="About" />
            <Text className="text-sm leading-6 text-surface-600" testID="detail-bio">
              {therapist.bio}
            </Text>
          </View>

          <View className="mt-6 rounded-xl2 bg-white p-5 shadow-sm" testID="detail-pricing">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-surface-400">Session price</Text>
                <Text className="mt-1 text-2xl font-bold text-primary-600">
                  {formatPrice(therapist.session_price_inr)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-surface-400">Duration</Text>
                <Text className="mt-1 text-base font-semibold text-surface-800">
                  {formatDuration(therapist.session_duration_min)}
                </Text>
              </View>
            </View>
            <Text className="mt-3 text-xs text-surface-400">
              Billed in INR · Zoom session · Cancel anytime before the session
            </Text>
          </View>

          <View className="mt-6">
            <View className="flex-row items-center justify-between">
              <SectionHeader
                title="Weekly availability"
                subtitle={`Week ${week}`}
              />
              <View className="flex-row items-center">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous week"
                  onPress={() => {
                    setWeekOffset((value) => value - 1);
                    setSelected(null);
                  }}
                  className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
                >
                  <Text className="text-surface-600">‹</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next week"
                  onPress={() => {
                    setWeekOffset((value) => value + 1);
                    setSelected(null);
                  }}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
                >
                  <Text className="text-surface-600">›</Text>
                </Pressable>
              </View>
            </View>

            <View className="mb-3 flex-row flex-wrap">
              {(therapist.availabilities ?? []).map((rule) => (
                <View key={rule.id} className="mr-2 mb-2 rounded-full bg-white px-3 py-1">
                  <Text className="text-xs text-surface-600">
                    {weekdayShort(rule.weekday)} {rule.start_time.slice(0, 5)}–
                    {rule.end_time.slice(0, 5)} IST
                  </Text>
                </View>
              ))}
            </View>

            <Text className="mb-2 text-xs text-surface-400">
              Bookable times shown in your timezone ({abbreviationForTimezone(timeZone)}).
              Clinician schedule above is published in IST.
            </Text>

            {availabilityQuery.isLoading ? (
              <ActivityIndicator color="#6C63FF" />
            ) : availabilityQuery.error ? (
              <ErrorBanner message={extractApiError(availabilityQuery.error)} />
            ) : slots.length === 0 ? (
              <EmptyState title="No slots this week" subtitle="Try the next week." />
            ) : (
              <AvailabilityGrid
                slots={slots}
                selected={selected}
                onSelect={(slot) => setSelected(slot.start_dt)}
                timeZone={timeZone}
              />
            )}
            <Text className="mt-1 text-xs text-surface-400">
              Greyed-out times are already booked.
            </Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0 border-t border-surface-200 bg-white px-5 pt-3">
        <PrimaryButton
          label="Book Zoom Call"
          testID="book-cta"
          onPress={() =>
            router.push({
              pathname: "/booking/confirm",
              params: {
                therapistId: String(therapist.id),
                start: selected ?? "",
              },
            })
          }
        />
      </SafeAreaView>
    </View>
  );
}