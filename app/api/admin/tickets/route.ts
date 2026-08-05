import { ApiError, jsonError } from "@/lib/server/api";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { getAdminSession } from "@/lib/server/session";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);

    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .select("*, advisors(code, name), partners(name), partner_locations(name, city)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { tickets: (data as DatabaseTicket[]).map(toTicket) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
