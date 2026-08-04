import { isMissingTable, jsonError } from "@/lib/server/api";
import { ServerConfigurationError } from "@/lib/server/configuration";
import { DEFAULT_SETTINGS } from "@/lib/pricing";
import { parseSettings } from "@/lib/server/settings";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("site_settings")
      .select("value")
      .eq("key", "public")
      .maybeSingle();

    if (error && !isMissingTable(error)) throw error;

    return NextResponse.json(
      { settings: data ? parseSettings(data.value) : DEFAULT_SETTINGS },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ServerConfigurationError && process.env.NODE_ENV === "development") {
      return NextResponse.json(
        { settings: DEFAULT_SETTINGS, demo: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return jsonError(error);
  }
}
