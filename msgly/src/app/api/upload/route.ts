import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const resourceType = (formData.get("resourceType") as string | null) || "image";
    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ success: false, message: "Cloudinary env missing" }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "msgly";
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("api_key", apiKey);
    uploadData.append("timestamp", String(timestamp));
    uploadData.append("folder", folder);
    uploadData.append("signature", signature);

    const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: "POST",
      body: uploadData,
    });

    const data = await cloudinaryRes.json();
    if (!cloudinaryRes.ok) {
      return NextResponse.json({ success: false, message: "Upload failed", error: data }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: data.secure_url });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal Error", error }, { status: 500 });
  }
}
