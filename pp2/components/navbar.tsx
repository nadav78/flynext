'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/auth-context";

const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

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
                          <span>{user.first_name?.charAt(0)}{user.last_name?.charAt(0)}</span>
                        </div>
                      </div>
                    )}
                    <span>{user.first_name}</span>
                  </div>
                </label>
                <ul tabIndex={0} className="menu dropdown-content z-[1] p-2 shadow bg-primary text-primary-content rounded-box w-52 mt-4">
                  <li><Link href="/profile">Profile</Link></li>
                  <li><Link href="/bookings">My Bookings</Link></li>
                  <li><button onClick={handleLogout}>Logout</button></li>
                </ul>
              </div>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">Login</Link>
                <Link href="/register" className="btn btn-ghost">Register</Link>
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
