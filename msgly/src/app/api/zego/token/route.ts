import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId, userName, roomId } = await req.json();
    const appID = Number(String(process.env.ZEGO_APP_ID || "").trim());
    const serverSecret = String(process.env.ZEGO_SERVER_SECRET || "").trim();
    if (!appID || !serverSecret) {
      return NextResponse.json(
        { error: "Missing ZEGO config", appID: appID || null, hasSecret: Boolean(serverSecret) },
        { status: 500 }
      );
    }
    const uid = String(userId || "");
    const uname = String(userName || uid || "user");
    const rid = String(roomId || "");
    if (!uid || !rid) {
      return NextResponse.json({ error: "Missing userId or roomId" }, { status: 400 });
    }
    let ZegoUIKitPrebuilt: any;
    try {
      ({ ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt"));
    } catch (err) {
      return NextResponse.json({ error: "Zego import failed", details: String(err) }, { status: 500 });
    }
    let token = "";
    try {
      token = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, rid, uid, uname);
    } catch (err) {
      return NextResponse.json(
        {
          error: "Zego token generation failed",
          details: String(err),
          appID,
          roomId: rid,
          hint: "Re-check ZEGO_APP_ID and ZEGO_SERVER_SECRET (no spaces, exact match in Zego console).",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json({ error: "Unhandled error", details: String(err) }, { status: 500 });
  }
}
