import { ApiError, jsonError } from "@/lib/server/api";
import {
  clearAdvisorSession,
  setAdvisorSession,
} from "@/lib/server/session";
import { getActiveAdvisorSession } from "@/lib/server/advisor-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { validatePassword } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface VerifiedAdvisor {
  id: string;
  code: string;
  name: string;
}

interface AdvisorSessionVersion {
  session_version: number;
}

function validateCode(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 64) {
    throw new ApiError("El código de asesor no es válido.");
  }

  return value.trim();
}

export async function GET() {
  try {
    const advisor = await getActiveAdvisorSession();
    const response = NextResponse.json(
      advisor ? { authenticated: true, advisor } : { authenticated: false, advisor: null },
      { headers: { "Cache-Control": "no-store" } },
    );
    if (!advisor) clearAdvisorSession(response);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = validateCode(body.code);
    const password = validatePassword(body.password);
    const { data, error } = await getSupabaseAdmin().rpc("verify_advisor_credentials", {
      p_code: code,
      p_password: password,
    });

    const advisor = (data as VerifiedAdvisor[] | null)?.[0];
    if (error || !advisor) {
      throw new ApiError("Código o contraseña incorrectos.", 401);
    }

    const { data: sessionRecord, error: sessionError } = await getSupabaseAdmin()
      .from("advisors")
      .select("session_version")
      .eq("id", advisor.id)
      .single();

    if (sessionError) throw sessionError;
    if (!sessionRecord || !Number.isInteger((sessionRecord as AdvisorSessionVersion).session_version)) {
      throw new ApiError("No fue posible iniciar la sesión del asesor.", 503);
    }

    const sessionVersion = (sessionRecord as AdvisorSessionVersion).session_version;

    const response = NextResponse.json(
      { authenticated: true, advisor: { id: advisor.id, code: advisor.code, name: advisor.name } },
      { headers: { "Cache-Control": "no-store" } },
    );
    setAdvisorSession(response, { id: advisor.id, code: advisor.code, name: advisor.name, sessionVersion });
    return response;
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
  clearAdvisorSession(response);
  return response;
}
