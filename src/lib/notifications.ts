import { pool } from "@/lib/db";

export interface NotificationRow {
  id: number;
  title: string;
  body: string;
  type: "stage" | "returned" | "general";
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(
  userId: number,
  limit = 50
): Promise<NotificationRow[]> {
  const [rows] = await pool.query(
    `SELECT id, title, body, type, is_read, created_at
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  );
  return rows as NotificationRow[];
}

export async function getUnreadCount(userId: number): Promise<number> {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );
  const list = rows as { cnt: number }[];
  return list[0]?.cnt ?? 0;
}

export async function markNotificationRead(
  notificationId: number,
  userId: number
): Promise<void> {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );
}

export async function createNotification(params: {
  userId: number;
  title: string;
  body: string;
  type?: "stage" | "returned" | "general";
}): Promise<void> {
  const { userId, title, body, type = "general" } = params;
  await pool.query(
    `INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)`,
    [userId, title, body, type]
  );
}
