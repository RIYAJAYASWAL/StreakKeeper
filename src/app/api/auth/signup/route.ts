import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, timezone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Example API response - would hash password & save to DB via Prisma
    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          email,
          name,
          timezone: timezone || "UTC",
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
