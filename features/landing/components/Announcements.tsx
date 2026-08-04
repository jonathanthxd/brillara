"use client";

import { api } from "@/lib/client-api";
import { Announcement } from "@/types/announcement";
import { useEffect, useState } from "react";

interface AnnouncementsResponse {
  announcements: Announcement[];
}

export function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    void api<AnnouncementsResponse>("/api/public/announcements")
      .then((data) => setItems(data.announcements))
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  return (
    <section aria-label="Avisos importantes" className="border-b border-primary/20 bg-primary/5 px-6 py-3">
      <div className="mx-auto max-w-6xl space-y-1 text-center text-sm">
        {items.map((item) => (
          <p key={item.id} className="text-foreground">
            <span className="font-medium">{item.title}:</span> <span className="text-muted-foreground">{item.content}</span>
          </p>
        ))}
      </div>
    </section>
  );
}
