import { NextResponse } from "next/server";

const WEBHOOK_URL =
  process.env.CONTACT_WEBHOOK_URL ??
  "https://waves.islaintel.com/api/v1/webhooks/S2bgx5mxtevAMOyUCunRR";

type ContactPayload = {
  name: string;
  school: string;
  phone: string;
  email: string;
  message: string;
};

export async function POST(request: Request) {
  let body: ContactPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, school, phone, email, message } = body;

  if (!name?.trim() || !school?.trim() || !phone?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        school: school.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: message.trim(),
        source: "1ball1game-website",
        submitted_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to send your message right now. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to send your message right now. Please try again." },
      { status: 502 },
    );
  }
}
