import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";
import { createNativeRadioController, type NativeRadioController, type NativeRadioStatus } from "@/lib/native-radio";

const RADIO_URL = "https://stm17.srvstm.com:30368";
const WEB_RADIO_URL = `${getApiBaseUrl()}/api/radio-stream`;
const RECONNECT_INTERVAL_MS = 3_000;

type RadioContextValue = {
  playing: boolean;
  isBuffering: boolean;
  requested: boolean;
  error: string | null;
  volume: number;
  toggle: () => void;
  setVolume: (value: number) => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

/** One persistent player; the native module is first loaded after explicit Play. */
export function RadioProvider({ children }: PropsWithChildren) {
  const [volume, setVolumeState] = useState(0.8);
  const [webPlaying, setWebPlaying] = useState(false);
  const [webBuffering, setWebBuffering] = useState(false);
  const [requested, setRequested] = useState(false);
  const [nativeState, setNativeState] = useState<NativeRadioStatus>({ playing: false, isBuffering: false, volume: 0.8, error: null });
  const nativeController = useRef<NativeRadioController | null>(null);
  const nativeRequested = useRef(false);
  const startedByUser = useRef(false);
  const pausedByUser = useRef(false);
  const webAudio = useRef<HTMLAudioElement | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  };

  const scheduleReconnect = () => {
    clearReconnect();
    if (Platform.OS !== "web" || !startedByUser.current || pausedByUser.current) return;
    reconnectTimer.current = setTimeout(() => void startWebRadio(true), RECONNECT_INTERVAL_MS);
  };

  const startWebRadio = async (reconnect = false) => {
    if (Platform.OS !== "web" || pausedByUser.current || typeof globalThis.Audio !== "function") return;
    let audio = webAudio.current;
    if (!audio) {
      audio = new globalThis.Audio();
      audio.preload = "none";
      audio.volume = volume;
      audio.onplaying = () => { setWebPlaying(true); setWebBuffering(false); };
      audio.onwaiting = () => setWebBuffering(true);
      audio.onstalled = () => { setWebPlaying(false); setWebBuffering(true); scheduleReconnect(); };
      audio.onended = () => { setWebPlaying(false); setWebBuffering(true); scheduleReconnect(); };
      audio.onerror = () => { setWebPlaying(false); setWebBuffering(true); scheduleReconnect(); };
      webAudio.current = audio;
    }
    setWebBuffering(true);
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
    }
  };

  useEffect(() => () => {
    clearReconnect();
    nativeController.current?.dispose();
    nativeController.current = null;
    const audio = webAudio.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      webAudio.current = null;
    }
  }, []);

  const toggle = () => {
    if (Platform.OS !== "web") {
      if (nativeRequested.current) {
        nativeRequested.current = false;
        setRequested(false);
        nativeController.current?.stop();
      } else {
        if (!nativeController.current) nativeController.current = createNativeRadioController(state => {
          setNativeState(state);
          if (state.error && !state.isBuffering) { nativeRequested.current = false; setRequested(false); }
        });
        nativeRequested.current = true;
        setRequested(true);
        nativeController.current.setVolume(volume);
        void nativeController.current.play();
      }
      return;
    }
    const audio = webAudio.current;
    if (requested || webPlaying || audio?.paused === false) {
      pausedByUser.current = true;
      setRequested(false);
      clearReconnect();
      audio?.pause();
      setWebPlaying(false);
      setWebBuffering(false);
      return;
    }
    startedByUser.current = true;
    pausedByUser.current = false;
    setRequested(true);
    void startWebRadio(false);
  };

  const setVolume = (value: number) => {
    const nextVolume = Math.max(0, Math.min(1, value));
    if (webAudio.current) webAudio.current.volume = nextVolume;
    nativeController.current?.setVolume(nextVolume);
    setVolumeState(nextVolume);
  };

  return (
    <RadioContext.Provider value={{ playing: Platform.OS === "web" ? webPlaying : nativeState.playing, isBuffering: Platform.OS === "web" ? webBuffering : nativeState.isBuffering, requested, error: Platform.OS === "web" ? null : nativeState.error, volume, toggle, setVolume }}>
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
