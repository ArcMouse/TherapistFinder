import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  dayKeyInZone,
  formatInZone,
  formatTime,
  weekdayIndexInZone,
  weekdayLong,
} from "../lib/format";
import { DEFAULT_TIMEZONE } from "../lib/timezones";
import type { Slot } from "../types";

function groupByDay(slots: Slot[], timeZone: string) {
  const groups: { key: string; weekday: number; sample: Date; slots: Slot[] }[] = [];
  for (const slot of slots) {
    const date = new Date(slot.start_dt);
    const key = dayKeyInZone(date, timeZone);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        weekday: weekdayIndexInZone(date, timeZone),
        sample: date,
        slots: [],
      };
      groups.push(group);
    }
    group.slots.push(slot);
  }
  return groups;
}

export function AvailabilityGrid({
  slots,
  selected,
  onSelect,
  timeZone = DEFAULT_TIMEZONE,
}: {
  slots: Slot[];
  selected?: string | null;
  onSelect?: (slot: Slot) => void;
  timeZone?: string;
}) {
  const groups = groupByDay(slots, timeZone);

  if (groups.length === 0) {
    return (
      <View className="rounded-xl2 bg-surface-100 p-4">
        <Text className="text-sm text-surface-400">
          No published slots this week. Try the next week.
        </Text>
      </View>
    );
  }

  return (
    <View testID="availability-grid">
      {groups.map((group) => (
        <View key={group.key} className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-surface-600">
            {weekdayLong(group.weekday)} ·{" "}
            {formatInZone(group.sample, timeZone, { day: "numeric", month: "short" })}
          </Text>
          <View className="flex-row flex-wrap">
            {group.slots.map((slot) => {
              const isSelected = selected === slot.start_dt;
              const state = slot.booked
                ? "border-surface-200 bg-surface-100"
                : isSelected
                ? "border-primary-500 bg-primary-500"
                : "border-surface-200 bg-white";
              const textState = slot.booked
                ? "text-surface-400 line-through"
                : isSelected
                ? "text-white"
                : "text-surface-800";
              return (
                <Pressable
                  key={slot.start_dt}
                  testID={`slot-${slot.start_dt}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: slot.booked, selected: isSelected }}
                  disabled={slot.booked}
                  onPress={() => onSelect?.(slot)}
                  className={`mr-2 mb-2 rounded-xl border px-3 py-2 ${state}`}
                >
                  <Text className={`text-sm font-medium ${textState}`}>
                    {formatTime(slot.start_dt, timeZone)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

export default AvailabilityGrid;