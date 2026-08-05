import { jsonError } from "@/lib/server/api";
import { captureReferral, ReferralSource } from "@/lib/server/referrals";
import { setReferralSession } from "@/lib/server/session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function sourceFrom(value: unknown): ReferralSource {
  return value === "hash" || value === "query" ? value : "query";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await captureReferral(body.code, body.landingPath, sourceFrom(body.source));
    const response = NextResponse.json(
      {
        captured: result.captured,
        handled: Boolean(result.referral),
        retainedExisting: result.retainedExisting,
      },
      { headers: NO_STORE },
    );

    if (result.referral) setReferralSession(response, result.referral);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
