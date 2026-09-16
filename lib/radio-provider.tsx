import { createContext, useContext, useEffect, type PropsWithChildren } from "react";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

const RADIO_URL = "https://player.srvstm.com/proxy/30368";

type RadioContextValue = {
  playing: boolean;
  isBuffering: boolean;
  toggle: () => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

export function RadioProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer(RADIO_URL, { keepAudioSessionActive: true });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionModeAndroid: "duckOthers",
      interruptionMode: "mixWithOthers",
    });
  }, []);

  const toggle = () => {
    if (status.playing) player.pause();
    else player.play();
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
