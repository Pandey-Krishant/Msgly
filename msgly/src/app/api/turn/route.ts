import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.METERED_TURN_API_KEY;
  const appName = process.env.METERED_APP_NAME;
  if (!apiKey || !appName) {
    return NextResponse.json(
      { success: false, message: "Missing TURN config" },
      { status: 500 }
    );
  }

  const url = `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: "TURN fetch failed", status: res.status },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { success: true, iceServers: data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "TURN fetch error", error: String(err) },
      { status: 500 }
    );
  }
}
