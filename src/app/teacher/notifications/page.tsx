"use client";

import { useEffect, useState } from "react";
import TeacherNav from "@/components/TeacherNav";

interface NotificationItem {
  id: number;
  title: string;
  body: string;
  type: "stage" | "returned" | "general";
  is_read: boolean;
  created_at: string;
}

const FILTERS = [
  { key: "all", label: "All Notifications" },
  { key: "unread", label: "Unread" },
  { key: "stage", label: "Stage Updates" },
  { key: "returned", label: "Returned Documents" },
] as const;

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  useEffect(() => {
    fetch("/api/teacher/notifications?limit=100")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setLoading(false);
      });
  }, []);

  async function markRead(id: number) {
    await fetch(`/api/teacher/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    await fetch("/api/teacher/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const hasUnread = notifications.some((n) => !n.is_read);
  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return n.type === filter;
  });

  return (
    <div className="bg-depedBg min-h-screen flex flex-col">
      <TeacherNav subtitle="Teacher Dashboard" backHref="/teacher/dashboard" />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-10 py-10">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900">Notifications</h2>
            <p className="text-xl text-textMuted font-semibold mt-2">
              Stay updated on your promotion application status.
            </p>
          </div>
          <div className="flex gap-3">
            {hasUnread && (
              <button
                onClick={markAllRead}
                className="px-6 py-3 bg-white border border-gray-300 rounded-xl font-semibold text-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </header>

        <div className="flex gap-4 mb-8 border-b border-gray-200 pb-4">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-6 py-2 rounded-lg font-semibold text-lg border-2 transition-colors ${
                filter === f.key
                  ? "border-depedBlue bg-depedBlue text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-textMuted text-sm">Loading…</p>}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-2xl font-bold text-gray-500">You&apos;re all caught up!</p>
            <p className="text-base text-textMuted mt-2">No new notifications at this time.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`w-full text-left bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border p-6 flex items-start gap-4 transition-colors ${
                  !n.is_read ? "border-depedBlue/20 bg-blue-50/40" : "border-gray-100"
                }`}
              >
                <span className={`mt-2 h-2.5 w-2.5 rounded-full flex-shrink-0 ${!n.is_read ? "bg-depedBlue" : "bg-gray-300"}`} />
                <div>
                  <h3 className={`text-lg font-bold ${!n.is_read ? "text-gray-900" : "text-textMuted"}`}>
                    {n.title}
                  </h3>
                  <p className="text-base text-textMuted mt-1">{n.body}</p>
                  <p className="text-sm text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
