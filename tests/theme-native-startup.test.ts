import { describe, expect, it } from "vitest";
import fs from "node:fs";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { transformSync } from "esbuild";

const palette = { primary: "#167C55", background: "#FFFFFF", surface: "#EEEEEE", foreground: "#111111", muted: "#666666", border: "#CCCCCC", success: "#00AA00", warning: "#FFAA00", error: "#FF0000" };
function mountTheme(source: string, platform: "android" | "ios" | "web", search?: string, saved = "dark") {
  const effects: (() => unknown)[] = [];
  const stateUpdates: string[] = [];
  const storageWrites: [string, string][] = [];
  const modules: Record<string, unknown> = {
    react: {
      createContext: () => ({ Provider: "ThemeContext" }),
      useCallback: (fn: unknown) => fn,
      useContext: () => null,
      useEffect: (fn: () => unknown) => effects.push(fn),
      useMemo: (fn: () => unknown) => fn(),
      useState: () => ["light", (value: string) => stateUpdates.push(value)],
    },
    "react/jsx-runtime": { jsx: () => null, jsxs: () => null },
    "react-native": { Platform: { OS: platform }, Appearance: { setColorScheme: () => undefined }, View: "View" },
    "nativewind": { colorScheme: { set: () => undefined }, vars: () => ({}) },
    "@/constants/theme": { SchemeColors: { light: palette, dark: palette } },
    "@react-native-async-storage/async-storage": { __esModule: true, default: { getItem: () => Promise.resolve(saved), setItem: (key: string, value: string) => { storageWrites.push([key, value]); return Promise.resolve(); } } },
  };
  const exports: Record<string, unknown> = {};
  const globals: Record<string, unknown> = { module: { exports }, exports, URLSearchParams, console, require: (name: string) => { if (!(name in modules)) throw new Error(`Unexpected import: ${name}`); return modules[name]; } };
  // This is what RN Libraries/Core/setUpGlobals.js does: window exists but
  // browser-only window.location/document do not exist in the native runtime.
  globals.window = globals;
  if (search !== undefined) globals.location = { search };
  vm.runInNewContext(transformSync(source, { loader: "tsx", format: "cjs", jsx: "automatic" }).code, globals);
  const provider = (globals.module as { exports: { ThemeProvider: (props: { children: null }) => void } }).exports.ThemeProvider;
  provider({ children: null });
  return { start: () => effects.forEach(effect => effect()), stateUpdates, storageWrites };
}
const current = () => fs.readFileSync("lib/theme-provider.tsx", "utf8");
describe("native theme startup regression against the working release", () => {
  it("reproduces the release-20 startup failure, not a radio or signing fault", () => {
    const broken = execFileSync("git", ["show", "63052d5e:lib/theme-provider.tsx"], { encoding: "utf8" });
    expect(() => mountTheme(broken, "android").start()).toThrow(/search/);
  });
  it("confirms the release-19 theme does not fail in the same native environment", async () => {
    const stable = execFileSync("git", ["show", "e25ec765:lib/theme-provider.tsx"], { encoding: "utf8" });
    const app = mountTheme(stable, "android");
    expect(app.start).not.toThrow();
    await Promise.resolve();
    expect(app.stateUpdates).toContain("dark");
  });
  for (const platform of ["android", "ios"] as const) {
    it(`mounts the corrected theme on ${platform} when window has no location`, async () => {
      const app = mountTheme(current(), platform);
      expect(app.start).not.toThrow();
      await Promise.resolve();
      expect(app.stateUpdates).toContain("dark");
    });
    it(`ignores a browser-like location on ${platform} and keeps the saved native preference`, async () => {
      const app = mountTheme(current(), platform, "?theme=light", "dark");
      app.start();
      await Promise.resolve();
      expect(app.stateUpdates).toContain("dark");
      expect(app.storageWrites).toEqual([]);
    });
  }
  it("still accepts the app's explicit theme in a real web-page context", () => {
    const app = mountTheme(current(), "web", "?theme=dark", "light");
    expect(app.start).not.toThrow();
    expect(app.stateUpdates).toContain("dark");
    expect(app.storageWrites).toContainEqual(["sementes:theme", "dark"]);
  });
  it("does not fail on web SSR where window.location is unavailable", async () => {
    const app = mountTheme(current(), "web");
    expect(app.start).not.toThrow();
    await Promise.resolve();
    expect(app.stateUpdates).toContain("dark");
  });
});
