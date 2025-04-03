'use client';
import React from 'react';

const Navbar: React.FC = () => {
  return (
    <div className="w-full bg-base-200">
      {/* Wrapper container that centers content and adds horizontal padding */}
      <div className="max-w-screen-3xl mx-auto px-4 py-4">
        <div className="navbar bg-primary text-primary-content rounded-xl shadow-lg">
          <div className="navbar-start">
            {/* Mobile dropdown */}
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
                <li><a>Flights</a></li>
                <li><a>Hotels</a></li>
                <li><a>Bookings</a></li>
                <li><a>Manage Hotels</a></li>
              </ul>
            </div>
            <a className="btn btn-ghost normal-case text-xl">FlyNext</a>
          </div>
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal p-0">
              <li><a>Flights</a></li>
              <li><a>Hotels</a></li>
              <li><a>Bookings</a></li>
              <li><a>Manage Hotels</a></li>
            </ul>
          </div>
          <div className="navbar-end">
            <label className=" normal-case font-bold">Dark mode</label>
            <input type="checkbox" defaultChecked className="toggle m-2" />
            <a className="btn btn-ghost">Login</a>
            <a className="btn btn-ghost">Register</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
