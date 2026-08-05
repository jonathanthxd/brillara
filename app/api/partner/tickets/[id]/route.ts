import { ApiError, jsonError } from "@/lib/server/api";
import { getPartnerTicketDetail } from "@/lib/server/partner-data";
import { requireActivePartnerSession } from "@/lib/server/partner-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const partnerUser = await requireActivePartnerSession();
    const { id } = await context.params;
    const detail = await getPartnerTicketDetail(id, partnerUser);
    if (!detail) throw new ApiError("Ticket no encontrado.", 404);
    return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
