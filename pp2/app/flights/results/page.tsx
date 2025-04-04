"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import { useRouter, useSearchParams } from "next/navigation";

// --------------------
// Types
// --------------------
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
  returnTrip?: {
    results: FlightResult[];
  };
};

type Room = {
  id: string;
  type: string;
  price: number;
  details: string;
};

type Hotel = {
  id: string;
  name: string;
  rating: number; // out of 5
  pricePerNight: number;
  imageUrl: string;
  rooms: Room[];
};

type SelectedHotelRoom = {
  hotel: Hotel;
  room: Room;
} | null;

// --------------------
// Helper: Render Star Rating
// --------------------
function renderStars(rating: number) {
  const fullStars = Math.round(rating);
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, idx) => (
        <span key={idx} className={idx < fullStars ? "text-yellow-500" : "text-gray-300"}>
          ★
        </span>
      ))}
      <span className="ml-2 text-sm text-gray-600">({rating.toFixed(1)}/5)</span>
    </div>
  );
}

// --------------------
// Main Component
// --------------------
export default function FlightResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract search criteria from URL query parameters.
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const departure = searchParams.get("departure") || "";
  const arrival = searchParams.get("arrival") || "";
  const type = searchParams.get("type") || "";

  // Flight results state
  const [firstTripResults, setFirstTripResults] = useState<FlightResult[]>([]);
  const [returnTripResults, setReturnTripResults] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Selected itineraries for outbound and return
  const [selectedOutbound, setSelectedOutbound] = useState<FlightResult | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<FlightResult | null>(null);

  // Dummy hotel suggestions state
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelRoom, setSelectedHotelRoom] = useState<SelectedHotelRoom>(null);

  // Fetch flight results once on mount
  useEffect(() => {
    async function fetchResults() {
      try {
        const queryString = `?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departure=${encodeURIComponent(departure)}&arrival=${encodeURIComponent(arrival)}&type=${encodeURIComponent(type)}`;
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
        setFirstTripResults(data.firstTrip.results);
        if (type === "round-trip" && data.returnTrip) {
          setReturnTripResults(data.returnTrip.results);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Error fetching flight results.");
        setLoading(false);
      }
    }
    fetchResults();
  }, [origin, destination, departure, arrival, type]);

  // Fetch dummy hotel suggestions for the destination
  useEffect(() => {
    const dummyHotels: Hotel[] = [
      {
        id: "h1",
        name: "Grand Hotel " + destination,
        rating: 4.8,
        pricePerNight: 250,
        imageUrl: "https://via.placeholder.com/300x150",
        rooms: [
          { id: "r1", type: "Standard", price: 250, details: "1 queen bed, free wifi" },
          { id: "r2", type: "Deluxe", price: 300, details: "1 king bed, breakfast included" },
        ],
      },
      {
        id: "h2",
        name: "Luxury Suites " + destination,
        rating: 4.7,
        pricePerNight: 300,
        imageUrl: "https://via.placeholder.com/300x150",
        rooms: [
          { id: "r3", type: "Suite", price: 350, details: "1 king bed, city view" },
          { id: "r4", type: "Executive", price: 400, details: "2 queen beds, free parking" },
        ],
      },
      {
        id: "h3",
        name: "Comfort Inn " + destination,
        rating: 4.5,
        pricePerNight: 180,
        imageUrl: "https://via.placeholder.com/300x150",
        rooms: [
          { id: "r5", type: "Standard", price: 180, details: "1 double bed, free wifi" },
          { id: "r6", type: "Family", price: 220, details: "2 queen beds, complimentary breakfast" },
        ],
      },
    ];
    setHotels(dummyHotels);
  }, [destination]);

  // Toggle selection for outbound flight using the first flight's id
  const handleSelectOutbound = (result: FlightResult) => {
    if (selectedOutbound && selectedOutbound.flights[0].id === result.flights[0].id) {
      setSelectedOutbound(null);
    } else {
      setSelectedOutbound(result);
    }
  };

  // Toggle selection for return flight
  const handleSelectReturn = (result: FlightResult) => {
    if (selectedReturn && selectedReturn.flights[0].id === result.flights[0].id) {
      setSelectedReturn(null);
    } else {
      setSelectedReturn(result);
    }
  };

  // Render flight itinerary card with improved vertical layout and a clear button
  const renderFlightCard = (
    result: FlightResult,
    isSelected: boolean,
    onSelect: () => void
  ) => {
    const totalPrice = result.flights.reduce((sum, flight) => sum + flight.price, 0);
    return (
      <div
        className={`card bg-white shadow-md p-4 cursor-pointer transition-all duration-200 ${
          isSelected ? "border-2 border-blue-500 bg-blue-50 shadow-lg" : "border border-gray-200 hover:shadow-xl"
        }`}
        onClick={onSelect}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">
            {result.legs === 1 ? "Direct Flight" : "Connecting Flight"}
          </h3>
          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(); // toggle off
              }}
              className="btn btn-sm btn-ghost btn-square text-blue-500"
              title="Clear selection"
            >
              ×
            </button>
          )}
        </div>
        <div className="space-y-2">
  {result.flights.map((flight) => (
    <div key={flight.id} className="border rounded-md p-2 bg-gray-50">
      {/* Flight header: flight number on left, airline on right */}
      <div className="flex items-center">
        <span className="font-medium text-left w-1/2">{flight.flightNumber}</span>
        <span className="text-sm text-gray-600 text-right w-1/2">{flight.airline.name}</span>
      </div>
      {/* Origin / Destination row */}
      <div className="flex mt-1">
        <div className="w-1/2 text-left">
          <strong>From:</strong> {flight.origin.code} <br />
          <small className="text-gray-500">{flight.origin.name}</small>
        </div>
        <div className="w-1/2 text-right">
          <strong>To:</strong> {flight.destination.code} <br />
          <small className="text-gray-500">{flight.destination.name}</small>
        </div>
      </div>
      {/* Departure / Arrival row */}
      <div className="flex mt-1 text-xs">
        <div className="w-1/2 text-left">
          <strong>Dep:</strong> {new Date(flight.departureTime).toLocaleString()}
        </div>
        <div className="w-1/2 text-right">
          <strong>Arr:</strong> {new Date(flight.arrivalTime).toLocaleString()}
        </div>
      </div>
      {/* Price, Status, and Seats row */}
      <div className="flex mt-1 text-sm">
        <div className="w-1/3 text-left">
          <span className="font-semibold">
            {flight.currency} {flight.price}
          </span>
        </div>
        <div className="w-1/3 text-center">
          {flight.status}
        </div>
        <div className="w-1/3 text-right">
          {flight.availableSeats} seats
        </div>
      </div>
    </div>
  ))}
