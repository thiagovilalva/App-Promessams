import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ alert: vi.fn(), copy: vi.fn(), share: vi.fn(), platform: { OS: "web" } }));
vi.mock("react-native", () => ({ Alert: { alert: mocks.alert }, Platform: mocks.platform, Share: { share: mocks.share } }));
vi.mock("expo-clipboard", () => ({ setStringAsync: mocks.copy }));
import { copyChatResponse, shareChatResponse } from "../lib/message-actions";
beforeEach(() => { vi.clearAllMocks(); mocks.platform.OS = "web"; mocks.copy.mockResolvedValue(undefined); });
afterEach(() => vi.unstubAllGlobals());
describe("response copy and share", () => {
  it("copies the complete text", async () => {
    const text = "Resposta completa\nCom acentos e referências bíblicas.";
    await copyChatResponse(text); expect(mocks.copy).toHaveBeenCalledWith(text); expect(mocks.alert).toHaveBeenCalledWith("Texto copiado", expect.any(String));
  });
  it("uses web share when supported and does nothing extra on cancellation", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError")); vi.stubGlobal("navigator", { share });
    await shareChatResponse("Resposta"); expect(share).toHaveBeenCalledWith({ title: "PromessaMS", text: "Resposta" }); expect(mocks.alert).not.toHaveBeenCalled();
  });
  it("provides clipboard fallback on desktop without web share", async () => {
    vi.stubGlobal("navigator", {}); await shareChatResponse("Resposta"); expect(mocks.copy).toHaveBeenCalledWith("Resposta"); expect(mocks.alert).toHaveBeenCalledWith("Resposta copiada para compartilhar", expect.any(String));
  });
  it("opens native share for Android rather than navigating away", async () => {
    mocks.platform.OS = "android"; await shareChatResponse("Resposta", "Professor Doutrinário"); expect(mocks.share).toHaveBeenCalledWith({ message: "Resposta", title: "Professor Doutrinário" });
  });
});
