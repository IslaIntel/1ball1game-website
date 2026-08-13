import { NextResponse } from "next/server";

/** Registration completes only after Stripe payment webhook confirmation. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Registration requires payment. Please complete checkout on the registration form.",
    },
    { status: 405 },
  );
}