</div>

        <p className="text-right mt-2 text-sm font-medium">
          Total Price: {result.flights[0].currency} {totalPrice}
        </p>
      </div>
    );
  };

  // Render summary card on the side (or below on mobile)
  const renderSummaryCard = () => {
    const computeTotal = (result: FlightResult | null) =>
      result ? result.flights.reduce((sum, f) => sum + f.price, 0) : 0;
    const outboundPrice = computeTotal(selectedOutbound);
    const returnPrice = computeTotal(selectedReturn);
    const flightsTotal =
      type === "round-trip" ? outboundPrice + returnPrice : outboundPrice;
    const hotelPrice = selectedHotelRoom ? selectedHotelRoom.room.price : 0;
    const grandTotal = flightsTotal + hotelPrice;
    return (
      <div className="card bg-white shadow-xl p-4">
        <div className="card-body space-y-2">
          <h2 className="card-title">Your Selections</h2>
          {/* Flight Itinerary */}
          <div>
            <h3 className="font-semibold">Flight Itinerary</h3>
            {selectedOutbound ? (
              <div>
                <p>
                  Outbound: {selectedOutbound.flights[0].flightNumber} from{" "}
                  {selectedOutbound.flights[0].origin.code} to{" "}
                  {selectedOutbound.flights[0].destination.code}
                </p>
                <p className="text-sm text-gray-500">
                  Total: {selectedOutbound.flights[0].currency} {outboundPrice}
                </p>
                <button
                  className="btn btn-error btn-xs my-1"
                  onClick={() => setSelectedOutbound(null)}
                >
                  Clear Outbound
                </button>
              </div>
            ) : (
              <p>No outbound flight selected.</p>
            )}
            {type === "round-trip" && (
              <>
                {selectedReturn ? (
                  <div>
                    <p>
                      Return: {selectedReturn.flights[0].flightNumber} from{" "}
                      {selectedReturn.flights[0].origin.code} to{" "}
                      {selectedReturn.flights[0].destination.code}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total: {selectedReturn.flights[0].currency} {returnPrice}
                    </p>
                    <button
                      className="btn btn-error btn-xs mt-1"
                      onClick={() => setSelectedReturn(null)}
                    >
                      Clear Return
                    </button>
                  </div>
                ) : (
                  <p>No return flight selected.</p>
                )}
              </>
            )}
          </div>
          {/* Hotel Room */}
          <div>
            <h3 className="font-semibold">Hotel Room</h3>
            {selectedHotelRoom ? (
              <div>
                <p>
                  {selectedHotelRoom.hotel.name} - {selectedHotelRoom.room.type}
                </p>
                <p className="text-sm text-gray-500">
                  Price/Night: ${selectedHotelRoom.room.price}
                </p>
                <button
                  className="btn btn-error btn-xs mt-1"
                  onClick={() => setSelectedHotelRoom(null)}
                >
                  Unselect Room
                </button>
              </div>
            ) : (
              <p>No hotel room selected.</p>
            )}
          </div>
          {/* Grand Total */}
          <div>
            <p className="font-bold">
              Grand Total: {selectedOutbound?.flights[0].currency || "$"} {grandTotal}
            </p>
          </div>
          {/* Book Button */}
          <div className="card-actions justify-end mt-2">
            <button className="btn btn-primary btn-lg" onClick={handleBookItinerary}>
              {type === "round-trip"
                ? "Book Selected Flights"
                : "Book Selected Flight"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Booking handler
  const handleBookItinerary = () => {
    if (type === "one-way") {
      if (!selectedOutbound) {
        alert("Please select an outbound flight.");
        return;
      }
      if (!selectedHotelRoom) {
        alert("Please select a hotel room.");
        return;
      }
      router.push(
        `/book/${selectedOutbound.flights[0].id}?hotel=${selectedHotelRoom.hotel.id}&room=${selectedHotelRoom.room.id}`
      );
    } else {
      if (!selectedOutbound || !selectedReturn) {
        alert("Please select both an outbound and a return flight.");
        return;
      }
      if (!selectedHotelRoom) {
        alert("Please select a hotel room.");
        return;
      }
      router.push(
        `/book?outbound=${selectedOutbound.flights[0].id}&return=${selectedReturn.flights[0].id}&hotel=${selectedHotelRoom.hotel.id}&room=${selectedHotelRoom.room.id}`
      );
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto p-4 space-y-8">
        {/* Hotel Suggestions Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Hotel Suggestions for {destination}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="card bg-white shadow-md">
                  <figure>
                    <img
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      className="w-full h-32 object-cover"
                    />
                  </figure>
                  <div className="card-body p-2">
                    <h3 className="font-semibold text-lg">{hotel.name}</h3>
                    {renderStars(hotel.rating)}
                    <p className="text-sm">From ${hotel.pricePerNight}/night</p>
                    <label className="label">
                      <span className="label-text text-sm">Choose Room</span>
                    </label>
                    <select
                      className="select select-bordered select-sm w-full"
                      value={
                        selectedHotelRoom && selectedHotelRoom.hotel.id === hotel.id
                          ? selectedHotelRoom.room.id
                          : ""
                      }
                      onChange={(e) => {
                        const roomId = e.target.value;
                        const room = hotel.rooms.find((r) => r.id === roomId);
                        if (room) {
                          setSelectedHotelRoom({ hotel, room });
                        }
                      }}
                    >
                      <option value="" disabled>
                        Select a room
                      </option>
                      {hotel.rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.type} - ${room.price} ({room.details})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search Criteria Card */}
        <div className="card bg-base-100 shadow-xl">
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
              {type === "round-trip" && (
                <p className="text-center">
                  <strong>Return:</strong> {arrival}
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

        {/* Main Content: Flight Selection & Summary */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Flight Selection Area */}
          <div className="flex-1 space-y-8">
            {loading ? (
              <div className="flex flex-col items-center py-4">
                <span className="loading loading-spinner loading-lg"></span>
                <p>Loading flight results...</p>
              </div>
            ) : error ? (
              <p className="text-red-500 text-center">{error}</p>
            ) : (
              <>
                {type === "one-way" && (
                  <div className="bg-blue-50 p-4 rounded-md space-y-4">
                    <h2 className="text-2xl font-semibold text-center mb-4">Outbound Flights</h2>
                    {firstTripResults.map((result, idx) => (
                      <div key={idx} className="block w-full" onClick={() => handleSelectOutbound(result)}>
                        {renderFlightCard(
                          result,
                          selectedOutbound
                            ? selectedOutbound.flights[0].id === result.flights[0].id
                            : false,
                          () => handleSelectOutbound(result)
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {type === "round-trip" && (
                  <>
                    <div className="bg-blue-50 p-4 rounded-md space-y-4">
                      <h2 className="text-2xl font-semibold text-center mb-4">Outbound Flights</h2>
                      {firstTripResults.map((result, idx) => (
                        <div key={idx} className="block w-full" onClick={() => handleSelectOutbound(result)}>
                          {renderFlightCard(
                            result,
                            selectedOutbound
                              ? selectedOutbound.flights[0].id === result.flights[0].id
                              : false,
                            () => handleSelectOutbound(result)
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="bg-green-50 p-4 rounded-md space-y-4">
                      <h2 className="text-2xl font-semibold text-center mb-4">Return Flights</h2>
                      {returnTripResults.map((result, idx) => (
                        <div key={idx} className="block w-full" onClick={() => handleSelectReturn(result)}>
                          {renderFlightCard(
                            result,
                            selectedReturn
                              ? selectedReturn.flights[0].id === result.flights[0].id
                              : false,
                            () => handleSelectReturn(result)
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          {/* Summary Card */}
          <div className="w-full lg:w-1/3">{renderSummaryCard()}</div>
        </div>
      </div>
    </main>
  );
}
