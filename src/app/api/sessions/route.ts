import { NextResponse } from "next/server";
import { getAvailability, winterCapActive } from "@/lib/winter-capacity";

export const dynamic = "force-dynamic";

/** Public: places left in each Winter Streetball session, for the form. */
export async function GET() {
  if (!winterCapActive()) {
    return NextResponse.json({ enabled: false, sessions: [] });
  }
  try {
    const sessions = await getAvailability();
    return NextResponse.json(
      { enabled: true, sessions },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Session availability failed:", error);
    return NextResponse.json(
      { enabled: true, sessions: [], error: "Unable to load places right now." },
      { status: 502 },
    );
  }
}
