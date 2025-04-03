// components/AirportAutocomplete.jsx
'use client';
import { useState, useEffect } from "react";
import { Combobox } from "@headlessui/react";

const AirportAutocomplete = ({ label, selected, setSelected }) => {
  const [query, setQuery] = useState("");
  const [allAirports, setAllAirports] = useState([]);
  const [filteredAirports, setFilteredAirports] = useState([]);

  // Load all airports on mount
  useEffect(() => {
    fetch("/api/autocomplete")
      .then((res) => res.json())
      .then((data) => {
        setAllAirports(data);
        setFilteredAirports(data);
      })
      .catch((err) => console.error("Error fetching airports", err));
  }, []);

  // Filter the list client-side based on the query
  useEffect(() => {
    if (query === "") {
      setFilteredAirports(allAirports);
    } else {
      setFilteredAirports(
        allAirports.filter(
          (airport) =>
            airport.code.toLowerCase().includes(query.toLowerCase()) ||
            airport.city.toLowerCase().includes(query.toLowerCase()) ||
            airport.country.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  }, [query, allAirports]);

  return (
    <div className="mb-4 relative">
      <label className="block text-gray-700 mb-2">{label}</label>
      <Combobox value={selected} onChange={setSelected}>
        <Combobox.Input
          onChange={(e) => setQuery(e.target.value)}
          displayValue={(airport) =>
            airport ? `${airport.code} - ${airport.city}, ${airport.country}` : ""
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
                {airport.code} - {airport.city}, {airport.country}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </Combobox>
    </div>
  );
};

export default AirportAutocomplete;
