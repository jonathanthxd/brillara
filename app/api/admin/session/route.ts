import { ApiError, jsonError } from "@/lib/server/api";
import {
  clearAdminSession,
  getAdminSession,
  passwordsMatch,
  setAdminSession,
} from "@/lib/server/session";
import { validatePassword } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  return NextResponse.json(
    { authenticated: Boolean(await getAdminSession()) },
    { headers: NO_STORE },
  );
}

export async function POST(request: NextRequest) {
  try {
    const password = validatePassword((await request.json()).password);
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      throw new ApiError("El acceso administrativo aún no está configurado.", 503);
    }

    if (!passwordsMatch(password, expectedPassword)) {
      throw new ApiError("Contraseña incorrecta.", 401);
    }

    const response = NextResponse.json({ authenticated: true }, { headers: NO_STORE });
    setAdminSession(response);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false }, { headers: NO_STORE });
  clearAdminSession(response);
  return response;
}
