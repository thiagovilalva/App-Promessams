import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AccessibilityContextValue = { textScale: number; setTextScale: (value: number) => void };
const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [textScale, setTextScaleState] = useState(1);
  useEffect(() => { AsyncStorage.getItem("sementes:text-scale").then((saved) => { const value = Number(saved); if ([1, 1.2, 1.4].includes(value)) setTextScaleState(value); }); }, []);
  const value = useMemo(() => ({ textScale, setTextScale: (next: number) => { setTextScaleState(next); void AsyncStorage.setItem("sementes:text-scale", String(next)); } }), [textScale]);
  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const value = useContext(AccessibilityContext);
  if (!value) throw new Error("useAccessibility must be used inside AccessibilityProvider");
  return value;
}
