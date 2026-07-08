export interface Announcement {
  id: string;
  title: string;
  content: string;
  active: boolean;
  createdAt: string;
  expiresAt?: string;
}

const KEY = "brillara_announcements";

export function getAnnouncements(): Announcement[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getActiveAnnouncements(): Announcement[] {
  return getAnnouncements().filter((a) => a.active);
}

export function createAnnouncement(data: Omit<Announcement, "id" | "createdAt">): Announcement {
  const ann: Announcement = {
    ...data,
    id: Math.random().toString(36).substring(2, 10),
    createdAt: new Date().toISOString(),
  };
  const all = getAnnouncements();
  all.unshift(ann);
  localStorage.setItem(KEY, JSON.stringify(all));
  return ann;
}

export function toggleAnnouncement(id: string): Announcement | null {
  const all = getAnnouncements();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  all[idx].active = !all[idx].active;
  localStorage.setItem(KEY, JSON.stringify(all));
  return all[idx];
}

export function deleteAnnouncement(id: string): void {
  const all = getAnnouncements().filter((a) => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
