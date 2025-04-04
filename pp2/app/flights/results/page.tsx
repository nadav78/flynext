"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/navbar";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../contexts/auth-context";

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

type Hotel = {
  id: number;
  name: string;
  address: string;
  Location: {
    city: string;
    country: string;
  };
  star_rating: number;
  HotelRoomType: {
    id: number;
    name: string;
    price_per_night: string;
    room_count: number;
  }[];
};

type SelectedHotelRoom = {
  hotel: Hotel;
  room: {
    id: number;
    name: string;
    price_per_night: string;
    room_count: number;
  };
} | null;

// --------------------
// Helper: Render Star Rating
// --------------------
function renderStars(rating: number) {
  const fullStars = Math.round(rating);
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, idx) => (
        <span key={idx} className={idx < fullStars ? "text-yellow-500" : "text-base-content"}>
          ★
        </span>
      ))}
      <span className="ml-2 text-sm text-base-content">
        ({rating.toFixed(1)}/5)
      </span>
    </div>
  );
}

// --------------------
// Flight Card Component
// --------------------
const FlightCard: React.FC<{
  result: FlightResult;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ result, isSelected, onSelect }) => {
  const totalPrice = result.flights.reduce((sum, f) => sum + f.price, 0);
  return (
    <div
      onClick={onSelect}
      className={`card p-4 transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-2 border-primary bg-base-100 shadow-lg"
          : "border border-base-300 hover:shadow-xl bg-base-100"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-base-content">
          {result.legs === 1 ? "Direct Flight" : "Connecting Flight"}
        </h3>
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="btn btn-sm btn-ghost btn-square text-primary"
            title="Clear Selection"
          >
            ×
          </button>
        )}
      </div>
      <div className="space-y-2">
        {result.flights.map((flight) => (
          <div key={flight.id} className="border rounded-md p-2 bg-base-100">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-left">
                <span className="font-medium text-base-content">
                  {flight.flightNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm text-base-content">
                  {flight.airline.name}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="text-left">
                <strong>From:</strong> {flight.origin.code} <br />
                <small className="text-xs text-base-content">
                  {flight.origin.name}
                </small>
              </div>
              <div className="text-right">
                <strong>To:</strong> {flight.destination.code} <br />
                <small className="text-xs text-base-content">
                  {flight.destination.name}
                </small>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
              <div className="text-left text-base-content">
                <strong>Dep:</strong> {new Date(flight.departureTime).toLocaleString()}
              </div>
              <div className="text-right text-base-content">
                <strong>Arr:</strong> {new Date(flight.arrivalTime).toLocaleString()}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1 text-sm">
              <div className="text-left text-base-content">
                <span className="font-semibold">
                  {flight.currency} {flight.price}
                </span>
              </div>
              <div className="text-center text-base-content">
                {flight.status}
              </div>
              <div className="text-right text-base-content">
                {flight.availableSeats} seats
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-right mt-2">
        <p className="text-sm font-medium text-base-content">
          Itinerary Total: {result.flights[0].currency} {totalPrice}
        </p>
      </div>
    </div>
  );
};

// --------------------
// Main Component: FlightResultsPage
// --------------------
export default function FlightResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract flight search criteria
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

  // Hotel suggestions state
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelRoom, setSelectedHotelRoom] = useState<SelectedHotelRoom>(null);

  // Selected flight itineraries
  const [selectedOutbound, setSelectedOutbound] = useState<FlightResult | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<FlightResult | null>(null);

  // Fetch flight results on mount
  useEffect(() => {
    async function fetchResults() {
      try {
        const queryString = `?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departure=${encodeURIComponent(departure)}&arrival=${encodeURIComponent(arrival)}&type=${encodeURIComponent(type)}`;
        const response = await fetch("/api/flights/search" + queryString, {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
          }
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

  // Fetch hotel suggestions using the provided API endpoint
  useEffect(() => {
    async function fetchHotels() {
      console.log(user);
      if (!user) return;
      // Use the last leg of the first flight result for the full city name
      let cityForHotels = destination;
      if (firstTripResults.length > 0 && firstTripResults[0].flights.length > 0) {
        const lastLegIndex = firstTripResults[0].flights.length - 1;
        cityForHotels = firstTripResults[0].flights[lastLegIndex].destination.city;
      }
      try {
        const params = new URLSearchParams();
        params.append("city", cityForHotels);
        params.append("checkin", departure);
        if (arrival.trim() !== "") {
          params.append("checkout", arrival);
        }
        const queryString = `?${params.toString()}`;
        console.log("Fetching hotels with query:", queryString);
        const response = await fetch("/api/public/hotels" + queryString, {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}` // ??
          },
        });
        if (!response.ok) {
          console.error("Failed to fetch hotels");
          return;
        }
        const data = await response.json();
        console.log("Fetched hotels:", data);
        setHotels(data.hotels.slice(0, 3));
      } catch (err) {
        console.error("Error fetching hotels:", err);
      }
    }
    fetchHotels();
  }, [user, destination, departure, arrival, firstTripResults]);

  // Toggle selection for outbound flight
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

  // Render summary card
  const renderSummaryCard = () => {
    const computeTotal = (result: FlightResult | null) =>
      result ? result.flights.reduce((sum, f) => sum + f.price, 0) : 0;
    const outboundPrice = computeTotal(selectedOutbound);
    const returnPrice = computeTotal(selectedReturn);
    const flightsTotal = type === "round-trip" ? outboundPrice + returnPrice : outboundPrice;
    const hotelPrice = selectedHotelRoom ? Number(selectedHotelRoom.room.price_per_night) : 0;
    const grandTotal = flightsTotal + hotelPrice;
    return (
      <div className="card shadow-xl p-4 bg-base-100">
        <div className="card-body space-y-2">
          <h2 className="card-title text-base-content">Your Selections</h2>
          <div>
            <h3 className="font-semibold text-base-content">Flight Itinerary</h3>
            {selectedOutbound ? (
              <div>
                <p className="text-sm text-base-content">
                  Outbound: {selectedOutbound.flights[0].flightNumber} from {selectedOutbound.flights[0].origin.code} to {selectedOutbound.flights[0].destination.code}
                </p>
                <p className="text-sm text-base-content">
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
              <p className="text-sm text-base-content">No outbound flight selected.</p>
            )}
            {type === "round-trip" && (
              <>
                {selectedReturn ? (
                  <div>
                    <p className="text-sm text-base-content">
                      Return: {selectedReturn.flights[0].flightNumber} from {selectedReturn.flights[0].origin.code} to {selectedReturn.flights[0].destination.code}
                    </p>
                    <p className="text-sm text-base-content">
                      Total: {selectedReturn.flights[0].currency} {returnPrice}
                    </p>
                    <button
                      className="btn btn-error btn-xs my-1"
                      onClick={() => setSelectedReturn(null)}
                    >
                      Clear Return
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-base-content">No return flight selected.</p>
                )}
              </>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-base-content">Hotel Room</h3>
            {selectedHotelRoom ? (
              <div>
                <p className="text-sm text-base-content">
                  {selectedHotelRoom.hotel.name} - {selectedHotelRoom.room.name}
                </p>
                <p className="text-sm text-base-content">
                  Price/Night: ${selectedHotelRoom.room.price_per_night}
                </p>
                <button
                  className="btn btn-error btn-xs mt-1"
                  onClick={() => setSelectedHotelRoom(null)}
                >
                  Unselect Room
                </button>
              </div>
            ) : (
              <p className="text-sm text-base-content">No hotel room selected.</p>
            )}
          </div>
          <div>
            <p className="font-bold text-base-content">
              Grand Total: {selectedOutbound?.flights[0].currency || "$"} {grandTotal}
            </p>
          </div>
          <div className="card-actions justify-end mt-2">
            <button className="btn btn-primary btn-lg" onClick={handleBookItinerary}>
              {type === "round-trip" ? "Book Selected Flights" : "Book Selected Flight"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Booking handler
  const handleBookItinerary = () => {
    if (!user) {
      sessionStorage.setItem("intendedPath", router.asPath);
      router.push("/login");
      return;
    }
  
    // Set hotel and room query parameters (blank if not selected)
    const hotelParam = selectedHotelRoom ? selectedHotelRoom.hotel.id : "";
    const roomParam = selectedHotelRoom ? selectedHotelRoom.room.id : "";
  
    if (type === "one-way") {
      if (!selectedOutbound) {
        alert("Please select an outbound flight.");
        return;
      }
      router.push(
        `/bookings?outbound=${selectedOutbound.flights[0].id}?hotel=${hotelParam}&room=${roomParam}&checkin=${departure}`
      );
    } else {
      if (!selectedOutbound || !selectedReturn) {
        alert("Please select both an outbound and a return flight.");
        return;
      }
      router.push(
        `/bookings?outbound=${selectedOutbound.flights[0].id}&return=${selectedReturn.flights[0].id}&hotel=${hotelParam}&room=${roomParam}&checkin=${departure}`
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
            <h2 className="card-title text-base-content">
              Hotel Suggestions for {destination}
            </h2>
            {!user ? (
              <div role="alert" className="alert alert-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="h-6 w-6 shrink-0 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>You must be logged in to view hotel suggestions.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {hotels.map((hotel) => (
                  <div key={hotel.id} className="card bg-base-100 shadow-md">
                    <figure>
                      {/* If no imageUrl is provided, a placeholder image is used */}
                      <img
                        src={hotel.imageUrl || "https://via.placeholder.com/150"}
                        alt={hotel.name}
                        className="w-full h-32 object-cover"
                      />
                    </figure>
                    <div className="card-body p-2">
                      <h3 className="font-semibold text-lg text-base-content">
                        {hotel.name}
                      </h3>
                      <p className="text-sm text-base-content">
                        {hotel.address}
                      </p>
                      {renderStars(hotel.star_rating)}
                      <p className="text-sm text-base-content">
                        From ${hotel.HotelRoomType[0].price_per_night}/night
                      </p>
                      <label className="label">
                        <span className="label-text text-sm text-base-content">
                          Choose Room
                        </span>
                      </label>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={
                          selectedHotelRoom && selectedHotelRoom.hotel.id === hotel.id
                            ? selectedHotelRoom.room.id.toString()
                            : ""
                        }
                        onChange={(e) => {
                          const roomId = e.target.value;
                          const room = hotel.HotelRoomType.find(
                            (r) => r.id.toString() === roomId
                          );
                          if (room) {
                            setSelectedHotelRoom({ hotel, room });
                          }
                        }}
                      >
                        <option value="" disabled>
                          Select a room
                        </option>
                        {hotel.HotelRoomType.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name} - ${room.price_per_night} ({room.room_count} available)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Criteria Card */}
        <div className="card shadow-xl">
          <div className="card-body bg-base-100">
            <h2 className="card-title text-base-content">Your Search Criteria</h2>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-center text-base-content">
                <strong>Origin:</strong> {origin}
              </p>
              <p className="text-center text-base-content">
                <strong>Destination:</strong> {destination}
              </p>
              <p className="text-center text-base-content">
                <strong>Departure:</strong> {departure}
              </p>
              {type === "round-trip" && (
                <p className="text-center text-base-content">
                  <strong>Return:</strong> {arrival}
                </p>
              )}
              <p className="text-center text-base-content">
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
                <p className="text-base-content">Loading flight results...</p>
              </div>
            ) : error ? (
              <p className="text-red-500 text-center">{error}</p>
            ) : (
              <>
                {type === "one-way" && (
                  <div className="p-4 rounded-md space-y-4 bg-base-100">
                    <h2 className="text-2xl font-semibold text-center text-base-content">
                      Outbound Flights
                    </h2>
                    {firstTripResults.map((result, idx) => (
                      <div key={idx} className="block w-full" onClick={() => handleSelectOutbound(result)}>
                        <FlightCard
                          result={result}
                          isSelected={selectedOutbound ? selectedOutbound.flights[0].id === result.flights[0].id : false}
                          onSelect={() => handleSelectOutbound(result)}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {type === "round-trip" && (
                  <>
                    <div className="p-4 rounded-md space-y-4 bg-base-100">
                      <h2 className="text-2xl font-semibold text-center text-base-content">
                        Outbound Flights
                      </h2>
                      {firstTripResults.map((result, idx) => (
                        <div key={idx} className="block w-full" onClick={() => handleSelectOutbound(result)}>
                          <FlightCard
                            result={result}
                            isSelected={selectedOutbound ? selectedOutbound.flights[0].id === result.flights[0].id : false}
                            onSelect={() => handleSelectOutbound(result)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="p-4 rounded-md space-y-4 bg-base-100">
                      <h2 className="text-2xl font-semibold text-center text-base-content">
                        Return Flights
                      </h2>
                      {returnTripResults.map((result, idx) => (
                        <div key={idx} className="block w-full" onClick={() => handleSelectReturn(result)}>
                          <FlightCard
                            result={result}
                            isSelected={selectedReturn ? selectedReturn.flights[0].id === result.flights[0].id : false}
                            onSelect={() => handleSelectReturn(result)}
                          />
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
