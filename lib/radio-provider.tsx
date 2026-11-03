import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { getApiBaseUrl } from "@/constants/oauth";

const RADIO_URL = "https://stm17.srvstm.com:30368";
const WEB_RADIO_URL = `${getApiBaseUrl()}/api/radio-stream`;
const RECONNECT_INTERVAL_MS = 5_000;

type RadioContextValue = {
  playing: boolean;
  isBuffering: boolean;
  volume: number;
  toggle: () => void;
  setVolume: (value: number) => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

export function RadioProvider({ children }: PropsWithChildren) {
  // Do not resolve or open the live stream during app startup. Android may
  // initialize Media3 while the first screen is still mounting; the stream is
  // attached only after the user explicitly presses Play.
  const player = useAudioPlayer(null, { keepAudioSessionActive: true });
  const status = useAudioPlayerStatus(player);
  const [volume, setVolumeState] = useState(0.8);
  const pausedByUser = useRef(false);
  const startedByUser = useRef(false);
  const sourceAttached = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Configure the session without starting native MediaSession services. The
    // lock-screen service is registered only after an explicit user play action.
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "duckOthers",
    }).catch(() => {
      // Playback is attempted again from the user action if session setup fails.
    });

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (Platform.OS === "android") {
        try {
          player.clearLockScreenControls();
        } catch {
          // The native media service may already be gone during teardown.
        }
      }
    };
  }, [player]);

  useEffect(() => {
    if (!startedByUser.current || pausedByUser.current || status.playing || status.isBuffering) return;

    reconnectTimer.current = setTimeout(() => {
      if (!pausedByUser.current) {
        try {
          player.play();
        } catch {
          // The next status update schedules another attempt.
        }
      }
    }, RECONNECT_INTERVAL_MS);

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [player, status.playing, status.isBuffering, status.isLoaded, status.playbackState]);

  const toggle = () => {
    if (status.playing) {
      pausedByUser.current = true;
      player.pause();
      if (Platform.OS === "android") {
        try {
          player.clearLockScreenControls();
        } catch {
          // Ignore teardown races with the Android media service.
        }
      }
      return;
    }

    startedByUser.current = true;
    pausedByUser.current = false;
    if (!sourceAttached.current) {
      player.replace(Platform.OS === "web" ? WEB_RADIO_URL : RADIO_URL);
      sourceAttached.current = true;
    }
    void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "duckOthers" }).catch(() => undefined);
    if (Platform.OS === "android") {
      try {
        player.setActiveForLockScreen(true, { title: "Rádio da Promessa", artist: "PromessaMS" });
      } catch {
        // Playback remains available if lock-screen controls are unavailable.
      }
    }
    player.play();
  };

  const setVolume = (value: number) => {
    const nextVolume = Math.max(0, Math.min(1, value));
    player.volume = nextVolume;
    setVolumeState(nextVolume);
  };

  return (
    <RadioContext.Provider value={{ playing: status.playing, isBuffering: status.isBuffering, volume, toggle, setVolume }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (!context) throw new Error("useRadio must be used inside RadioProvider");
  return context;
}

export { RADIO_URL };
