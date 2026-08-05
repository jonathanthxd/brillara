import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { toPartner, toPartnerLocation, toPartnerUser } from "@/lib/partners";
import { validatePartnerInput } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);
}

interface PartnerReportRecord {
  partner_id: string;
  locations_count: number | string | null;
  users_count: number | string | null;
  pending_appointments: number | string | null;
  confirmed_purchases: number | string | null;
  no_concretadas: number | string | null;
  problems_in_review: number | string | null;
  volume_grams: number | string | null;
  total_paid: number | string | null;
  last_login_at: string | null;
}

function numeric(value: number | string | null): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const [partnersResult, locationsResult, usersResult, reportsResult] = await Promise.all([
      supabase.from("partners").select("*").order("name", { ascending: true }),
      supabase.from("partner_locations").select("*").order("name", { ascending: true }),
      supabase.from("partner_users").select("id, partner_id, location_id, name, code, role, active, last_login_at, created_at, updated_at").order("name", { ascending: true }),
      supabase.rpc("admin_partner_report"),
    ]);
    for (const result of [partnersResult, locationsResult, usersResult, reportsResult]) {
      if (result.error) throw result.error;
    }
    const reports = ((reportsResult.data ?? []) as PartnerReportRecord[]).map((record) => ({
      partnerId: record.partner_id,
      locationsCount: numeric(record.locations_count),
      usersCount: numeric(record.users_count),
      pendingAppointments: numeric(record.pending_appointments),
      confirmedPurchases: numeric(record.confirmed_purchases),
      noConcretadas: numeric(record.no_concretadas),
      problemsInReview: numeric(record.problems_in_review),
      volumeGrams: numeric(record.volume_grams),
      totalPaid: numeric(record.total_paid),
      lastLoginAt: record.last_login_at,
    }));
    return NextResponse.json(
      {
        partners: (partnersResult.data ?? []).map((record) => toPartner(record as Record<string, unknown>)),
        locations: (locationsResult.data ?? []).map((record) => toPartnerLocation(record as Record<string, unknown>)),
        users: (usersResult.data ?? []).map((record) => toPartnerUser(record as Record<string, unknown>)),
        reports,
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const partner = validatePartnerInput(await request.json());
    const { data, error } = await getSupabaseAdmin()
      .from("partners")
      .insert({ name: partner.name, type: partner.type, phone: partner.phone, email: partner.email, active: partner.active })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ partner: toPartner(data as Record<string, unknown>) }, { status: 201, headers: NO_STORE });
  } catch (error) {
    return jsonError(error);
  }
}
