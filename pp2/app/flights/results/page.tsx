"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import { useRouter, useSearchParams } from "next/navigation";

type Flight = {
  id: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  currency: string;
  status: string;
  availableSeats: number;
  airline: {
    code: string;
    name: string;
  };
  origin: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  destination: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
};

type FlightResult = {
  legs: number;
  flights: Flight[];
};

type SearchResults = {
  firstTrip: {
    results: FlightResult[];
  };
};

export default function FlightResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract search criteria from the URL query parameters.
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const departure = searchParams.get("departure") || "";
  const arrival = searchParams.get("arrival") || "";
  const type = searchParams.get("type") || "";

  const [results, setResults] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchResults() {
      try {
        const queryString = `?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departure=${encodeURIComponent(departure)}&arrival=${encodeURIComponent(arrival)}&type=${encodeURIComponent(type)}`;
        console.log("Fetching results with query string:", queryString);
        const response = await fetch("/api/flights/search" + queryString, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const errData = await response.json();
          setError(errData.error || "Error fetching flight results.");
          setLoading(false);
          return;
        }
        const data: SearchResults = await response.json();
        setResults(data.firstTrip.results);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Error fetching flight results.");
        setLoading(false);
      }
    }
    fetchResults();
    // Run once on mount.
  }, []);

  const handleBookItinerary = (result: FlightResult) => {
    // For now, just log the itinerary details. In a real app, navigate to a booking page.
    console.log("Booking itinerary with flights:", result.flights);
    router.push(`/book/${result.flights[0].id}`); // Example: navigate to booking page using first flight id.
  };

  return (
    <main className="flex flex-col min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold text-center mb-8">Flight Search Results</h1>

        {/* Search Criteria Card */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title">Your Search Criteria</h2>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-center">
                <strong>Origin:</strong> {origin}
              </p>
              <p className="text-center">
                <strong>Destination:</strong> {destination}
              </p>
              <p className="text-center">
                <strong>Departure:</strong> {departure}
              </p>
              {type !== "one-way" && (
                <p className="text-center">
                  <strong>Arrival:</strong> {arrival}
                </p>
              )}
              <p className="text-center">
                <strong>Type:</strong> {type}
              </p>
            </div>
            <div className="card-actions justify-end">
              <button className="btn btn-secondary" onClick={() => router.back()}>
                Edit Search
              </button>
            </div>
          </div>
        </div>

        {/* Flight Results Cards */}
        {loading ? (
          <div className="flex flex-col items-center py-4">
            <span className="loading loading-spinner loading-lg"></span>
            <p>Loading results...</p>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : results.length === 0 ? (
          <p className="text-center">No flights found.</p>
        ) : (
          results.map((result, idx) => (
            <div key={idx} className="card bg-base-100 shadow-xl mb-6">
              <div className="card-body">
                <h3 className="card-title text-center">
                  {result.legs === 1 ? "Direct Flight" : "Connecting Flight"} (Legs: {result.legs})
                </h3>
                <div className="overflow-x-auto">
                  <table className="table table-fixed w-full">
                    <thead>
                      <tr className="text-center">
                        <th style={{ width: "10%" }}>Flight #</th>
                        <th style={{ width: "10%" }}>Airline</th>
                        <th style={{ width: "15%" }}>Origin</th>
                        <th style={{ width: "15%" }}>Destination</th>
                        <th style={{ width: "15%" }}>Departure</th>
                        <th style={{ width: "15%" }}>Arrival</th>
                        <th style={{ width: "10%" }}>Duration</th>
                        <th style={{ width: "10%" }}>Price</th>
                        <th style={{ width: "10%" }}>Status</th>
                        <th style={{ width: "5%" }}>Seats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.flights.map((flight) => (
                        <tr key={flight.id} className="text-center">
                          <td>{flight.flightNumber}</td>
                          <td>{flight.airline.name}</td>
                          <td>
                            {flight.origin.code} <br />
                            <small className="text-xs text-gray-500">{flight.origin.name}</small>
                          </td>
                          <td>
                            {flight.destination.code} <br />
                            <small className="text-xs text-gray-500">{flight.destination.name}</small>
                          </td>
                          <td>{new Date(flight.departureTime).toLocaleString()}</td>
                          <td>{new Date(flight.arrivalTime).toLocaleString()}</td>
                          <td>{flight.duration} min</td>
                          <td>
                            {flight.currency} {flight.price}
                          </td>
                          <td>{flight.status}</td>
                          <td>{flight.availableSeats}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* One Book button per itinerary card */}
                <div className="card-actions justify-center mt-4">
                  <button className="btn btn-primary" onClick={() => handleBookItinerary(result)}>
                    Book This Trip 
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
