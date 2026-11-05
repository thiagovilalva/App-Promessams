import type { AudioPlayer, AudioStatus } from "expo-audio";

const RADIO_URL = "https://stm17.srvstm.com:30368";
const DEFAULT_VOLUME = 0.8;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const;
const AUDIO_UPDATE_INTERVAL_MS = 500;

export type NativeRadioStatus = {
  playing: boolean;
  isBuffering: boolean;
  volume: number;
  error: string | null;
};

export type NativeRadioController = {
  play: () => Promise<void>;
  stop: () => void;
  setVolume: (value: number) => void;
  dispose: () => void;
};

type AudioSubscription = {
  remove: () => void;
};

type ReleasableAudioPlayer = AudioPlayer & {
  /** Kept as a compatibility fallback for older audio player builds. */
  release?: () => void;
};

type NativePlaybackStatus = AudioStatus & {
  /** Present in newer runtimes, but not declared by SDK54's 1.1.x types. */
  error?: string | null;
};

/**
 * Creates a lazy native stream controller.
 *
 * `expo-audio` is intentionally imported only from `play()`. Constructing the
 * controller is therefore safe during app boot and does not create a player or
 * a MediaSession. The caller owns the controller and must call `dispose()`.
 */
export function createNativeRadioController(
  onState: (state: NativeRadioStatus) => void,
): NativeRadioController {
  let disposed = false;
  let requested = false;
  let volume = DEFAULT_VOLUME;
  let player: ReleasableAudioPlayer | null = null;
  let subscription: AudioSubscription | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let startPromise: Promise<void> | null = null;
  let retryCount = 0;
  let loadingSince = 0;
  let state: NativeRadioStatus = {
    playing: false,
    isBuffering: false,
    volume,
    error: null,
  };

  const emit = (patch: Partial<NativeRadioStatus>) => {
    if (disposed) return;
    state = { ...state, ...patch, volume };
    onState(state);
  };

  const clearRetry = () => {
    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  const teardownPlayer = () => {
    const currentPlayer = player;
    const currentSubscription = subscription;
    player = null;
    subscription = null;

    try {
      currentSubscription?.remove();
    } catch {
      // A native subscription may already have been removed by the module.
    }

    if (!currentPlayer) return;

    try {
      currentPlayer.pause();
    } catch {
      // The native object may already be invalid after a media-service reset.
    }

    try {
      currentPlayer.clearLockScreenControls?.();
    } catch {
      // Lock-screen cleanup is best effort during teardown.
    }

    try {
      if (typeof currentPlayer.remove === "function") {
        currentPlayer.remove();
      } else {
        currentPlayer.release?.();
      }
    } catch {
      // Older builds may expose release() even when remove() is present.
      try {
        currentPlayer.release?.();
      } catch {
        // Teardown must not turn a user stop into an app crash.
      }
    }
  };

  const errorMessage = (error: unknown): string => {
    if (typeof error === "string" && error.length > 0) return error;
    if (error instanceof Error && error.message.length > 0)
      return error.message;
    return "Não foi possível iniciar a rádio.";
  };

  const scheduleRetry = (error: unknown) => {
    if (disposed || !requested || retryTimer !== null) return;

    teardownPlayer();
    const message = errorMessage(error);
    const delay = RETRY_DELAYS_MS[retryCount];

    if (delay === undefined) {
      emit({ playing: false, isBuffering: false, error: message });
      return;
    }

    retryCount += 1;
    emit({ playing: false, isBuffering: true, error: message });
    retryTimer = setTimeout(() => {
      retryTimer = null;
      void beginPlayback();
    }, delay);
  };

  const onPlaybackStatus = (status: AudioStatus) => {
    if (disposed || !requested) return;
    const nativeStatus = status as NativePlaybackStatus;

    if (nativeStatus.error) {
      scheduleRetry(nativeStatus.error);
      return;
    }

    if (status.playing) {
      emit({ playing: true, isBuffering: status.isBuffering, error: null });
      return;
    }

    emit({ playing: false, isBuffering: status.isBuffering || !status.isLoaded, error: null });

    if (status.didJustFinish) {
      scheduleRetry("O stream da rádio terminou inesperadamente.");
    } else if (!status.isLoaded && Date.now() - loadingSince > 25_000) {
      scheduleRetry("A rádio não conseguiu carregar o stream.");
    }
  };

  async function startPlayback(): Promise<void> {
    if (disposed || !requested) return;

    if (player) {
      const currentPlayer = player;
      try {
        currentPlayer.volume = volume;
        currentPlayer.play();
        if (player === currentPlayer && requested && !disposed) {
          emit({
            playing: true,
            isBuffering: !currentPlayer.isLoaded,
            error: null,
          });
        }
      } catch (error) {
        scheduleRetry(error);
      }
      return;
    }

    try {
      // Deliberately dynamic: this is the first point at which expo-audio and
      // its native module may be loaded.
      const audio = await import("expo-audio");
      if (disposed || !requested) return;

      await audio.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "doNotMix",
        interruptionModeAndroid: "doNotMix",
      });
      if (disposed || !requested) return;

      const nextPlayer = audio.createAudioPlayer(RADIO_URL, {
        updateInterval: AUDIO_UPDATE_INTERVAL_MS,
      }) as ReleasableAudioPlayer;
      if (disposed || !requested) {
        try {
          nextPlayer.remove?.();
        } catch {
          nextPlayer.release?.();
        }
        return;
      }

      player = nextPlayer;
      loadingSince = Date.now();
      subscription = nextPlayer.addListener(
        "playbackStatusUpdate",
        onPlaybackStatus,
      );
      nextPlayer.volume = volume;
      nextPlayer.setActiveForLockScreen(
        true,
        {
          title: "Rádio da Promessa",
          artist: "Promessa MS",
          albumTitle: "Rádio ao vivo",
        },
        {
          showSeekBackward: false,
          showSeekForward: false,
        },
      );
      nextPlayer.play();
      if (player === nextPlayer && requested && !disposed) {
        emit({ playing: true, isBuffering: !nextPlayer.isLoaded, error: null });
      }
    } catch (error) {
      scheduleRetry(error);
    }
  }

  const beginPlayback = (): Promise<void> => {
    if (disposed || !requested || retryTimer !== null) return Promise.resolve();
    if (startPromise) return startPromise;

    const pending = startPlayback();
    startPromise = pending;
    void pending.then(
      () => {
        if (startPromise === pending) startPromise = null;
      },
      () => {
        if (startPromise === pending) startPromise = null;
      },
    );
    return pending;
  };

  const play = (): Promise<void> => {
    if (disposed) return Promise.resolve();

    if (!requested) {
      requested = true;
      retryCount = 0;
      clearRetry();
      emit({ playing: false, isBuffering: true, error: null });
    } else if (!player && retryTimer === null && startPromise === null) {
      // A previous bounded retry sequence may have been exhausted. A new
      // explicit Play action starts a new bounded sequence.
      retryCount = 0;
    }

    return beginPlayback();
  };

  const stop = () => {
    if (disposed) return;
    requested = false;
    clearRetry();
    teardownPlayer();
    emit({ playing: false, isBuffering: false, error: null });
  };

  const setVolume = (value: number) => {
    if (disposed) return;
    const nextVolume = Number.isFinite(value)
      ? Math.max(0, Math.min(1, value))
      : volume;
    volume = nextVolume;

    try {
      if (player) player.volume = nextVolume;
    } catch (error) {
      emit({ error: errorMessage(error) });
      return;
    }

    emit({ volume: nextVolume });
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    requested = false;
    clearRetry();
    teardownPlayer();
  };

  onState(state);
  return { play, stop, setVolume, dispose };
}
