"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

export default function StaffNav({ subtitle }: { subtitle: string }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/teacher/notifications?limit=20")
      .then((r) => r.json())
      .then((data) => {
        const list = data.notifications ?? [];
        setUnread(list.filter((n: { is_read: boolean }) => !n.is_read).length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <nav className="bg-depedBlue h-20 flex items-center justify-between px-10 shadow-md flex-shrink-0">
      <div>
        <h1 className="text-white text-3xl font-extrabold tracking-tight">EvalPro</h1>
        <p className="text-blue-100 text-sm font-bold mt-[-4px]">{subtitle}</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative p-2 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unread > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
              {unread}
            </span>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProfileOpen((v) => !v);
            }}
            className="w-12 h-12 bg-white/10 border-2 border-white/30 rounded-full flex items-center justify-center shadow-sm hover:bg-white/20 transition"
            aria-label="Open Profile Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden">
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
