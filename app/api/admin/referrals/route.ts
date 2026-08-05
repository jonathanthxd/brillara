import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ReferralReportRecord {
  advisor_id: string;
  advisor_code: string;
  advisor_name: string;
  referral_code: string;
  unique_visitors: number | string | null;
  registered_leads: number | string | null;
  tickets_created: number | string | null;
  purchases_completed: number | string | null;
}

function numeric(value: number | string | null): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
  try {
    if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);

    const { data, error } = await getSupabaseAdmin().rpc("admin_referral_report");
    if (error) throw error;

    const reports = ((data ?? []) as ReferralReportRecord[]).map((record) => ({
      advisorId: String(record.advisor_id),
      advisorCode: record.advisor_code,
      advisorName: record.advisor_name,
      referralCode: record.referral_code,
      shareUrl: `https://www.brillara.gold/r/${encodeURIComponent(record.referral_code)}`,
      uniqueVisitors: numeric(record.unique_visitors),
      registeredLeads: numeric(record.registered_leads),
      ticketsCreated: numeric(record.tickets_created),
      purchasesCompleted: numeric(record.purchases_completed),
    }));

    return NextResponse.json({ reports }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
