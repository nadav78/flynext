"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../components/navbar";

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Retrieve query parameters
  const outboundId = searchParams.get("outbound") || "";
  const returnId = searchParams.get("return") || "";
  const hotelId = searchParams.get("hotel") || "";
  const roomId = searchParams.get("room") || "";
  const checkin = searchParams.get("checkin") || "";

  // State to hold fetched flight details
  const [outboundFlight, setOutboundFlight] = useState<any>(null);
  const [returnFlight, setReturnFlight] = useState<any>(null);
  const [loadingFlights, setLoadingFlights] = useState<boolean>(true);

  // Fetch outbound flight details from the new API endpoint
  useEffect(() => {
    async function fetchFlight(flightId: string, setter: (data: any) => void) {
      try {
        const res = await fetch(`/api/flights/${flightId}`);
        if (!res.ok) {
          console.error(`Error fetching flight ${flightId}`);
          return;
        }
        const data = await res.json();
        setter(data);
      } catch (error) {
        console.error("Error fetching flight:", error);
      }
    }

    async function fetchFlights() {
      if (outboundId) {
        await fetchFlight(outboundId, setOutboundFlight);
      }
      if (returnId) {
        await fetchFlight(returnId, setReturnFlight);
      }
      setLoadingFlights(false);
    }
    fetchFlights();
  }, [outboundId, returnId]);

  // Compute totals based on fetched flight details.
  const flightsTotal =
    (outboundFlight ? outboundFlight.price : 0) +
    (returnFlight ? returnFlight.price : 0);
  // Use a placeholder for hotel total if a hotel/room is selected.
  const hotelTotal = hotelId && roomId ? 350 : 0;
  const grandTotal = flightsTotal + hotelTotal;

  return (
    <main className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto p-6 space-y-10">
        {/* Flight Itinerary Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Flight Itinerary</h2>
            {loadingFlights ? (
              <p>Loading flight details...</p>
            ) : (
              <div className="divide-y divide-gray-300">
                {/* Outbound Flight */}
                {outboundFlight ? (
                  <div className="py-4 flex flex-col md:flex-row md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">Outbound Flight</h3>
                      <p>
                        <span className="font-medium">Flight:</span>{" "}
                        {outboundFlight.flightNumber} ({outboundFlight.airline.name})
                      </p>
                      <p>
                        <span className="font-medium">From:</span>{" "}
                        {outboundFlight.origin.name} ({outboundFlight.origin.code}),{" "}
                        {outboundFlight.origin.city}
                      </p>
                      <p>
                        <span className="font-medium">To:</span>{" "}
                        {outboundFlight.destination.name} ({outboundFlight.destination.code}),{" "}
                        {outboundFlight.destination.city}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <p>
                        <span className="font-medium">Departure:</span>{" "}
                        {new Date(outboundFlight.departureTime).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">Arrival:</span>{" "}
                        {new Date(outboundFlight.arrivalTime).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">Price:</span>{" "}
                        {outboundFlight.currency} {outboundFlight.price}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="py-4">No outbound flight details found.</p>
                )}
                {/* Return Flight */}
                {returnId && (
                  <>
                    {returnFlight ? (
                      <div className="py-4 flex flex-col md:flex-row md:justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">Return Flight</h3>
                          <p>
                            <span className="font-medium">Flight:</span>{" "}
                            {returnFlight.flightNumber} ({returnFlight.airline.name})
                          </p>
                          <p>
                            <span className="font-medium">From:</span>{" "}
                            {returnFlight.origin.name} ({returnFlight.origin.code}),{" "}
                            {returnFlight.origin.city}
                          </p>
                          <p>
                            <span className="font-medium">To:</span>{" "}
                            {returnFlight.destination.name} ({returnFlight.destination.code}),{" "}
                            {returnFlight.destination.city}
                          </p>
                        </div>
                        <div className="mt-4 md:mt-0 text-right">
                          <p>
                            <span className="font-medium">Departure:</span>{" "}
                            {new Date(returnFlight.departureTime).toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">Arrival:</span>{" "}
                            {new Date(returnFlight.arrivalTime).toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">Price:</span>{" "}
                            {returnFlight.currency} {returnFlight.price}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="py-4">No return flight details found.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hotel & Room Selection Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Hotel &amp; Room Selection</h2>
            {hotelId && roomId ? (
              <div className="space-y-3">
                <p>
                  <span className="font-medium">Hotel ID:</span> {hotelId}
                </p>
                <p>
                  <span className="font-medium">Room ID:</span> {roomId}
                </p>
                <p>
                  <span className="font-medium">Check-in Date:</span> {checkin}
                </p>
              </div>
            ) : (
              <p className="text-red-500">No hotel room selected.</p>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Total Summary</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Flights Total:</span> ${flightsTotal}
              </p>
              <p>
                <span className="font-medium">Hotel Total:</span> ${hotelTotal}
              </p>
              <p className="font-bold text-xl">
                <span className="font-medium">Grand Total:</span> ${grandTotal}
              </p>
            </div>
          </div>
        </div>

        {/* Checkout Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Checkout</h2>
            <p className="mb-4">
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
