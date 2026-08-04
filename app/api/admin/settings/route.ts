import { ApiError, jsonError } from "@/lib/server/api";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { getAdminSession } from "@/lib/server/session";
import { DEFAULT_SETTINGS } from "@/lib/pricing";
import { parseSettings } from "@/lib/server/settings";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);
}

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await getSupabaseAdmin()
      .from("site_settings")
      .select("value")
      .eq("key", "public")
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(
      { settings: data ? parseSettings(data.value) : DEFAULT_SETTINGS },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const settings = parseSettings(await request.json());
    const { error } = await getSupabaseAdmin()
      .from("site_settings")
      .upsert(
        { key: "public", value: settings, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );

    if (error) throw error;

    return NextResponse.json(
      { settings },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
