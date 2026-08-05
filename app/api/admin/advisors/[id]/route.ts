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

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();
    const name = validateAdvisorName(body.name);
    const code = validateAdvisorCode(body.code);
    const password = validateAdvisorPassword(body.password, false);

    const { data, error } = await getSupabaseAdmin().rpc("admin_update_advisor", {
      p_id: id,
      p_name: name,
      p_code: code,
      p_password: password,
    });

    if (error) mapAdvisorError(error);
    const record = (data as DatabaseAdvisor[] | null)?.[0];
    if (!record) throw new ApiError("El asesor no existe.", 404);

    return NextResponse.json({ advisor: toAdvisor(record) }, { headers: NO_STORE });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    if (!id.trim()) throw new ApiError("El asesor no es válido.");

    const { error } = await getSupabaseAdmin().rpc("admin_delete_advisor", { p_id: id });
    if (error) mapAdvisorError(error);

    return NextResponse.json({ deleted: true }, { headers: NO_STORE });
  } catch (error) {
    return jsonError(error);
  }
}
