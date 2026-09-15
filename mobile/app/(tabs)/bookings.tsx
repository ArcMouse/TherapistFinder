import { useMemo } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { bookingApi } from "../../src/api/endpoints";
import { EmptyState, ErrorBanner } from "../../src/components/Banners";
import { Avatar } from "../../src/components/GoogleButton";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { extractApiError } from "../../src/lib/errors";
import { formatDateTime, formatDuration, formatPrice } from "../../src/lib/format";
import { abbreviationForTimezone } from "../../src/lib/timezones";
import { useTimeZone } from "../../src/hooks/useTimeZone";
import type { Booking } from "../../src/types";

function BookingRow({
  booking,
  onCancel,
  cancelling,
  canCancel,
  timeZone,
}: {
  booking: Booking;
  onCancel: () => void;
  cancelling: boolean;
  canCancel: boolean;
  timeZone: string;
}) {
  const cancelled = booking.status === "cancelled";
  const durationMin = Math.round(
    (new Date(booking.end_dt).getTime() - new Date(booking.start_dt).getTime()) / 60000
  );

  return (
    <View
      testID={`booking-${booking.id}`}
      className={`mb-4 rounded-xl2 bg-white p-4 shadow-sm ${cancelled ? "opacity-60" : ""}`}
    >
      <View className="flex-row">
        <Avatar uri={booking.therapist_photo_url} name={booking.therapist_name} size={52} />
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-surface-900">{booking.therapist_name}</Text>
          <Text className="text-sm text-surface-400">{booking.therapist_degree}</Text>
          <Text className="mt-1 text-sm font-medium text-primary-600">
            {formatDateTime(booking.start_dt, timeZone)}
            <Text className="text-xs font-normal text-surface-400">
              {"  "}
              {abbreviationForTimezone(timeZone)}
            </Text>
          </Text>
          <Text className="text-xs text-surface-400">
            {formatDuration(durationMin)} · {formatPrice(booking.session_price_inr)}
          </Text>
        </View>
        <View
          className={`h-7 self-start rounded-full px-2 ${
            cancelled ? "bg-surface-100" : "bg-success-50"
          } justify-center`}
        >
          <Text
            className={`text-xs font-semibold ${
              cancelled ? "text-surface-400" : "text-success-500"
            }`}
          >
            {booking.status}
          </Text>
        </View>
      </View>

      {booking.zoom_link && !cancelled ? (
        <View className="mt-3 rounded-xl bg-surface-100 px-3 py-2">
          <Text className="text-xs text-surface-400">Zoom link</Text>
          <Text className="text-sm text-primary-600" numberOfLines={1}>
            {booking.zoom_link}
          </Text>
        </View>
      ) : null}

      {canCancel ? (
        <Pressable
          accessibilityRole="button"
          testID={`cancel-${booking.id}`}
          disabled={cancelling}
          onPress={onCancel}
          className="mt-3 h-11 items-center justify-center rounded-xl border border-danger-500/40 bg-danger-50"
        >
          <Text className="text-sm font-semibold text-danger-600">
            {cancelling ? "Cancelling…" : "Cancel booking"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function BookingsScreen() {
  const queryClient = useQueryClient();
  const timeZone = useTimeZone();

  const bookingsQuery = useQuery({ queryKey: ["bookings"], queryFn: bookingApi.list });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => bookingApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["therapists"] });
    },
  });

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const all = bookingsQuery.data ?? [];
    return {
      upcoming: all.filter(
        (b) => b.status !== "cancelled" && new Date(b.end_dt).getTime() >= now
      ),
      past: all.filter(
        (b) => b.status === "cancelled" || new Date(b.end_dt).getTime() < now
      ),
    };
  }, [bookingsQuery.data]);

  function confirmCancel(booking: Booking) {
    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      const ok = typeof globalThis.confirm === "function" ? globalThis.confirm("Cancel this booking?") : true;
      if (ok) cancelMutation.mutate(booking.id);
      return;
    }
    Alert.alert("Cancel booking", "This will release your slot. Continue?", [
      { text: "Keep", style: "cancel" },
      { text: "Cancel booking", style: "destructive", onPress: () => cancelMutation.mutate(booking.id) },
    ]);
  }

  return (
    <SafeAreaView testID="bookings-screen" edges={["top"]} className="flex-1 bg-surface-50">
      <ScrollView contentContainerClassName="px-5 pb-10 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-surface-900">My bookings</Text>
        <Text className="mb-5 text-sm text-surface-400">
          Manage your upcoming and past therapy sessions.
        </Text>

        {bookingsQuery.isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#6C63FF" />
          </View>
        ) : bookingsQuery.error ? (
          <View>
            <ErrorBanner message={extractApiError(bookingsQuery.error, "Could not load bookings.")} />
            <PrimaryButton label="Retry" onPress={() => bookingsQuery.refetch()} />
          </View>
        ) : (bookingsQuery.data ?? []).length === 0 ? (
          <EmptyState
            title="No bookings yet"
            subtitle="Find a therapist and book your first Zoom session."
          />
        ) : (
          <>
            <Text className="mb-3 text-base font-semibold text-surface-600">Upcoming</Text>
            {upcoming.length === 0 ? (
              <Text className="mb-6 text-sm text-surface-400">No upcoming sessions.</Text>
            ) : (
              upcoming.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  canCancel
                  cancelling={cancelMutation.isPending && cancelMutation.variables === booking.id}
                  onCancel={() => confirmCancel(booking)}
                  timeZone={timeZone}
                />
              ))
            )}

            <Text className="mb-3 mt-4 text-base font-semibold text-surface-600">
              Past &amp; cancelled
            </Text>
            {past.length === 0 ? (
              <Text className="text-sm text-surface-400">Nothing here yet.</Text>
            ) : (
              past.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  canCancel={false}
                  cancelling={false}
                  onCancel={() => undefined}
                  timeZone={timeZone}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}