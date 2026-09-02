"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface NotificationItem {
  id: number;
  title: string;
  body: string;
  is_read: boolean;
}

export default function RecentNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/teacher/notifications?limit=5")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <section className="mb-12">
      <h3 className="text-3xl font-bold text-gray-900 mb-6">Recent Notifications</h3>

      <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
        {loaded && notifications.length === 0 && (
          <div className="text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-xl font-bold text-gray-500">You&apos;re all caught up!</p>
            <p className="text-base text-textMuted mt-2">No new notifications at this time.</p>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 py-4">
                <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${!n.is_read ? "bg-depedBlue" : "bg-gray-300"}`} />
                <div>
                  <h4 className={`text-base font-bold ${!n.is_read ? "text-gray-900" : "text-textMuted"}`}>{n.title}</h4>
                  <p className="text-sm text-textMuted mt-0.5">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center border-t border-gray-100 pt-6">
          <Link
            href="/teacher/notifications"
            className="text-depedBlue font-semibold text-lg hover:text-blue-800 transition-colors inline-flex items-center justify-center gap-2 group"
          >
            View All Notifications
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
