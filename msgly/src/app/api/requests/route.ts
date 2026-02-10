import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";

const getPairFilter = (a: string, b: string) => ({
  $or: [
    { sender: a, receiver: b },
    { sender: b, receiver: a },
  ],
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const inbox = searchParams.get("inbox");
    const user = (searchParams.get("user") || "").trim();
    const userA = (searchParams.get("userA") || "").trim();
    const userB = (searchParams.get("userB") || "").trim();

    const client = await clientPromise;
    const db = client.db("msgly");

    if (inbox === "1") {
      if (!user) {
        return NextResponse.json({ success: false, items: [] }, { status: 400 });
      }
      const pending = await db
        .collection("requests")
        .find({ receiver: user, status: "pending" })
        .sort({ updatedAt: -1 })
        .limit(50)
        .toArray();

      const userDb = client.db("brochat");
      const senders = pending.map((p: any) => p.sender);
      const senderDocs = await userDb
        .collection("users")
        .find({ uniqueUsername: { $in: senders } }, { projection: { _id: 0, uniqueUsername: 1, nickname: 1 } })
        .toArray();

      const nickMap = new Map<string, string>();
      senderDocs.forEach((u: any) => {
        if (u?.uniqueUsername) nickMap.set(u.uniqueUsername, u.nickname || "");
      });

      const items = pending.map((p: any) => ({
        username: p.sender,
        nickname: nickMap.get(p.sender) || "",
        status: p.status,
      }));

      return NextResponse.json({ success: true, items });
    }

    if (!userA || !userB) {
      return NextResponse.json({ success: false, status: "none" }, { status: 400 });
    }

    const doc = await db.collection("requests").findOne(getPairFilter(userA, userB));
    if (!doc) {
      return NextResponse.json({ success: true, status: "none" });
    }

    const direction = doc.sender === userA ? "outgoing" : "incoming";
    return NextResponse.json({
      success: true,
      status: doc.status,
      direction,
      blockedBy: doc.blockedBy || null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, status: "none", error }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { sender, receiver } = await req.json();
    if (!sender || !receiver) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("msgly");

    const existing = await db.collection("requests").findOne(getPairFilter(sender, receiver));
    if (existing?.status === "blocked") {
      return NextResponse.json({ success: false, status: "blocked", blockedBy: existing.blockedBy }, { status: 403 });
    }

    const now = new Date();
    if (existing) {
      const updated = await db.collection("requests").updateOne(
        { _id: existing._id },
        { $set: { sender, receiver, status: "pending", updatedAt: now } }
      );
      return NextResponse.json({ success: true, status: "pending", updated });
    }

    const result = await db.collection("requests").insertOne({
      sender,
      receiver,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, status: "pending", result });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal Error", error }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { sender, receiver, action, actor } = await req.json();
    if (!sender || !receiver || !action || !actor) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("msgly");

    const existing = await db.collection("requests").findOne(getPairFilter(sender, receiver));
    if (!existing) {
      return NextResponse.json({ success: false, message: "Request not found" }, { status: 404 });
    }

    const now = new Date();
    let update: any = { updatedAt: now };

    if (action === "accept") update.status = "accepted";
    if (action === "reject") update.status = "rejected";
    if (action === "block") {
      update.status = "blocked";
      update.blockedBy = actor;
    }
    if (action === "unblock") {
      update.status = "rejected";
      update.blockedBy = null;
    }

    const result = await db.collection("requests").updateOne(
      { _id: existing._id },
      { $set: update }
    );

    return NextResponse.json({ success: true, status: update.status, result });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal Error", error }, { status: 500 });
  }
}
