import clientPromise from "@/lib/db"; // Path check kar lena bro
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { User } from "@/models/user"; // Interface import kiya yahan 🔥

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        // Basic Validation
        if (!name || !email || !password) {
            return NextResponse.json({ message: "Fields missing!" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const client = await clientPromise;
        const db = client.db("brochat");

        // Check if user exists
        const existingUser = await db.collection<User>("users").findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: "User already exists!" }, { status: 400 });
        }

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

        // Interface ko use karke naya user object banaya
        const newUser: User = {
            name,
            email,
            password: hashedPassword,
            nickname: getNickname(email),
            uniqueUsername: generateUniqueUsername(email),
            createdAt: new Date(),
        };

        const result = await db.collection<User>("users").insertOne(newUser);

        return NextResponse.json({ 
            message: "User Created!", 
            userId: result.insertedId 
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: "Internal Error", error }, { status: 500 });
    }
}
