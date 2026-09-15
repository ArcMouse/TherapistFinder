import React from "react";
import { Text, View } from "react-native";

export function RatingStars({ rating, count }: { rating: string | number; count?: number }) {
  const numeric = typeof rating === "string" ? Number.parseFloat(rating) : rating;
  const rounded = Math.round(numeric);
  return (
    <View className="flex-row items-center" accessibilityLabel={`Rated ${numeric} out of 5`}>
      <Text className="text-sm text-amber-500">
        {"★".repeat(Math.max(0, Math.min(5, rounded)))}
        <Text className="text-surface-200">{"★".repeat(Math.max(0, 5 - rounded))}</Text>
      </Text>
      <Text className="ml-1 text-sm font-medium text-surface-600">
        {numeric.toFixed(1)}
        {typeof count === "number" ? ` (${count})` : ""}
      </Text>
    </View>
  );
}

export default RatingStars;