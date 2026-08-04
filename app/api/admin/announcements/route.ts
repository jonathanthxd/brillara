import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { Announcement } from "@/types/announcement";
import { NextRequest, NextResponse } from "next/server";

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

function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new ApiError(`${field} es obligatorio y no puede superar ${max} caracteres.`);
  }

  return value.trim();
}

async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);
}

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await getSupabaseAdmin()
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { announcements: (data as DatabaseAnnouncement[]).map(toAnnouncement) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const title = text(body.title, "El título", 120);
    const content = text(body.content, "El contenido", 600);

    const { data, error } = await getSupabaseAdmin()
      .from("announcements")
      .insert({ title, content, active: true, expires_at: null })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { announcement: toAnnouncement(data as DatabaseAnnouncement) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
