import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId, userName, roomId } = await req.json();
    const appID = Number(process.env.ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_SERVER_SECRET || "";
    if (!appID || !serverSecret) {
      return NextResponse.json({ error: "Missing ZEGO config" }, { status: 500 });
    }
    const uid = String(userId || "");
    const uname = String(userName || uid || "user");
    const rid = String(roomId || "");
    if (!uid || !rid) {
      return NextResponse.json({ error: "Missing userId or roomId" }, { status: 400 });
    }
    const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
    const token = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, rid, uid, uname);
    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
