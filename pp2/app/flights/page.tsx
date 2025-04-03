'use client';
import React, { useState } from "react";
import Navbar from "../components/navbar";

const FlightsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departure: "",
    arrival: "",
    type: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "type" && value === "first") {
      // Clear arrival when one-way is selected
      setFormData((prev) => ({ ...prev, type: value, arrival: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // todo
  };

  return (
    <div className="flex flex-col min-h-screen min-w-screen bg-base-200">
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded-lg p-6 w-full max-w-lg"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Search Flights
          </h2>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="origin">
              Origin
            </label>
            <input
              type="text"
              id="origin"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              placeholder="Enter origin"
              className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="destination">
              Destination
            </label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="Enter destination"
              className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="departure">
                Departure
              </label>
              <input
                type="date"
                id="departure"
                name="departure"
                value={formData.departure}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="arrival">
                Arrival
              </label>
              <input
                type="date"
                id="arrival"
                name="arrival"
                value={formData.arrival}
                onChange={handleChange}
                disabled={formData.type === "first"}
                className={`w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring focus:border-blue-300 ${
                  formData.type === "first" ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="type">
              Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="">Select type</option>
              <option value="first">One-way</option>
              <option value="round">Round-trip</option>
            </select>
          </div>
          <button type="submit" className="w-full btn btn-primary">
            Search
          </button>
        </form>
      </div>
      {/* force date pickers to use light color scheme so icons remain black */}
      <style jsx>{`
        input[type="date"] {
          /* Force native date picker to use the light color scheme */
          color-scheme: light;
        }
      `}</style>
    </div>
  );
};

export default FlightsPage;
