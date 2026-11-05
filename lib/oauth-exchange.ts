import { exchangeOAuthCode, type OAuthExchangeResult } from "./_core/api";

const exchanges = new Map<string, Promise<OAuthExchangeResult>>();
export function exchangeOAuthCodeOnce(code: string, state: string): Promise<OAuthExchangeResult> {
  const key = `${code}\u0000${state}`;
  const previous = exchanges.get(key);
  if (previous) return previous;
  const pending = exchangeOAuthCode(code, state);
  exchanges.set(key, pending);
  // Bound in-memory retention; do not store OAuth codes in AsyncStorage.
  if (exchanges.size > 16) exchanges.delete(exchanges.keys().next().value!);
  return pending;
}
