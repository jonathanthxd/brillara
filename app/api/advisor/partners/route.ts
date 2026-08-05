import { jsonError } from "@/lib/server/api";
import { requireActiveAdvisorSession } from "@/lib/server/advisor-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { toPartner, toPartnerLocation } from "@/lib/partners";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireActiveAdvisorSession();
    const supabase = getSupabaseAdmin();
    const [partnersResult, locationsResult] = await Promise.all([
      supabase.from("partners").select("*").eq("active", true).order("name", { ascending: true }),
      supabase.from("partner_locations").select("*").eq("active", true).order("name", { ascending: true }),
    ]);
    if (partnersResult.error) throw partnersResult.error;
    if (locationsResult.error) throw locationsResult.error;
    const partners = (partnersResult.data ?? []).map((record) => toPartner(record as Record<string, unknown>));
    const locations = (locationsResult.data ?? []).map((record) => toPartnerLocation(record as Record<string, unknown>));
    return NextResponse.json({ partners, locations }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
