import { Tabs } from "expo-router";
import { Text } from "react-native";

import { colors } from "../../src/theme/colors";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary600,
        tabBarInactiveTintColor: colors.surface400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.surface200,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Therapists",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "My Bookings",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}