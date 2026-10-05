import { createContext, useContext, useEffect, useRef, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { getApiBaseUrl } from "@/constants/oauth";

const RADIO_URL = "https://stm17.srvstm.com:30368";
const WEB_RADIO_URL = `${getApiBaseUrl()}/api/radio-stream`;
const RECONNECT_INTERVAL_MS = 5_000;

type RadioContextValue = {
  playing: boolean;
  isBuffering: boolean;
  toggle: () => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

export function RadioProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer(Platform.OS === "web" ? WEB_RADIO_URL : RADIO_URL, { keepAudioSessionActive: true });
  const status = useAudioPlayerStatus(player);
  const pausedByUser = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionModeAndroid: "duckOthers",
      interruptionMode: "mixWithOthers",
    }).then(() => {
      if (Platform.OS === "android") {
        // Register the live stream with Android MediaSession. This causes
        // expo-audio to keep its mediaPlayback foreground service alive when
        // the screen is locked or the app is backgrounded.
        player.setActiveForLockScreen(true, {
          title: "Rádio da Promessa",
          artist: "PromessaMS",
        });
      }
      // Try autoplay on every platform. Native apps allow it; browsers may
      // reject audible autoplay until the user interacts with the page.
      if (mounted && !pausedByUser.current) {
        try {
          player.play();
        } catch {
          // The reconnect effect below retries transient stream start failures.
        }
      }
    });

    return () => {
      mounted = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (Platform.OS === "android") player.clearLockScreenControls();
    };
  }, [player]);

  useEffect(() => {
    if (pausedByUser.current || status.playing || status.isBuffering) return;
    // A browser may block the first audible autoplay attempt. Avoid repeated
    // attempts until the user presses the radio button, while native builds
    // continue reconnecting automatically in the background.
    if (Platform.OS === "web") return;

    // A live stream has no natural end. If the provider drops the connection,
    // reconnect automatically while the user has not pressed pause.
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
      return;
    }

    pausedByUser.current = false;
    player.play();
  };

  return (
    <RadioContext.Provider value={{ playing: status.playing, isBuffering: status.isBuffering, toggle }}>
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
