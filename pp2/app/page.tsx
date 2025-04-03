'use client';
import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import Navbar from "./components/Navbar";
import { useRouter } from "next/navigation";
=======
import Navbar from "../components/navbar";
>>>>>>> 09ab347c783da35ad0f32490b2fdc9fc243b0827

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState("Select");
  const transitionTexts = [" flight ", " hotel "];
  const [animatedText, setAnimatedText] = useState(transitionTexts[0]);

  // update animated text every 3 sec
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedText(prev => {
        const currentIndex = transitionTexts.indexOf(prev);
        const nextIndex = (currentIndex + 1) % transitionTexts.length;
        return transitionTexts[nextIndex];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSelect = (option: string) => {
    setSelected(option);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Navigate based on selection
    if (option === "Flights") {
      router.push("/flights");
    } else if (option === "Hotels") {
      router.push("/hotels");
    }
  };

  return (
    <main className="flex flex-col min-h-screen min-w-screen bg-base-200">
      <Navbar />
      <div className="flex flex-col min-h-screen items-center justify-center w-full px-4">
        <h1 className="text-4xl font-bold text-center">
          Welcome to FlyNext
          <span key={animatedText + "-2"} className="animate-fadeIn">
            {animatedText}
          </span>
          booking.
        </h1>
        <h1 className="text-3xl font-bold m-2 text-center">
          Book a
          <span key={animatedText} className="animate-fadeIn">
            {animatedText}
          </span>
          seamlessly.
        </h1>
        <p className="text-lg text-center">
          Easy travel
          <span key={animatedText + "-3"} className="animate-fadeIn">
            {animatedText}
          </span>
          booking at your fingertips.
        </p>
        <div className="flex flex-row items-center justify-center mt-4">
          <p className="text-lg text-center">Search for</p>
          {/* dropdown */}
          <div className="dropdown ml-2">
            <label
              tabIndex={0}
              className="btn btn-outline btn-sm flex items-center"
            >
              <span>{selected}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40"
            >
              <li>
                <a onClick={() => handleSelect("Flights")}>Flights</a>
              </li>
              <li>
                <a onClick={() => handleSelect("Hotels")}>Hotels</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {/* fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </main>
  );
}
