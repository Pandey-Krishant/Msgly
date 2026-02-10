import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ success: false, message: "Email required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("brochat");
    const user = await db.collection("users").findOne(
      { email },
      { projection: { _id: 0, email: 1, uniqueUsername: 1, nickname: 1, image: 1, status: 1 } }
    );

    return NextResponse.json({ success: true, user: user || null });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal Error", error }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { email, uniqueUsername, image, status } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, message: "Email required" }, { status: 400 });
    }

    const client = await clientPromise;
    const userDb = client.db("brochat");
    const msgDb = client.db("msgly");

    const existing = await userDb.collection("users").findOne({ email });
    if (!existing) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const nextUsername = (uniqueUsername || existing.uniqueUsername || "").trim().toLowerCase();
    if (!nextUsername) {
      return NextResponse.json({ success: false, message: "Username required" }, { status: 400 });
    }

    if (nextUsername !== existing.uniqueUsername) {
      const taken = await userDb.collection("users").findOne({ uniqueUsername: nextUsername });
      if (taken) {
        return NextResponse.json({ success: false, message: "Username already taken" }, { status: 409 });
      }
    }

    await userDb.collection("users").updateOne(
      { email },
      { $set: { uniqueUsername: nextUsername, image: image || "", status: status || "" } }
    );

    const oldUsername = existing.uniqueUsername;
    if (oldUsername && oldUsername !== nextUsername) {
      await msgDb.collection("messages").updateMany(
        { sender: oldUsername },
        { $set: { sender: nextUsername } }
      );
      await msgDb.collection("messages").updateMany(
        { receiver: oldUsername },
        { $set: { receiver: nextUsername } }
      );
      await msgDb.collection("requests").updateMany(
        { sender: oldUsername },
        { $set: { sender: nextUsername } }
      );
      await msgDb.collection("requests").updateMany(
        { receiver: oldUsername },
        { $set: { receiver: nextUsername } }
      );
      await msgDb.collection("requests").updateMany(
        { blockedBy: oldUsername },
        { $set: { blockedBy: nextUsername } }
      );
      await msgDb.collection("username_aliases").insertOne({
        old: oldUsername,
        next: nextUsername,
        updatedAt: new Date(),
      });
    }

    const updated = await userDb.collection("users").findOne(
      { email },
      { projection: { _id: 0, email: 1, uniqueUsername: 1, nickname: 1, image: 1, status: 1 } }
    );

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal Error", error }, { status: 500 });
  }
}
