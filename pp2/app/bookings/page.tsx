"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

// Simulated fetch function. In your app, import this from your utility module.
async function getAFSFlightDetailsById(flightId: string) {
  // In production, this would call an API. Here we simulate with a hardcoded response.
  return {
    airline: {
      code: "SK",
      name: "Scandinavian Airlines",
    },
    arrivalTime: "2024-11-15T21:20:00.000Z",
    availableSeats: 0,
    currency: "CAD",
    departureTime: "2024-11-15T16:15:00.000Z",
    destination: {
      city: "Zurich",
      code: "ZRH",
      country: "Switzerland",
      name: "Zurich Airport",
    },
    destinationId: "2bcb7925-96aa-4de8-9ec1-3622e954c0b6",
    duration: 305,
    flightNumber: "SK952",
    id: flightId,
    origin: {
      city: "Stockholm",
      code: "ARN",
      country: "Sweden",
      name: "Stockholm Arlanda Airport",
    },
    originId: "7d3cd81e-5b33-4235-aa4a-8955237e729b",
    price: 301,
    status: "SCHEDULED",
  };
}

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Retrieve query parameters passed to the page
  const outboundId = searchParams.get("outbound") || "";
  const returnId = searchParams.get("return") || "";
  const hotelId = searchParams.get("hotel") || "";
  const roomId = searchParams.get("room") || "";
  const checkin = searchParams.get("checkin") || "";

  // State to hold flight details
  const [outboundFlight, setOutboundFlight] = useState<any>(null);
  const [returnFlight, setReturnFlight] = useState<any>(null);

  // Fetch flight details when the outbound or return IDs change
  useEffect(() => {
    if (outboundId) {
      getAFSFlightDetailsById(outboundId)
        .then((data) => setOutboundFlight(data))
        .catch((err) => console.error("Error fetching outbound flight:", err));
    }
    if (returnId) {
      getAFSFlightDetailsById(returnId)
        .then((data) => setReturnFlight(data))
        .catch((err) => console.error("Error fetching return flight:", err));
    }
  }, [outboundId, returnId]);

  // Compute totals. Here we simply sum the flight prices.
  const flightsTotal =
    (outboundFlight ? outboundFlight.price : 0) +
    (returnFlight ? returnFlight.price : 0);
  // For hotel total, we use a placeholder value if hotel/room data exists.
  const hotelTotal = hotelId && roomId ? 350 : 0;
  const grandTotal = flightsTotal + hotelTotal;

  return (
    <main className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto p-4 space-y-8">
        {/* Flight Itinerary Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Flight Itinerary</h2>
            <div className="space-y-4">
              {outboundFlight ? (
                <div>
                  <h3 className="text-lg font-semibold">Outbound Flight</h3>
                  <p>
                    <strong>Flight Number:</strong> {outboundFlight.flightNumber}
                  </p>
                  <p>
                    <strong>Airline:</strong> {outboundFlight.airline.name} (
                    {outboundFlight.airline.code})
                  </p>
                  <p>
                    <strong>From:</strong> {outboundFlight.origin.name} (
                    {outboundFlight.origin.code}), {outboundFlight.origin.city}
                  </p>
                  <p>
                    <strong>To:</strong> {outboundFlight.destination.name} (
                    {outboundFlight.destination.code}),{" "}
                    {outboundFlight.destination.city}
                  </p>
                  <p>
                    <strong>Departure:</strong>{" "}
                    {new Date(outboundFlight.departureTime).toLocaleString()}
                  </p>
                  <p>
                    <strong>Arrival:</strong>{" "}
                    {new Date(outboundFlight.arrivalTime).toLocaleString()}
                  </p>
                  <p>
                    <strong>Price:</strong> {outboundFlight.currency}{" "}
                    {outboundFlight.price}
                  </p>
                </div>
              ) : (
                <p>Loading outbound flight details...</p>
              )}
              {returnId && (
                <>
                  {returnFlight ? (
                    <div>
                      <h3 className="text-lg font-semibold">Return Flight</h3>
                      <p>
                        <strong>Flight Number:</strong> {returnFlight.flightNumber}
                      </p>
                      <p>
                        <strong>Airline:</strong> {returnFlight.airline.name} (
                        {returnFlight.airline.code})
                      </p>
                      <p>
                        <strong>From:</strong> {returnFlight.origin.name} (
                        {returnFlight.origin.code}), {returnFlight.origin.city}
                      </p>
                      <p>
                        <strong>To:</strong> {returnFlight.destination.name} (
                        {returnFlight.destination.code}),{" "}
                        {returnFlight.destination.city}
                      </p>
                      <p>
                        <strong>Departure:</strong>{" "}
                        {new Date(returnFlight.departureTime).toLocaleString()}
                      </p>
                      <p>
                        <strong>Arrival:</strong>{" "}
                        {new Date(returnFlight.arrivalTime).toLocaleString()}
                      </p>
                      <p>
                        <strong>Price:</strong> {returnFlight.currency}{" "}
                        {returnFlight.price}
                      </p>
                    </div>
                  ) : (
                    <p>Loading return flight details...</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hotel & Room Selection Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Hotel &amp; Room Selection</h2>
            {hotelId && roomId ? (
              <div className="space-y-2">
                <p>
                  <strong>Hotel ID:</strong> {hotelId}
                </p>
                <p>
                  <strong>Room ID:</strong> {roomId}
                </p>
                <p>
                  <strong>Check-in Date:</strong> {checkin}
                </p>
              </div>
            ) : (
              <p className="text-red-500">No hotel room selected.</p>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="card shadow-xl bg-base-100">
          <div className="card-body">
            <h2 className="card-title">Total Summary</h2>
            <p>
              <strong>Flights Total:</strong> ${flightsTotal}
            </p>
            <p>
              <strong>Hotel Total:</strong> ${hotelTotal}
            </p>
            <p className="font-bold text-xl">
              <strong>Grand Total:</strong> ${grandTotal}
            </p>
          </div>
        </div>

        {/* Checkout Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Checkout</h2>
            <p>
              Please review your booking details above. When you're ready, proceed
              to payment.
            </p>
            <div className="card-actions justify-end">
              <button
                className="btn btn-primary"
                onClick={() => router.push("/checkout")}
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
