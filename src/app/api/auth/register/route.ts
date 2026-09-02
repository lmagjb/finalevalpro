import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail, REGISTERABLE_ROLES, UserRole } from "@/lib/db";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = body.role as UserRole;

    if (!fullName || !email || !password || !REGISTERABLE_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "All fields are required and role must be valid." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await createUser({ fullName, email, passwordHash, role });

    // Create the matching profile row so the dashboard has somewhere to
    // read school/division/etc. from once the person fills it in.
    if (role === "teacher") {
      await pool.query(
        `INSERT INTO teacher_profiles (user_id) VALUES (?)`,
        [userId]
      );
    } else {
      await pool.query(
        `INSERT INTO staff_profiles (user_id) VALUES (?)`,
        [userId]
      );
    }

    return NextResponse.json({ id: userId }, { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
