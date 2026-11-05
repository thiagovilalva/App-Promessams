import { describe, expect, it, vi } from "vitest";
vi.mock("../lib/_core/api", () => ({ exchangeOAuthCode: vi.fn() }));
import { exchangeOAuthCode } from "../lib/_core/api";
import { exchangeOAuthCodeOnce } from "../lib/oauth-exchange";

describe("native OAuth callback single-flight", () => {
  it("shares one exchange across duplicate deep links and subsequent remounts", async () => {
    const response = { sessionToken: "synthetic-token", user: { id: 1, openId: "test", name: "Test", email: null, loginMethod: "manus", lastSignedIn: new Date().toISOString() } };
    vi.mocked(exchangeOAuthCode).mockResolvedValue(response);
    const a = exchangeOAuthCodeOnce("unique-synthetic-code", "unique-state");
    const b = exchangeOAuthCodeOnce("unique-synthetic-code", "unique-state");
    expect(a).toBe(b); expect(await a).toEqual(response);
    expect(await exchangeOAuthCodeOnce("unique-synthetic-code", "unique-state")).toEqual(response);
    expect(exchangeOAuthCode).toHaveBeenCalledTimes(1);
  });
});
