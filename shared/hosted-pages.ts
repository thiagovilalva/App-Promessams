import { PUBLIC_SITE_ORIGIN } from "./auth-config";
export const HOSTED_PAGES = {
  relatorios: { path: "/relatorios", title: "Relatórios", requiresAuth: true },
  programacao: { path: "/programacao", title: "Programação", requiresAuth: false },
  igrejas: { path: "/igrejas", title: "Igrejas", requiresAuth: false },
  "pedir-musica": { path: "/pedir-musica", title: "Pedir música", requiresAuth: false },
} as const;
export type HostedPageKey = keyof typeof HOSTED_PAGES;
export function isHostedPageKey(value: string): value is HostedPageKey { return Object.prototype.hasOwnProperty.call(HOSTED_PAGES, value); }
export const REPORTS_URL = `${PUBLIC_SITE_ORIGIN}/relatorios`;
export function resolveHostedDestination(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return Object.values(HOSTED_PAGES).some(page => page.path === value) ? value : undefined;
}
