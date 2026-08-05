import { captureReferral } from "@/lib/server/referrals";
import { setReferralSession } from "@/lib/server/session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ code: string }>;
}

/**
 * Canonical public referral link. A path is sent to the server, unlike a URL
 * fragment such as #10001, so attribution is recorded before the landing page
 * renders and works without waiting for client-side JavaScript.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;
  const response = NextResponse.redirect(new URL("/", request.url), 307);

  try {
    const result = await captureReferral(code, "/", "path");
    if (result.referral) setReferralSession(response, result.referral);
  } catch (error) {
    // A marketing link must never leave a potential client on an error page.
    console.error("Unable to capture referral from public link", error);
  }

  return response;
}
