import { ApiError, jsonError } from "@/lib/server/api";
import { getActivePartnerSession } from "@/lib/server/partner-auth";
import { assertPartnerLoginRateLimit, recordPartnerLoginAttempt } from "@/lib/server/rate-limit";
import { clearPartnerSession, setPartnerSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { validatePartnerCode, validatePassword } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface VerifiedPartnerUser {
  id: string;
  partner_id: string;
  location_id: string | null;
  name: string;
  role: "owner" | "manager" | "buyer";
  session_version: number;
}

function remoteAddress(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

async function audit(identifier: string, successful: boolean, userId: string | null, address: string): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc("record_partner_auth_event", {
    p_identifier: identifier,
    p_successful: successful,
    p_partner_user_id: userId,
    p_remote_address: address,
  });
  if (error) console.error("Unable to record partner authentication event", error);
}

export async function GET() {
  try {
    const partnerUser = await getActivePartnerSession();
    const response = NextResponse.json(
      partnerUser ? { authenticated: true, partnerUser } : { authenticated: false, partnerUser: null },
      { headers: { "Cache-Control": "no-store" } },
    );
    if (!partnerUser) clearPartnerSession(response);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  let code = "";
  let attemptRecorded = false;
  const address = remoteAddress(request);
  try {
    const body = await request.json();
    code = validatePartnerCode(body.code);
    const password = validatePassword(body.password);
    assertPartnerLoginRateLimit(address, code);

    const { data, error } = await getSupabaseAdmin().rpc("verify_partner_credentials", {
      p_code: code,
      p_password: password,
    });
    const partnerUser = (data as VerifiedPartnerUser[] | null)?.[0];
    if (error || !partnerUser) {
      recordPartnerLoginAttempt(address, code, false);
      attemptRecorded = true;
      await audit(code, false, null, address);
      throw new ApiError("Código o contraseña incorrectos.", 401);
    }

    recordPartnerLoginAttempt(address, code, true);
    attemptRecorded = true;
    await audit(code, true, partnerUser.id, address);
    const response = NextResponse.json(
      {
        authenticated: true,
        partnerUser: {
          id: partnerUser.id,
          partnerId: partnerUser.partner_id,
          locationId: partnerUser.location_id,
          name: partnerUser.name,
          role: partnerUser.role,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
    setPartnerSession(response, {
      id: partnerUser.id,
      partnerId: partnerUser.partner_id,
      locationId: partnerUser.location_id,
      name: partnerUser.name,
      role: partnerUser.role,
      sessionVersion: partnerUser.session_version,
    });
    return response;
  } catch (error) {
    if (code && !attemptRecorded) recordPartnerLoginAttempt(address, code, false);
    return jsonError(error);
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
  clearPartnerSession(response);
  return response;
}
