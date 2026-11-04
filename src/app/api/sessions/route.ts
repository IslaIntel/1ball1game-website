import { NextResponse } from "next/server";
import { getAvailability, winterCapActive } from "@/lib/winter-capacity";
import { toPublicAvailability } from "@/lib/winter-capacity-config";

export const dynamic = "force-dynamic";

/**
 * Public: whether each Winter Streetball session has spots or only the
 * waitlist. Counts stay private (staff see them on the staff page).
 */
export async function GET() {
  if (!winterCapActive()) {
    return NextResponse.json({ enabled: false, sessions: [] });
  }
  try {
    const sessions = (await getAvailability()).map(toPublicAvailability);
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
