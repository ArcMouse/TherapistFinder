import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { bookingApi, therapistApi } from "../../src/api/endpoints";
import { AvailabilityGrid } from "../../src/components/AvailabilityGrid";
import { ErrorBanner, SuccessBanner } from "../../src/components/Banners";
import { Avatar } from "../../src/components/GoogleButton";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { extractApiError } from "../../src/lib/errors";
import { currentWeek, formatDateTime, formatDuration, formatPrice } from "../../src/lib/format";
import { abbreviationForTimezone } from "../../src/lib/timezones";
import { useTimeZone } from "../../src/hooks/useTimeZone";

export default function ConfirmBookingScreen() {
  const { therapistId, start } = useLocalSearchParams<{ therapistId: string; start?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const timeZone = useTimeZone();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<string>(start || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const week = useMemo(() => currentWeek(weekOffset), [weekOffset]);

  const detailQuery = useQuery({
    queryKey: ["therapist", therapistId],
    queryFn: () => therapistApi.detail(therapistId),
    enabled: Boolean(therapistId),
  });

  const availabilityQuery = useQuery({
    queryKey: ["availability", therapistId, week],
    queryFn: () => therapistApi.availability(therapistId, week),
    enabled: Boolean(therapistId),
  });

  useEffect(() => {
    if (start) setSelected(start);
  }, [start]);

  const bookMutation = useMutation({
    mutationFn: () => bookingApi.create(Number(therapistId), selected),
    onSuccess: async () => {
      setSuccess(true);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["availability"] });
      await queryClient.invalidateQueries({ queryKey: ["therapists"] });
      router.replace("/(tabs)/bookings");
    },
    onError: (err) => setError(extractApiError(err, "Could not complete the booking.")),
  });

  const therapist = detailQuery.data;
  const slots = availabilityQuery.data?.slots ?? [];
  const selectedSlot = slots.find((slot) => slot.start_dt === selected);

  if (detailQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50">
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView testID="booking-confirm" className="flex-1 bg-surface-50">
      <ScrollView contentContainerClassName="px-5 pb-40 pt-4" showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <Text className="text-lg text-surface-600">←</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-surface-900">Confirm your session</Text>
        <Text className="mb-5 text-sm text-surface-400">
          Pick a time slot and confirm. You&apos;ll get a Zoom link instantly.
        </Text>

        <ErrorBanner message={error} />
        <SuccessBanner message={success ? "Booking confirmed! Redirecting…" : null} />

        {therapist ? (
          <View className="mb-5 flex-row items-center rounded-xl2 bg-white p-4 shadow-sm">
            <Avatar uri={therapist.photo_url} name={therapist.name} size={52} />
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-surface-900">{therapist.name}</Text>
              <Text className="text-sm text-surface-400">{therapist.degree}</Text>
            </View>
            <Text className="text-base font-semibold text-primary-600">
              {formatPrice(therapist.session_price_inr)}
            </Text>
          </View>
        ) : null}

        <View className="mb-5 rounded-xl2 bg-white p-4 shadow-sm">
          <Text className="mb-2 text-sm font-semibold text-surface-600">Choose a time slot</Text>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xs text-surface-400">
              Week {week} · {abbreviationForTimezone(timeZone)}
            </Text>
            <View className="flex-row">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous week"
                onPress={() => {
                  setWeekOffset((v) => v - 1);
                  setSelected("");
                }}
                className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-surface-100"
              >
                <Text className="text-surface-600">‹</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next week"
                onPress={() => {
                  setWeekOffset((v) => v + 1);
                  setSelected("");
                }}
                className="h-8 w-8 items-center justify-center rounded-full bg-surface-100"
              >
                <Text className="text-surface-600">›</Text>
              </Pressable>
            </View>
          </View>

          {availabilityQuery.isLoading ? (
            <ActivityIndicator color="#6C63FF" />
          ) : (
            <AvailabilityGrid
              slots={slots}
              selected={selected}
              onSelect={(slot) => setSelected(slot.start_dt)}
              timeZone={timeZone}
            />
          )}
        </View>

        <View className="rounded-xl2 bg-white p-4 shadow-sm" testID="booking-summary">
          <Text className="mb-3 text-sm font-semibold text-surface-600">Summary</Text>
          <SummaryRow label="Therapist" value={therapist?.name ?? "—"} />
          <SummaryRow
            label="Date & time"
            value={selectedSlot ? formatDateTime(selectedSlot.start_dt, timeZone) : "Not selected"}
          />
          <SummaryRow
            label="Timezone"
            value={`${abbreviationForTimezone(timeZone)} (${timeZone})`}
          />
          <SummaryRow
            label="Duration"
            value={therapist ? formatDuration(therapist.session_duration_min) : "—"}
          />
          <SummaryRow
            label="Price"
            value={therapist ? formatPrice(therapist.session_price_inr) : "—"}
            emphasize
          />
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0 border-t border-surface-200 bg-white px-5 pt-3">
        <PrimaryButton
          label="Confirm & Book"
          testID="confirm-book"
          disabled={!selected}
          loading={bookMutation.isPending}
          onPress={() => {
            setError(null);
            bookMutation.mutate();
          }}
        />
      </SafeAreaView>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-surface-100 py-3 last:border-b-0">
      <Text className="text-sm text-surface-400">{label}</Text>
      <Text
        className={`text-sm font-semibold ${emphasize ? "text-primary-600" : "text-surface-800"}`}
      >
        {value}
      </Text>
    </View>
  );
}