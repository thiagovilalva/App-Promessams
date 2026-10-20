import { describe, expect, it } from "vitest";

describe("Expo build credential", () => {
  it("authenticates against the lightweight Expo identity endpoint", async () => {
    const token = process.env.EXPO_TOKEN;
    expect(token, "EXPO_TOKEN must be provided by the secure project environment").toBeTruthy();

    const response = await fetch("https://api.expo.dev/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "query CurrentUser { meActor { __typename ... on UserActor { username } } }",
      }),
    });

    expect(response.ok, `Expo identity request failed with HTTP ${response.status}`).toBe(true);
    const body = await response.json() as { data?: { meActor?: { __typename?: string } }; errors?: unknown[] };
    expect(body.errors, "Expo rejected the supplied credential").toBeUndefined();
    expect(body.data?.meActor?.__typename).toBeTruthy();
  }, 30_000);
});
