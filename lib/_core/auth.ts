import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

export type User = { id: number; openId: string; name: string | null; email: string | null; loginMethod: string | null; lastSignedIn: Date };
const listeners = new Set<() => void>();
export function subscribeAuthChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function notifyNativeAuthChanges() {
  if (Platform.OS !== "web") listeners.forEach(listener => listener());
}

export async function getSessionToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try { return await SecureStore.getItemAsync(SESSION_TOKEN_KEY); } catch { return null; }
}
export async function setSessionToken(token: string): Promise<void> {
  if (Platform.OS !== "web") await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}
export async function removeSessionToken(): Promise<void> {
  if (Platform.OS !== "web") await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}
export async function getUserInfo(): Promise<User | null> {
  try {
    const text = Platform.OS === "web" ? window.localStorage.getItem(USER_INFO_KEY) : await SecureStore.getItemAsync(USER_INFO_KEY);
    return text ? JSON.parse(text) : null;
  } catch { return null; }
}
export async function setUserInfo(user: User): Promise<void> {
  if (Platform.OS === "web") window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
  else { await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(user)); notifyNativeAuthChanges(); }
}
export async function clearUserInfo(): Promise<void> {
  if (Platform.OS === "web") window.localStorage.removeItem(USER_INFO_KEY);
  else { await SecureStore.deleteItemAsync(USER_INFO_KEY); notifyNativeAuthChanges(); }
}
