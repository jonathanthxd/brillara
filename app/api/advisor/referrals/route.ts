import { jsonError } from "@/lib/server/api";
import { requireActiveAdvisorSession } from "@/lib/server/advisor-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface AttributionLead {
  id: string;
  registered_name: string | null;
  registered_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

function countOrZero(value: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function GET() {
  try {
    const advisor = await requireActiveAdvisorSession();
    const supabase = getSupabaseAdmin();

    const [advisorResult, visitsResult, registrationsResult, ticketsResult, purchasesResult, leadsResult] = await Promise.all([
      supabase
        .from("advisors")
        .select("referral_code")
        .eq("id", advisor.id)
        .single(),
      supabase
        .from("referral_attributions")
        .select("id", { count: "exact", head: true })
        .eq("advisor_id", advisor.id),
      supabase
        .from("referral_attributions")
        .select("id", { count: "exact", head: true })
        .eq("advisor_id", advisor.id)
        .not("registered_at", "is", null),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("referrer_advisor_id", advisor.id),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("referrer_advisor_id", advisor.id)
        .eq("status", "compra-realizada"),
      supabase
        .from("referral_attributions")
        .select("id, registered_name, registered_at, first_seen_at, last_seen_at")
        .eq("advisor_id", advisor.id)
        .order("first_seen_at", { ascending: false })
        .limit(12),
    ]);

    for (const result of [advisorResult, visitsResult, registrationsResult, ticketsResult, purchasesResult, leadsResult]) {
      if (result.error) throw result.error;
    }

    const referralCode = String((advisorResult.data as { referral_code: string }).referral_code);
    const leads = (leadsResult.data ?? []) as AttributionLead[];

    return NextResponse.json(
      {
        referral: {
          code: referralCode,
          shareUrl: `https://www.brillara.gold/r/${encodeURIComponent(referralCode)}`,
          uniqueVisitors: countOrZero(visitsResult.count),
          registeredLeads: countOrZero(registrationsResult.count),
          ticketsCreated: countOrZero(ticketsResult.count),
          purchasesCompleted: countOrZero(purchasesResult.count),
          recentLeads: leads.map((lead) => ({
            id: String(lead.id),
            name: lead.registered_name,
            registeredAt: lead.registered_at,
            firstSeenAt: lead.first_seen_at,
            lastSeenAt: lead.last_seen_at,
          })),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
