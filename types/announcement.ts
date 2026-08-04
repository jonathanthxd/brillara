export interface Announcement {
  id: string;
  title: string;
  content: string;
  active: boolean;
  createdAt: string;
  expiresAt: string | null;
}
