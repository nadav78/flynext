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
      <label className="block mb-2 text-base-content">{label}</label>
      <Combobox value={selected} onChange={setSelected}>
        <Combobox.Input
          onChange={(e) => setQuery(e.target.value)}
          displayValue={(airport: Airport | null) =>
            airport ? airport.code : ""
          }
          placeholder="Type airport code or city..."
          className="w-full border border-base-300 bg-base-100 text-base-content rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
        />
        {filteredAirports.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 w-full max-h-60 bg-base-100 border border-base-300 rounded shadow-lg overflow-auto">
            {filteredAirports.map((airport) => (
              <Combobox.Option
                key={airport.id}
                value={airport}
                className="cursor-pointer px-3 py-2 hover:bg-primary hover:text-primary-content"
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

type FormData = {
  origin: Airport | null;
  destination: Airport | null;
  departure: string;
  return: string;
  type: "one-way" | "round-trip";
};

const FlightsForm: React.FC<FlightsFormProps> = ({ airports }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    origin: null,
    destination: null,
    departure: "",
    return: "",
    type: "one-way",
  });
  const [error, setError] = useState<string>("");

  const handleAirportChange = (
    field: "origin" | "destination",
    airport: Airport | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: airport }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setTripType = (type: "one-way" | "round-trip") => {
    setFormData((prev) => ({ ...prev, type, return: type === "one-way" ? "" : prev.return }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.origin || !formData.destination || !formData.departure) {
      setError("Please fill in all required fields (origin, destination, departure).");
      return;
    }
    setError("");
    const queryString = `?origin=${formData.origin.code}&destination=${formData.destination.code}&departure=${formData.departure}&arrival=${formData.return}&type=${formData.type}`;
    router.push("/flights/results" + queryString);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-base-100 text-base-content shadow rounded-lg p-6 w-full max-w-lg relative"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-base-content">
        Search Flights
      </h2>
      {error && (
        <p className="mb-4 text-red-500 text-center">{error}</p>
      )}

      {/* Trip type toggle */}
      <div className="mb-6 flex rounded-lg overflow-hidden border border-base-300">
        <button
          type="button"
          onClick={() => setTripType("one-way")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            formData.type === "one-way"
              ? "bg-primary text-primary-content"
              : "bg-base-100 text-base-content hover:bg-base-200"
          }`}
        >
          One-way
        </button>
        <button
          type="button"
          onClick={() => setTripType("round-trip")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            formData.type === "round-trip"
              ? "bg-primary text-primary-content"
              : "bg-base-100 text-base-content hover:bg-base-200"
          }`}
        >
          Round-trip
        </button>
      </div>

      <AirportAutocomplete
        label="Origin"
        selected={formData.origin}
        setSelected={(airport) => handleAirportChange("origin", airport)}
        airports={airports}
      />
      <AirportAutocomplete
        label="Destination"
        selected={formData.destination}
        setSelected={(airport) => handleAirportChange("destination", airport)}
        airports={airports}
      />

      <div className={`mb-4 grid gap-4 ${formData.type === "round-trip" ? "grid-cols-2" : "grid-cols-1"}`}>
        <div>
          <label className="block mb-2 text-base-content" htmlFor="departure">
            Departure
          </label>
          <input
            type="date"
            id="departure"
            name="departure"
            value={formData.departure}
            onChange={handleChange}
            className="w-full border border-base-300 bg-base-100 text-base-content rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        {formData.type === "round-trip" && (
          <div>
            <label className="block mb-2 text-base-content" htmlFor="return">
              Return
            </label>
            <input
              type="date"
              id="return"
              name="return"
              value={formData.return}
              onChange={handleChange}
              min={formData.departure}
              className="w-full border border-base-300 bg-base-100 text-base-content rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
        )}
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
