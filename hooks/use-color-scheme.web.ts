import { useThemeContext } from "@/lib/theme-provider";

// Text colors and NativeWind backgrounds must use the same product preference,
// not the browser/device Appearance setting. Provider starts light for SSR.
export function useColorScheme() {
  return useThemeContext().colorScheme;
}
