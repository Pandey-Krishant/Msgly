import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

const groupId = () => `group_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const me = (searchParams.get("me") || "").trim();
    if (!me) {
      return NextResponse.json({ success: false, items: [] }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("msgly");

    const groups = await db
      .collection("groups")
      .find({ members: me })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();

    const items = groups.map((g: any) => ({
      id: g._id,
      name: g.name,
      description: g.description || "",
      members: g.members || [],
      createdBy: g.createdBy || "",
      createdAt: g.createdAt || null,
      updatedAt: g.updatedAt || null,
    }));

    return NextResponse.json({ success: true, items });
  } catch (error) {
    return NextResponse.json({ success: false, items: [], error }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, members, createdBy } = await req.json();
    if (!name || !description || !Array.isArray(members) || members.length < 2 || !createdBy) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("msgly");
    const now = new Date();
    const idObj = new ObjectId();

    await db.collection("groups").insertOne({
      _id: idObj,
      name,
      description,
      members,
      createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      group: { id: idObj.toHexString(), name, description, members, createdBy, createdAt: now, updatedAt: now },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal Error", error }, { status: 500 });
  }
}
