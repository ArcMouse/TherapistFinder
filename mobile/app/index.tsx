import { ActivityIndicator, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-50">
      <ActivityIndicator color="#6C63FF" size="large" />
    </View>
  );
}