import { ApiError, jsonError } from "@/lib/server/api";
import { requireActiveAdvisorSession } from "@/lib/server/advisor-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const advisor = await requireActiveAdvisorSession();
    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .select("*, advisors(code, name)")
      .or(`advisor_id.is.null,advisor_id.eq.${advisor.id}`)
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

export async function POST(request: NextRequest) {
  try {
    const advisor = await requireActiveAdvisorSession();
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) throw new ApiError("El ticket no es válido.");

    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .update({ advisor_id: advisor.id, updated_at: new Date().toISOString() })
      .eq("id", id)
      .is("advisor_id", null)
      .eq("status", "nuevo")
      .select("*, advisors(code, name)")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new ApiError("Este ticket ya fue tomado por otro asesor.", 409);

    return NextResponse.json(
      { ticket: toTicket(data as DatabaseTicket) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
