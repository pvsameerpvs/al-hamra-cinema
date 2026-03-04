import { NextResponse } from "next/server";
import { getUserByCredentials } from "@/lib/sheetHelpers";
import { setSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await getUserByCredentials(email, password);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await setSession({ email: user.email, role: user.role });

    return NextResponse.json({ success: true, user: { email: user.email, role: user.role } });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
