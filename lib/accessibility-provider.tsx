import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SpeechVoiceGender = "female" | "male";
type AccessibilityContextValue = { textScale: number; setTextScale: (value: number) => void; speechRate: number; setSpeechRate: (value: number) => void; speechVoice: SpeechVoiceGender; setSpeechVoice: (value: SpeechVoiceGender) => void };
const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [textScale, setTextScaleState] = useState(1);
  const [speechRate, setSpeechRateState] = useState(0.9);
  const [speechVoice, setSpeechVoiceState] = useState<SpeechVoiceGender>("female");
  useEffect(() => { AsyncStorage.multiGet(["sementes:text-scale", "sementes:speech-rate", "sementes:speech-voice"]).then((entries) => { const scale = Number(entries[0][1]); const rate = Number(entries[1][1]); const voice = entries[2][1]; if ([1, 1.2, 1.4].includes(scale)) setTextScaleState(scale); if ([0.8, 0.9, 1].includes(rate)) setSpeechRateState(rate); if (voice === "female" || voice === "male") setSpeechVoiceState(voice); }); }, []);
  const value = useMemo(() => ({ textScale, setTextScale: (next: number) => { setTextScaleState(next); void AsyncStorage.setItem("sementes:text-scale", String(next)); }, speechRate, setSpeechRate: (next: number) => { setSpeechRateState(next); void AsyncStorage.setItem("sementes:speech-rate", String(next)); }, speechVoice, setSpeechVoice: (next: SpeechVoiceGender) => { setSpeechVoiceState(next); void AsyncStorage.setItem("sementes:speech-voice", next); } }), [textScale, speechRate, speechVoice]);
  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const value = useContext(AccessibilityContext);
  if (!value) throw new Error("useAccessibility must be used inside AccessibilityProvider");
  return value;
}
