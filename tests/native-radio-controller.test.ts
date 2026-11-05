import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  status: undefined as undefined | ((value: any) => void),
  player: { volume: 0.8, isLoaded: false, play: vi.fn(), pause: vi.fn(), remove: vi.fn(), clearLockScreenControls: vi.fn(), setActiveForLockScreen: vi.fn(), addListener: vi.fn() },
  setAudioModeAsync: vi.fn(), createAudioPlayer: vi.fn(),
}));
vi.mock("expo-audio", () => ({ setAudioModeAsync: mock.setAudioModeAsync, createAudioPlayer: mock.createAudioPlayer }));
import { createNativeRadioController } from "../lib/native-radio";
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); mock.status = undefined;
  mock.setAudioModeAsync.mockResolvedValue(undefined);
  mock.createAudioPlayer.mockReturnValue(mock.player);
  mock.player.addListener.mockImplementation((_name, cb) => { mock.status = cb; return { remove: vi.fn() }; });
});
afterEach(() => vi.useRealTimers());
describe("native radio lazy playback", () => {
  it("does not load the player or service when constructed", () => {
    const radio = createNativeRadioController(vi.fn());
    expect(mock.createAudioPlayer).not.toHaveBeenCalled(); expect(mock.setAudioModeAsync).not.toHaveBeenCalled();
    radio.dispose(); expect(mock.player.play).not.toHaveBeenCalled();
  });
  it("starts after explicit Play and stops/releases inside the app", async () => {
    const radio = createNativeRadioController(vi.fn()); await radio.play();
    expect(mock.createAudioPlayer).toHaveBeenCalledTimes(1); expect(mock.player.play).toHaveBeenCalledTimes(1);
    expect(mock.setAudioModeAsync).toHaveBeenCalledWith(expect.objectContaining({ shouldPlayInBackground: true }));
    radio.setVolume(3); expect(mock.player.volume).toBe(1);
    radio.stop(); expect(mock.player.pause).toHaveBeenCalledTimes(1); expect(mock.player.remove).toHaveBeenCalledTimes(1); expect(mock.player.clearLockScreenControls).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000); expect(mock.createAudioPlayer).toHaveBeenCalledTimes(1); radio.dispose();
  });
  it("does not mistake the initial unloaded status for a failed stream", async () => {
    const radio = createNativeRadioController(vi.fn()); await radio.play();
    mock.status?.({ playing: false, isLoaded: false, isBuffering: false, didJustFinish: false });
    expect(mock.player.remove).not.toHaveBeenCalled(); radio.dispose();
  });
  it("cancels in-flight startup when stopped before audio-mode setup finishes", async () => {
    let resolve!: () => void; mock.setAudioModeAsync.mockReturnValue(new Promise<void>(r => { resolve = r; }));
    const radio = createNativeRadioController(vi.fn()); const pending = radio.play();
    await vi.waitFor(() => expect(mock.setAudioModeAsync).toHaveBeenCalled());
    radio.stop(); resolve(); await pending; expect(mock.createAudioPlayer).not.toHaveBeenCalled(); radio.dispose();
  });
});
