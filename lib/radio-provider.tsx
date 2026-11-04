import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { getApiBaseUrl } from "@/constants/oauth";

const RADIO_URL = "https://stm17.srvstm.com:30368";
const WEB_RADIO_URL = `${getApiBaseUrl()}/api/radio-stream`;
const RECONNECT_INTERVAL_MS = 3_000;

type RadioContextValue = {
  playing: boolean;
  isBuffering: boolean;
  volume: number;
  toggle: () => void;
  setVolume: (value: number) => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

export function RadioProvider({ children }: PropsWithChildren) {
  // Native playback stays lazy and does not register Android foreground audio
  // services until a user explicitly presses Play.
  const player = useAudioPlayer(null, { keepAudioSessionActive: true });
  const status = useAudioPlayerStatus(player);
  const [volume, setVolumeState] = useState(0.8);
  const [webPlaying, setWebPlaying] = useState(false);
  const [webBuffering, setWebBuffering] = useState(false);
  const pausedByUser = useRef(false);
  const startedByUser = useRef(false);
  const sourceAttached = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webAudio = useRef<HTMLAudioElement | null>(null);
  const webReconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReconnectTimer = () => {
    if (webReconnectTimer.current) {
      clearTimeout(webReconnectTimer.current);
      webReconnectTimer.current = null;
    }
  };

  const scheduleWebReconnect = () => {
    clearReconnectTimer();
    if (pausedByUser.current || !startedByUser.current) return;
    webReconnectTimer.current = setTimeout(() => {
      if (!pausedByUser.current) void playWebRadio(true);
    }, RECONNECT_INTERVAL_MS);
  };

  const playWebRadio = async (reconnect = false) => {
    if (Platform.OS !== "web" || pausedByUser.current) return;
    const AudioCtor = globalThis.Audio;
    if (!AudioCtor) return;

    let audio = webAudio.current;
    if (!audio) {
      audio = new AudioCtor();
      audio.preload = "none";
      audio.autoplay = false;
      audio.volume = volume;
      audio.onplaying = () => {
        setWebPlaying(true);
        setWebBuffering(false);
      };
      audio.onwaiting = () => {
        setWebBuffering(true);
      };
      audio.onstalled = () => {
        setWebPlaying(false);
        setWebBuffering(true);
        scheduleWebReconnect();
      };
      audio.onended = () => {
        setWebPlaying(false);
        setWebBuffering(true);
        scheduleWebReconnect();
      };
      audio.onerror = () => {
        setWebPlaying(false);
        setWebBuffering(true);
        scheduleWebReconnect();
      };
      webAudio.current = audio;
    }

    setWebBuffering(true);
    // Reassigning and loading the source is important after a mobile browser
    // closes an idle/unstable Shoutcast connection; play() alone cannot revive it.
    if (reconnect || audio.src !== WEB_RADIO_URL) {
      audio.src = WEB_RADIO_URL;
      audio.load();
    }
    try {
      await audio.play();
      setWebPlaying(true);
      setWebBuffering(false);
    } catch {
      setWebPlaying(false);
      setWebBuffering(false);
      // A first play must come from a user gesture. The user can press Play
      // again; a failed reconnect never turns into an unsolicited autoplay.
    }
  };

  useEffect(() => {
    if (Platform.OS === "web") return;
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "duckOthers",
    }).catch(() => undefined);

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      try {
        player.clearLockScreenControls();
      } catch {
        // The native media service may already be gone during teardown.
      }
    };
  }, [player]);

  useEffect(() => {
    if (Platform.OS === "web") return;
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

  useEffect(() => () => {
    clearReconnectTimer();
    const audio = webAudio.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      webAudio.current = null;
    }
  }, []);

  const toggle = () => {
    if (Platform.OS === "web") {
      const audio = webAudio.current;
      if (webPlaying || audio?.paused === false) {
        pausedByUser.current = true;
        clearReconnectTimer();
        audio?.pause();
        setWebPlaying(false);
        setWebBuffering(false);
        return;
      }
      startedByUser.current = true;
      pausedByUser.current = false;
      void playWebRadio(false);
      return;
    }

    if (status.playing) {
      pausedByUser.current = true;
      player.pause();
      try {
        player.clearLockScreenControls();
      } catch {
        // Ignore teardown races with the Android media service.
      }
      return;
    }

    startedByUser.current = true;
    pausedByUser.current = false;
    if (!sourceAttached.current) {
      player.replace(RADIO_URL);
      sourceAttached.current = true;
    }
    void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false, interruptionMode: "duckOthers" }).catch(() => undefined);
    player.play();
  };

  const setVolume = (value: number) => {
    const nextVolume = Math.max(0, Math.min(1, value));
    if (webAudio.current) webAudio.current.volume = nextVolume;
    player.volume = nextVolume;
    setVolumeState(nextVolume);
  };

  const playing = Platform.OS === "web" ? webPlaying : status.playing;
  const isBuffering = Platform.OS === "web" ? webBuffering : status.isBuffering;

  return (
    <RadioContext.Provider value={{ playing, isBuffering, volume, toggle, setVolume }}>
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
