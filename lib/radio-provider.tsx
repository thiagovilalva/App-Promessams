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
  const player = useAudioPlayer(Platform.OS === "web" ? WEB_RADIO_URL : RADIO_URL, { keepAudioSessionActive: true });
  const status = useAudioPlayerStatus(player);
  const [volume, setVolumeState] = useState(0.8);
  const pausedByUser = useRef(false);
  const startedByUser = useRef(false);
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
    });

    return () => {
      mounted = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (Platform.OS === "android") player.clearLockScreenControls();
    };
  }, [player]);

  useEffect(() => {
    if (!startedByUser.current || pausedByUser.current || status.playing || status.isBuffering) return;

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

    startedByUser.current = true;
    pausedByUser.current = false;
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
