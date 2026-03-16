'use client';
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

type Notification = {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
};

const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Poll notifications every 30 seconds when logged in
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      try {
        const res = await fetch("/api/users/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications ?? []);
        }
      } catch {
        // silently ignore polling errors
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleBellClick = async () => {
    const next = !dropdownOpen;
    setDropdownOpen(next);

    // Mark all unread as read when opening
    if (next && unreadCount > 0) {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      const token = localStorage.getItem("accessToken");
      try {
        await fetch("/api/users/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notificationIds: unreadIds }),
        });
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="w-full bg-base-200">
      <div className="max-w-screen-3xl mx-auto px-4 py-4">
        <div className="navbar bg-primary text-primary-content rounded-xl shadow-lg">
          <div className="navbar-start">
            {/* Mobile hamburger */}
            <div className="dropdown">
              <label tabIndex={0} className="btn btn-ghost lg:hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-primary text-primary-content normal-case text-xl rounded-box w-52"
              >
                <li><Link href="/flights">Flights</Link></li>
                <li><Link href="/hotels">Hotels</Link></li>
                <li><Link href="/bookings">Bookings</Link></li>
                <li><Link href="/manage-hotels">Manage Hotels</Link></li>
              </ul>
            </div>
            <Link href="/" className="btn btn-ghost normal-case text-xl">
              FlyNext
            </Link>
          </div>

          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal p-0">
              <li><Link href="/flights">Flights</Link></li>
              <li><Link href="/hotels">Hotels</Link></li>
              <li><Link href="/bookings">Bookings</Link></li>
              <li><Link href="/manage-hotels">Manage Hotels</Link></li>
            </ul>
          </div>

          <div className="navbar-end flex gap-2 items-center">
            <label className="normal-case font-bold">Dark mode</label>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode((prev) => !prev)}
              className="custom-toggle"
            />

            {user ? (
              <>
                {/* Notification bell */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    className="btn btn-ghost btn-circle"
                    onClick={handleBellClick}
                    aria-label="Notifications"
                  >
                    <div className="relative">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-error text-error-content text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-base-100 text-base-content rounded-box shadow-xl z-50 border border-base-300">
                      <div className="p-3 border-b border-base-300 font-semibold text-sm">
                        Notifications
                      </div>
                      <ul className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <li className="p-4 text-sm text-base-content/60 text-center">
                            No notifications
                          </li>
                        ) : (
                          notifications.map((n) => (
                            <li
                              key={n.id}
                              className={`px-4 py-3 text-sm border-b border-base-200 last:border-0 ${
                                !n.is_read ? "bg-primary/10 font-medium" : ""
                              }`}
                            >
                              <p>{n.message}</p>
                              <p className="text-xs text-base-content/50 mt-1">
                                {new Date(n.created_at).toLocaleString()}
                              </p>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <Link href="/profile" className="btn btn-ghost">Profile</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">Login</Link>
                <Link href="/register" className="btn btn-ghost">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-toggle {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          width: 48px;
          height: 24px;
          border: 2px solid white;
          border-radius: 9999px;
          background-color: #333;
          cursor: pointer;
          outline: none;
          transition: background-color 0.2s ease;
        }
        .custom-toggle::before {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background-color: white;
          border-radius: 9999px;
          transition: transform 0.2s ease;
        }
        .custom-toggle:checked::before {
          transform: translateX(24px);
        }
      `}</style>
    </div>
  );
};

export default Navbar;
