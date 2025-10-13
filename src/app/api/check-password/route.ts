import { NextResponse } from "next/server";
import { z } from "zod";

const PasswordSchema = z.object({
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = PasswordSchema.parse(body);

    const correctPassword = process.env.SIGNUP_PASSWORD || "MurhaOnPop";

    if (password === correctPassword) {
      const response = NextResponse.json({ success: true });

      // Set authentication cookie that expires in 1 hour
      response.cookies.set("signup-auth", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600, // 1 hour
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Väärä salasana" },
      { status: 401 },
    );
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "Virheellinen pyyntö" },
      { status: 400 },
    );
  }
}
