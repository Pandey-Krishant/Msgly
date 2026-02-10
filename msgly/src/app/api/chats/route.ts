import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const me = (searchParams.get("me") || "").trim();
    if (!me) {
      return NextResponse.json({ success: false, items: [] }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("msgly");
    const alias = db.collection("username_aliases");

    const resolve = async (name: string) => {
      let current = name;
      for (let i = 0; i < 3; i++) {
        const found = await alias.findOne({ old: current });
        if (!found?.next) break;
        current = found.next;
      }
      return current;
    };

    const resolvedMe = await resolve(me);

    const pipeline = [
      { $match: { $or: [{ sender: resolvedMe }, { receiver: resolvedMe }] } },
      { $sort: { timestamp: -1 } },
      {
        $addFields: {
          other: {
            $cond: [{ $eq: ["$sender", resolvedMe] }, "$receiver", "$sender"],
          },
        },
      },
      {
        $group: {
          _id: "$other",
          lastMessage: { $first: "$text" },
          lastTimestamp: { $first: "$timestamp" },
        },
      },
      { $sort: { lastTimestamp: -1 } },
      { $limit: 50 },
    ];

    const chats = await db.collection("messages").aggregate(pipeline).toArray();
    const usernames = chats.map((c: any) => c._id);

    const userDb = client.db("brochat");
    const userDocs = await userDb
      .collection("users")
      .find(
        { uniqueUsername: { $in: usernames } },
        { projection: { _id: 0, uniqueUsername: 1, nickname: 1, image: 1 } }
      )
      .toArray();

    const nickMap = new Map<string, string>();
    const imageMap = new Map<string, string>();
    userDocs.forEach((u: any) => {
      if (u?.uniqueUsername) nickMap.set(u.uniqueUsername, u.nickname || "");
      if (u?.uniqueUsername) imageMap.set(u.uniqueUsername, u.image || "");
    });

    const items = chats.map((c: any) => ({
      username: c._id,
      nickname: nickMap.get(c._id) || "",
      image: imageMap.get(c._id) || "",
      lastMessage: c.lastMessage || "",
      lastTimestamp: c.lastTimestamp || null,
    }));

    const groups = await db
      .collection("groups")
      .find({ members: resolvedMe })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();

    if (groups.length) {
      const groupIds = groups.map((g: any) => g._id);
      const groupMessages = await db
        .collection("messages")
        .find({ receiver: { $in: groupIds } })
        .sort({ timestamp: -1 })
        .limit(200)
        .toArray();

      const groupLast = new Map<string, any>();
      for (const m of groupMessages) {
        if (!groupLast.has(m.receiver)) {
          groupLast.set(m.receiver, m);
        }
      }

      const groupItems = groups.map((g: any) => {
        const last = groupLast.get(g._id);
        return {
          username: g._id,
          nickname: g.name,
          image: "",
          lastMessage: last?.text || "",
          lastTimestamp: last?.timestamp || g.updatedAt || null,
          isGroup: true,
          description: g.description || "",
        };
      });

      items.push(...groupItems);
      items.sort((a: any, b: any) => {
        const ta = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0;
        const tb = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0;
        return tb - ta;
      });
    }

    return NextResponse.json({ success: true, items });
  } catch (error) {
    return NextResponse.json({ success: false, items: [], error }, { status: 500 });
  }
}
