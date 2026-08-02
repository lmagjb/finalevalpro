import mysql from "mysql2/promise";

// Reuse a single pool across hot reloads / serverless invocations.
declare global {
  // eslint-disable-next-line no-var
  var _evalproPool: mysql.Pool | undefined;
}

export const pool =
  global._evalproPool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== "production") {
  global._evalproPool = pool;
}

export type UserRole = "teacher" | "admin_officer";

export interface DbUser {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const [rows] = await pool.query(
    "SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  const users = rows as DbUser[];
  return users[0] ?? null;
}

export async function createUser(params: {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}): Promise<number> {
  const { fullName, email, passwordHash, role } = params;
  const [result] = await pool.query(
    "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [fullName, email, passwordHash, role]
  );
  // @ts-expect-error mysql2 OkPacket typing
  return result.insertId as number;
}
