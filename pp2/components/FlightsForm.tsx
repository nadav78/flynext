// app/flights/FlightsForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Combobox } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { Airport } from "../app/flights/page";

type FlightsFormProps = {
  airports: Airport[];
};

const AirportAutocomplete: React.FC<{
  label: string;
  selected: Airport | null;
  setSelected: (airport: Airport | null) => void;
  airports: Airport[];
}> = ({ label, selected, setSelected, airports }) => {
  const [query, setQuery] = useState("");
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>(airports);

  useEffect(() => {
    if (query === "") {
      setFilteredAirports(airports);
    } else {
      setFilteredAirports(
        airports.filter(
          (airport) =>
            airport.code.toLowerCase().includes(query.toLowerCase()) ||
            airport.city.toLowerCase().includes(query.toLowerCase()) ||
            airport.country.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  }, [query, airports]);

  return (
    <div className="mb-4 relative">
      <label className="block text-gray-700 mb-2">{label}</label>
      <Combobox value={selected} onChange={setSelected}>
        <Combobox.Input
          onChange={(e) => setQuery(e.target.value)}
          // Display only the airport code in the input when selected.
          displayValue={(airport: Airport | null) =>
            airport ? airport.code : ""
          }
          placeholder="Type airport code or city..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring focus:border-blue-300"
        />
        {filteredAirports.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
            {filteredAirports.map((airport) => (
              <Combobox.Option
                key={airport.id}
                value={airport}
                className="cursor-pointer px-3 py-2 hover:bg-blue-500 hover:text-white"
              >
                {/* Show full mapping in the dropdown */}
                {airport.code} - {airport.city}, {airport.country}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </Combobox>
    </div>
  );
};

type FormData = {
  origin: Airport | null;
  destination: Airport | null;
  departure: string;
  arrival: string;
  type: string;
};

const FlightsForm: React.FC<FlightsFormProps> = ({ airports }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    origin: null,
    destination: null,
    departure: "",
    arrival: "",
    type: "",
  });
  const [error, setError] = useState<string>("");

  const handleAirportChange = (
    field: "origin" | "destination",
    airport: Airport | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: airport }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "type" && value === "one-way") {
      // Clear arrival when one-way is selected.
      setFormData((prev) => ({ ...prev, type: value, arrival: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.origin || !formData.destination || !formData.departure) {
      setError("Please fill in all required fields (origin, destination, departure).");
      return;
    }
    setError("");
    console.log(formData.origin.code);
    console.log(formData.destination.code);
    console.log(formData.departure);
    console.log(formData.arrival);
    console.log(formData.type);
    console.log("is formdata.arrival empty?", formData.arrival === "");

    const queryString = `?origin=${formData.origin.code}&destination=${formData.destination.code}&departure=${formData.departure}&arrival=${formData.arrival}&type=${formData.type}`;
    // const url = "/api/flights/search" + queryString;
    // const response = await fetch(url, {
    //   method: "GET",
    //   headers: { "Content-Type": "application/json" },
    // });

    // if (!response.ok) {
    //   const errData = await response.json();
    //   setError(errData.error || "An error occurred during the search.");
    //   return;
    // }

    // // Optionally, get search results from the response.
    // const result = await response.json();
    // console.log("Search results:", result);

    // Redirect to the results page.
    router.push("/flights/results" + queryString);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow rounded-lg p-6 w-full max-w-lg relative"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Search Flights
      </h2>

      {error && (
        <p className="mb-4 text-red-500 text-center">
          {error}
        </p>
      )}

      {/* Origin Autocomplete */}
      <AirportAutocomplete
        label="Origin"
        selected={formData.origin}
        setSelected={(airport) => handleAirportChange("origin", airport)}
        airports={airports}
      />

      {/* Destination Autocomplete */}
      <AirportAutocomplete
        label="Destination"
        selected={formData.destination}
        setSelected={(airport) => handleAirportChange("destination", airport)}
        airports={airports}
      />

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
            // Update the disabled condition to check for "one-way"
            disabled={formData.type === "one-way"}
            className={`w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring focus:border-blue-300 ${
              formData.type === "one-way" ? "opacity-50 cursor-not-allowed" : ""
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
          <option value="one-way">One-way</option>
          <option value="round-trip">Round-trip</option>
        </select>
      </div>
      <button type="submit" className="w-full btn btn-primary">
        Search
      </button>
      <style jsx>{`
        input[type="date"] {
          color-scheme: light;
        }
      `}</style>
    </form>
  );
};

export default FlightsForm;
