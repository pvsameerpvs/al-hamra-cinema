import { NextResponse } from "next/server";
import { getUserByCredentials } from "@/lib/sheetHelpers";
import { setSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const user = await getUserByCredentials(username, password);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await setSession({ username: user.username, role: user.role });

    return NextResponse.json({ success: true, user: { username: user.username, role: user.role } });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
