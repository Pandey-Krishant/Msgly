import clientPromise from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("brochat");
    return NextResponse.json({ message: "Database Connected, Bro! 🔥" });
  } catch (e) {
    return NextResponse.json({ message: "Error connecting to DB", error: e }, { status: 500 });
  }
}