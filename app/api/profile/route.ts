import { jsonError } from "@/lib/server/api";
import {
  clearVisitorSession,
  createVisitorSession,
  getVisitorSession,
  setVisitorSession,
} from "@/lib/server/session";
import { validateName } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const session = await getVisitorSession();

  return NextResponse.json(
    session
      ? { registered: true, name: session.name }
      : { registered: false, name: null },
    { headers: NO_STORE },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = validateName(body.name);
    const response = NextResponse.json({ registered: true, name }, { headers: NO_STORE });

    setVisitorSession(response, createVisitorSession(name));
    return response;
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE() {
  const response = NextResponse.json({ registered: false }, { headers: NO_STORE });
  clearVisitorSession(response);
  return response;
}
