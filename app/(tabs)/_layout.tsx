import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  const tabBarHeight = 59 + bottomPadding;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarButton: HapticTab, tabBarStyle: { paddingTop: 6, paddingBottom: bottomPadding, height: tabBarHeight, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 0.5 }, tabBarLabelStyle: { fontSize: 10, fontWeight: "700" } }}>
      <Tabs.Screen name="index" options={{ title: "Início", tabBarIcon: ({ color }) => <IconSymbol size={21} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="conteudos" options={{ title: "Conteúdos", tabBarIcon: ({ color }) => <IconSymbol size={21} name="book.closed.fill" color={color} /> }} />
      <Tabs.Screen name="chat" options={{ title: "Conversar", tabBarIcon: ({ color }) => <IconSymbol size={21} name="bubble.left.and.bubble.right.fill" color={color} /> }} />
      <Tabs.Screen name="ofertas" options={{ title: "Ofertas", tabBarIcon: ({ color }) => <IconSymbol size={21} name="heart.fill" color={color} /> }} />
    </Tabs>
  );
}
