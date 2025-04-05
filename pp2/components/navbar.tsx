'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/auth-context";
import { usePathname, useSearchParams } from "next/navigation";

interface Notification {
  id: number;
  userId: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const { user, loading, logout } = useAuth();
  const pathname = usePathname(); // Get current path
  const searchParams = useSearchParams(); // Get search params
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const currentPath =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  // Count unread notifications
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      console.log("Current user:", user); // Debug log
      if (!user.id) {
        console.error("No user ID available");
        return;
      }
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Toggle dark mode
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/users/notifications", {
        headers: {
          "x-user-id": user?.id?.toString() || "",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
        credentials: "include"
      });
      const data = await res.json();
      console.log("API Response:", data); // Debug log
      console.log("User ID being sent:", user?.id); // Debug log
      if (res.ok) {
        setNotifications(data.notifications || []);
        console.log("Set notifications:", data.notifications); // Debug log
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const res = await fetch("/api/users/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id?.toString() || "",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`, 
        },
        credentials: "include", 
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (res.ok) {
        // Update local state
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === notificationId ? { ...notification, is_read: true } : notification
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleToggle = () => {
    setDarkMode((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // You could add a notification or redirect here if needed
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="w-full bg-base-200">
      <div className="max-w-screen-3xl mx-auto px-4 py-4">
        <div className="navbar bg-primary text-primary-content rounded-xl shadow-lg">
          <div className="navbar-start">
            {/* Mobile (hamburger) dropdown */}
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
                <li>
                  <Link href="/flights">Flights</Link>
                </li>
                <li>
                  <Link href="/hotels">Hotels</Link>
                </li>
                <li>
                  <Link href="/bookings">Bookings</Link>
                </li>
                <li>
                  <Link href="/manage-hotels">Manage Hotels</Link>
                </li>
              </ul>
            </div>
            <Link href="/" className="btn btn-ghost normal-case text-xl">
              FlyNext
            </Link>
          </div>
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal p-0">
              <li>
                <Link href="/flights">Flights</Link>
              </li>
              <li>
                <Link href="/hotels">Hotels</Link>
              </li>
              <li>
                <Link href="/bookings">Bookings</Link>
              </li>
              <li>
                <Link href="/manage-hotels">Manage Hotels</Link>
              </li>
            </ul>
          </div>
          <div className="navbar-end flex gap-2 items-center">
            <label className="normal-case font-bold">Dark mode</label>
            {/* Custom toggle input */}
            <input
              type="checkbox"
              checked={darkMode}
              onChange={handleToggle}
              className="custom-toggle"
            />

            {loading ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : user ? (
              <>
                {/* Notification Bell */}
                <div className="dropdown dropdown-end mr-2">
                  <label
                    tabIndex={0}
                    className="btn btn-ghost btn-circle"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                  >
                    <div className="indicator">
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
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="badge badge-sm badge-accent indicator-item">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </label>
                  <div
                    tabIndex={0}
                    className="dropdown-content z-[1] card card-compact w-80 p-2 shadow bg-base-100 text-base-content"
                  >
                    <div className="card-body">
                      <h3 className="font-bold text-lg">Notifications</h3>
                      {notifications.length > 0 ? (
                        <ul className="menu bg-base-100 w-full max-h-64 overflow-y-auto">
                          {notifications.map((notification) => (
                            <li
                              key={notification.id}
                              className={notification.is_read ? "" : "font-bold"}
                            >
                              <a onClick={() => markAsRead(notification.id)}>
                                {notification.message}
                                <div className="text-xs opacity-50">
                                  {new Date(notification.created_at).toLocaleString()}
                                </div>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No notifications</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Profile Dropdown */}
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-ghost">
                    <div className="flex items-center">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt="Profile"
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="avatar placeholder mr-2">
                          <div className="bg-secondary text-secondary-content rounded-full w-8">
                            <span>
                              {user.first_name?.charAt(0)}
                              {user.last_name?.charAt(0)}
                            </span>
                          </div>
                        </div>
                      )}
                      <span>{user.first_name}</span>
                    </div>
                  </label>
                  <ul
                    tabIndex={0}
                    className="menu dropdown-content z-[1] p-2 shadow bg-primary text-primary-content rounded-box w-52 mt-4"
                  >
                    <li>
                      <Link href="/profile">Profile</Link>
                    </li>
                    <li>
                      <Link href="/bookings">My Bookings</Link>
                    </li>
                    <li>
                      <button onClick={handleLogout}>Logout</button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Link
                  href={`/login?redirect=${encodeURIComponent(currentPath)}`}
                  className="btn btn-ghost"
                >
                  Login
                </Link>
                <Link href="/register" className="btn btn-ghost">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS for the always-white toggle */}
      {/* ASSISTED BY AI */}
      <style jsx>{`
        /* Hide default checkbox appearance */
        .custom-toggle {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          width: 48px;
          height: 24px;
          border: 2px solid white; /* Always white border */
          border-radius: 9999px; /* Fully rounded */
          background-color: #333; /* Dark background */
          cursor: pointer;
          outline: none;
          transition: background-color 0.2s ease;
        }

        /* The white circle inside the toggle */
        .custom-toggle::before {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background-color: white; /* White circle */
          border-radius: 9999px;
          transition: transform 0.2s ease;
        }

        /* Move the circle to the right when checked */
        .custom-toggle:checked::before {
          transform: translateX(24px);
        }
      `}</style>
    </div>
  );
};

export default Navbar;