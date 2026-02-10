import clientPromise from "@/lib/db";
import { NextResponse } from "next/server";

const getNickname = (value: string) => {
  if (!value) return "User";
  let namePart = value.split("@")[0] ?? "";
  namePart = namePart.replace(/[^a-zA-Z]/g, "");
  if (!namePart) return "User";
  return namePart.charAt(0).toUpperCase() + namePart.slice(1, 6);
};

const generateUniqueUsername = (value: string) => {
  if (!value) return "user";
  const [local = "", domain = ""] = value.toLowerCase().split("@");
  let base = (local + domain).replace(/[^a-z]/g, "");
  if (!base) return "user";
  base = base.slice(0, 8);
  let sum = 0;
  for (let i = 0; i < value.length; i++) sum += value.charCodeAt(i);
  const c1 = String.fromCharCode(97 + (sum % 26));
  const c2 = String.fromCharCode(97 + ((sum * 7) % 26));
  return (base + c1 + c2).slice(0, 10);
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = (searchParams.get("username") || "").trim().toLowerCase();
    if (!username) {
      return NextResponse.json({ success: false, message: "Username required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("brochat");

    const direct = await db.collection("users").findOne(
      { uniqueUsername: username },
      { projection: { _id: 0, uniqueUsername: 1, nickname: 1 } }
    );

    if (direct) {
      return NextResponse.json({
        success: true,
        user: {
          username: direct.uniqueUsername,
          nickname: direct.nickname,
        },
      });
    }

    // Fallback for older users without uniqueUsername stored
    const users = await db
      .collection("users")
      .find({}, { projection: { _id: 0, email: 1, nickname: 1, uniqueUsername: 1 } })
      .limit(500)
      .toArray();

    const match = users.find((u: any) => {
      if (u?.uniqueUsername) return u.uniqueUsername.toLowerCase() === username;
      if (!u?.email) return false;
      return generateUniqueUsername(u.email).toLowerCase() === username;
    });

    if (!match) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        username: match.uniqueUsername ?? generateUniqueUsername(match.email),
        nickname: match.nickname ?? getNickname(match.email),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal Error", error }, { status: 500 });
  }
}
