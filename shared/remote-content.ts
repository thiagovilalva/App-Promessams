export const REMOTE_MATERIALS_CACHE_KEY = "promessams:remote-materials:v1";
export const REMOTE_MATERIALS_SYNC_KEY = "promessams:remote-materials:last-sync:v1";

export type RemoteMaterial = {
  id: number;
  title: string;
  summary: string | null;
  content: string;
  source: string | null;
  createdAt: string | Date;
};

export function mergeRemoteMaterials(
  online: RemoteMaterial[] | undefined,
  cached: RemoteMaterial[] = [],
): RemoteMaterial[] {
  const byId = new Map<number, RemoteMaterial>();
  for (const item of cached) byId.set(item.id, item);
  for (const item of online ?? []) byId.set(item.id, item);
  return [...byId.values()].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}
