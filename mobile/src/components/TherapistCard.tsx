import React from "react";
import { Pressable, Text, View } from "react-native";
import { formatPrice } from "../lib/format";
import type { Therapist } from "../types";
import { Avatar } from "./GoogleButton";
import { RatingStars } from "./RatingStars";
import { TagPill } from "./TagPill";

export function TherapistCard({
  therapist,
  onPress,
}: {
  therapist: Therapist;
  onPress: () => void;
}) {
  const tags = (therapist.top_tags?.length ? therapist.top_tags : therapist.tags ?? []).slice(0, 2);
  const isAvailable = therapist.availability_badge !== "fully_booked";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Therapist ${therapist.name}`}
      testID={`therapist-card-${therapist.id}`}
      onPress={onPress}
      className="mb-4 flex-row rounded-xl2 bg-white p-4 shadow-sm active:opacity-95"
    >
      <Avatar uri={therapist.photo_url} name={therapist.name} size={72} />
      <View className="ml-4 flex-1">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text
              className="text-base font-semibold text-surface-900"
              numberOfLines={1}
              testID={`therapist-name-${therapist.id}`}
            >
              {therapist.name}
            </Text>
            <Text className="mt-0.5 text-sm text-surface-400" numberOfLines={1}>
              {therapist.degree}
            </Text>
          </View>
          <View
            className={`rounded-full px-2 py-1 ${
              isAvailable ? "bg-success-50" : "bg-surface-100"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isAvailable ? "text-success-500" : "text-surface-400"
              }`}
            >
              {isAvailable ? "Available" : "Booked"}
            </Text>
          </View>
        </View>

        <View className="mt-2 flex-row flex-wrap">
          {tags.map((tag, index) => (
            <TagPill key={tag} label={tag} tone={index} size="sm" />
          ))}
        </View>

        <View className="mt-1 flex-row items-center justify-between">
          <RatingStars rating={therapist.rating} />
          <Text className="text-base font-semibold text-primary-600">
            {formatPrice(therapist.session_price_inr)}
            <Text className="text-xs font-normal text-surface-400">/session</Text>
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default TherapistCard;