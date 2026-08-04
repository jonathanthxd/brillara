import { ApiError, jsonError } from "@/lib/server/api";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import {
  addTicketToVisitorSession,
  getVisitorSession,
  setVisitorSession,
} from "@/lib/server/session";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { validateTicketInput } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function ticketNumber(): string {
  return `TKT-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

async function requireVisitor() {
  const session = await getVisitorSession();
  if (!session) throw new ApiError("Primero indica tu nombre para continuar.", 401);
  return session;
}

export async function GET() {
  try {
    const session = await requireVisitor();
    if (session.ticketIds.length === 0) {
      return NextResponse.json({ tickets: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .select("*")
      .in("id", session.ticketIds)
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
    const session = await requireVisitor();
    const input = validateTicketInput(await request.json());
    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .insert({
        ticket_number: ticketNumber(),
        client_name: session.name,
        phone: input.phone,
        city: input.city,
        location: input.location,
        description: input.description,
        photos: input.photos,
        status: "nuevo",
        advisor_id: null,
        messages: [],
      })
      .select("*")
      .single();

    if (error) throw error;

    const ticket = toTicket(data as DatabaseTicket);
    const response = NextResponse.json(
      { ticket },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );

    setVisitorSession(response, addTicketToVisitorSession(session, ticket.id));
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
