import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";

// 1. MESSAGES KO DATABASE SE NIKALNE KE LIYE (GET)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatWith = searchParams.get("chatWith");
    const me = searchParams.get("me");
    if (!chatWith || !me) {
      return NextResponse.json({ success: false, data: [] }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("msgly");
    const isGroup = chatWith.startsWith("group_");
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
    const resolvedChatWith = isGroup ? chatWith : await resolve(chatWith);

    const query = isGroup
      ? { receiver: resolvedChatWith }
      : {
          $or: [
            { sender: resolvedMe, receiver: resolvedChatWith },
            { sender: resolvedChatWith, receiver: resolvedMe },
          ],
        };

    const messages = await db.collection("messages").find(query).sort({ timestamp: 1 }).toArray();

    return NextResponse.json({ success: true, data: messages, resolved: { me: resolvedMe, chatWith: resolvedChatWith } });
  } catch (error) {
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

// 2. NAYA MESSAGE SAVE KARNE KE LIYE (POST)
export async function POST(req: Request) {
  try {
    const { sender, receiver, text, mediaUrl, mediaType } = await req.json();
    const client = await clientPromise;
    const db = client.db("msgly");

    const newMessage = await db.collection("messages").insertOne({
      sender,
      receiver,
      text: text || "",
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || "",
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, data: newMessage });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Save nahi hua bro" }, { status: 500 });
  }
}
