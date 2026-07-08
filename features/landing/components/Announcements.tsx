"use client";

import { useEffect, useState } from "react";
import { getActiveAnnouncements, Announcement } from "@/services/announcements";

export function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(getActiveAnnouncements());
  }, []);

  if (!mounted || items.length === 0) return null;

  return (
    <div className="space-y-3 px-6 pt-6">
      {items.map((a) => (
        <div
          key={a.id}
          className="mx-auto max-w-5xl rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-foreground"
        >
          <span className="font-medium">{a.title}:</span> {a.content}
        </div>
      ))}
    </div>
  );
}
