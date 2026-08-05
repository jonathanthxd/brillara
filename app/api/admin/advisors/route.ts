import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import {
  validateAdvisorCode,
  validateAdvisorName,
  validateAdvisorPassword,
} from "@/lib/validation";
import { DatabaseAdvisor, toAdvisor } from "@/types/advisor";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function requireAdmin() {
  if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);
}

function mapAdvisorError(error: unknown): never {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (code === "23505") throw new ApiError("Ya existe un asesor con ese código.", 409);
  if (code === "P0002") throw new ApiError("El asesor no existe.", 404);
  throw error;
}

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await getSupabaseAdmin()
      .from("advisors")
      .select("id, code, referral_code, name, created_at, updated_at")
      .order("name", { ascending: true });

    if (error) mapAdvisorError(error);
    return NextResponse.json(
      { advisors: ((data ?? []) as DatabaseAdvisor[]).map(toAdvisor) },
      { headers: NO_STORE },
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const name = validateAdvisorName(body.name);
    const code = validateAdvisorCode(body.code);
    const password = validateAdvisorPassword(body.password);

    const { data, error } = await getSupabaseAdmin().rpc("admin_create_advisor", {
      p_name: name,
      p_code: code,
      p_password: password,
    });

    if (error) mapAdvisorError(error);
    const record = (data as DatabaseAdvisor[] | null)?.[0];
    if (!record) throw new ApiError("No fue posible crear el asesor.", 500);

    return NextResponse.json({ advisor: toAdvisor(record) }, { status: 201, headers: NO_STORE });
  } catch (error) {
    return jsonError(error);
  }
}
