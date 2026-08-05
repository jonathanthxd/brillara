import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { toPartnerPurchase } from "@/lib/partners";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);
}

function limitFrom(request: NextRequest): number {
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? "50");
  return Number.isInteger(raw) && raw > 0 ? Math.min(raw, 100) : 50;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { data, error } = await getSupabaseAdmin()
      .from("purchases")
      .select("*, partners(name), partner_locations(name, city), partner_users(name), tickets(ticket_number, client_name, referrer_name, referrer_code)")
      .order("confirmed_at", { ascending: false })
      .limit(limitFrom(request));
    if (error) throw error;
    const purchases = (data ?? []).map((record) => {
      const source = record as Record<string, unknown>;
      const ticket = source.tickets as { ticket_number?: string; client_name?: string; referrer_name?: string | null; referrer_code?: string | null } | null;
      const partner = source.partners as { name?: string } | null;
      const location = source.partner_locations as { name?: string; city?: string | null } | null;
      const user = source.partner_users as { name?: string } | null;
      return {
        purchase: toPartnerPurchase(source),
        ticket: ticket ? {
          number: ticket.ticket_number ?? "",
          clientName: ticket.client_name ?? "",
          referrerName: ticket.referrer_name ?? null,
          referrerCode: ticket.referrer_code ?? null,
        } : null,
        partnerName: partner?.name ?? "Partner sin nombre",
        locationName: location?.name ?? "Sucursal sin nombre",
        locationCity: location?.city ?? null,
        confirmedBy: user?.name ?? "Usuario no disponible",
      };
    });
    return NextResponse.json({ purchases }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
