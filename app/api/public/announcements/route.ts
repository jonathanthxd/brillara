import { isMissingTable, jsonError } from "@/lib/server/api";
import { ServerConfigurationError } from "@/lib/server/configuration";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { Announcement } from "@/types/announcement";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DatabaseAnnouncement {
  id: string | number;
  title: string;
  content: string;
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

function toAnnouncement(record: DatabaseAnnouncement): Announcement {
  return {
    id: String(record.id),
    title: record.title,
    content: record.content,
    active: record.active,
    createdAt: record.created_at,
    expiresAt: record.expires_at,
  };
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("announcements")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error && !isMissingTable(error)) throw error;

    const now = Date.now();
    const announcements = ((data ?? []) as DatabaseAnnouncement[])
      .map(toAnnouncement)
      .filter((announcement) => !announcement.expiresAt || new Date(announcement.expiresAt).getTime() > now);

    return NextResponse.json(
      { announcements },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ServerConfigurationError && process.env.NODE_ENV === "development") {
      return NextResponse.json(
        { announcements: [], demo: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return jsonError(error);
  }
}
