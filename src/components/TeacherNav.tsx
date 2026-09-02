"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface NotificationItem {
  id: number;
  title: string;
  body: string;
  type: "stage" | "returned" | "general";
  is_read: boolean;
  created_at: string;
}

export default function TeacherNav({
  subtitle = "Teacher Dashboard",
  backHref,
}: {
  subtitle?: string;
  backHref?: string;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/teacher/notifications?limit=5")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    await fetch("/api/teacher/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <nav className="bg-depedBlue h-20 flex items-center justify-between px-10 shadow-md flex-shrink-0">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link href={backHref} className="text-white hover:text-blue-100 transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
        )}
        <div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight">EvalPro</h1>
          <p className="text-blue-100 text-sm font-bold mt-[-4px]">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative" ref={notifRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNotifOpen((v) => !v);
            }}
            className="relative p-2 text-white hover:bg-blue-800 rounded-full transition-colors duration-200"
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-4 w-[400px] bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h4 className="text-lg font-bold text-gray-900">Notifications</h4>
                <div className="flex items-center gap-3">
                  <button onClick={markAllRead} className="text-sm font-semibold text-depedBlue hover:text-blue-800 transition-colors">
                    Mark all as read
                  </button>
                  <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close notifications">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {loaded && notifications.length === 0 && (
                <div className="text-center py-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-base font-bold text-gray-500">You&apos;re all caught up!</p>
                  <p className="text-sm text-textMuted mt-1">No new notifications.</p>
                </div>
              )}

              {notifications.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item px-6 py-4 border-b border-gray-100 ${
                        !n.is_read ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`unread-dot mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${!n.is_read ? "bg-depedBlue" : "bg-gray-300"}`} />
                        <div>
                          <h3 className={`text-sm font-bold ${!n.is_read ? "text-gray-900" : "text-textMuted"}`}>{n.title}</h3>
                          <p className="text-sm text-textMuted mt-0.5">{n.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
                <Link
                  href="/teacher/notifications"
                  className="text-depedBlue font-semibold text-base hover:text-blue-800 transition-colors inline-flex items-center justify-center gap-2 group"
                >
                  View All Notifications
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProfileOpen((v) => !v);
            }}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100 transition"
            aria-label="Open Profile Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden">
              <Link href="/teacher/profile" className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-semibold text-sm">Profile Settings</span>
              </Link>
              <Link href="/teacher/application-summary" className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-semibold text-sm">Application Summary</span>
              </Link>
              <Link href="/teacher/coi" className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-semibold text-sm">COI Summary</span>
              </Link>
              <Link href="/teacher/ncoi" className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="font-semibold text-sm">NCOI Evaluation</span>
              </Link>
              <Link href="/teacher/qualifications" className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span className="font-semibold text-sm">Qualification Standards</span>
              </Link>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-semibold text-sm">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
