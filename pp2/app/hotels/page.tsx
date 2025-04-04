'use client';
import React, { useState, useEffect } from "react"; 
import Navbar from "@/components/navbar";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

// Define types for our hotel data
type HotelRoomType = {
  id: number;
  name: string;
  price_per_night: number;
  room_count: number;
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
  HotelRoomType: HotelRoomType[];
};

export default function Hotels() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Initialize state from URL parameters if they exist
    const [city, setCity] = useState(searchParams.get("city") || "");
    const [checkin, setCheckin] = useState(searchParams.get("checkin") || "");
    const [checkout, setCheckout] = useState(searchParams.get("checkout") || "");
    const [nameFilter, setNameFilter] = useState(searchParams.get("name") || "");
    const [starRating, setStarRating] = useState<number | "">(
        searchParams.get("star_rating") ? parseInt(searchParams.get("star_rating") as string) : ""
    );
    const [priceMin, setPriceMin] = useState<number | "">(
        searchParams.get("price_min") ? Number(searchParams.get("price_min")) : ""
    );
    const [priceMax, setPriceMax] = useState<number | "">(
        searchParams.get("price_max") ? Number(searchParams.get("price_max")) : ""
    );
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);
    
    // State for handling reservations
    const [reservingHotelId, setReservingHotelId] = useState<number | null>(null);
    const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
    const [reservationLoading, setReservationLoading] = useState(false);
    const [reservationError, setReservationError] = useState<string | null>(null);
    const [reservationSuccess, setReservationSuccess] = useState(false);
    
    // Animation effect similar to home page
    useEffect(() => {
        setFadeIn(true);
        return () => setFadeIn(false);
    }, []);
    
    // Automatically search if URL parameters exist
    useEffect(() => {
        const hasSearchParams = searchParams.has("city") && 
                                searchParams.has("checkin") && 
                                searchParams.has("checkout");
        
        if (hasSearchParams) {
            searchHotelsFromParams();
        }
    }, [searchParams]);
    
    // Search function using current URL parameters
    const searchHotelsFromParams = async () => {
        setLoading(true);
        
        try {
            // Build query parameters from searchParams
            const params = new URLSearchParams();
            
            for (const [key, value] of Array.from(searchParams.entries())) {
                if (value) params.append(key, value);
            }
            
            // Since hotel search no longer needs authentication, we can simplify this
            const response = await fetch(`/api/public/hotels?${params.toString()}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch hotels');
            
            const data = await response.json();
            setHotels(data.hotels || []);
            setSearched(true);
        } catch (error) {
            console.error('Error searching hotels:', error);
        } finally {
            setLoading(false);
        }
    };

    // Search function to call the API and update URL
    const searchHotels = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Build query parameters for URL
        const params = new URLSearchParams();
        if (city) params.append('city', city);
        if (checkin) params.append('checkin', checkin);
        if (checkout) params.append('checkout', checkout);
        if (nameFilter) params.append('name', nameFilter);
        if (starRating !== "") params.append('star_rating', starRating.toString());
        if (priceMin !== "") params.append('price_min', priceMin.toString());
        if (priceMax !== "") params.append('price_max', priceMax.toString());
        
        // Update URL with search parameters
        const url = `/hotels?${params.toString()}`;
        router.push(url, { scroll: false });
        
        // The search will be triggered by the useEffect that watches searchParams
    };

    // Function to refresh the access token
    const refreshAccessToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) return false;
            
            const response = await fetch('/api/users/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.accessToken);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            return false;
        }
    };
    
    // Function to view hotel details with authentication
    const viewHotelDetails = (hotelId: number) => {
        const token = localStorage.getItem('accessToken');
        if (!token && user === null) {
            // If not logged in, redirect to login first
            alert('Please log in to view hotel details');
            router.push(`/login?redirect=/hotels/${hotelId}?checkin=${checkin}&checkout=${checkout}`);
            return;
        }
        
        // If logged in, proceed to hotel details page
        router.push(`/hotels/${hotelId}?checkin=${checkin}&checkout=${checkout}`);
    };

    // Calculate minimum price for a hotel
    const getMinPrice = (hotel: Hotel) => {
        if (!hotel.HotelRoomType || hotel.HotelRoomType.length === 0) return 'N/A';
        
        const prices = hotel.HotelRoomType.map(room => room.price_per_night);
        return `$${Math.min(...prices)}`;
    };

    // Function to reserve a hotel room
    const handleReserve = (hotel: Hotel) => {
        const token = localStorage.getItem('accessToken');
        if (!token && user === null) {
            // If not logged in, redirect to login first
            alert('Please log in to reserve a room');
            router.push(`/login?redirect=/hotels?${new URLSearchParams({
                city: city || '',
                checkin: checkin || '',
                checkout: checkout || ''
            }).toString()}`);
            return;
        }
        
        // If the hotel has only one room type, select it automatically
        if (hotel.HotelRoomType.length === 1) {
            makeReservation(hotel.id, hotel.HotelRoomType[0].id);
        } else {
            // Otherwise, show the room type selection modal
            setReservingHotelId(hotel.id);
            setSelectedRoomTypeId(null);
        }
    };

    // Function to actually make the reservation API call
    const makeReservation = async (hotelId: number, roomTypeId: number) => {
        if (!checkin || !checkout) {
            setReservationError('Check-in and check-out dates are required');
            return;
        }

        setReservationLoading(true);
        setReservationError(null);
        
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('Authentication required');
            }
            
            // Format dates for API
            const checkInDate = new Date(checkin);
            const checkOutDate = new Date(checkout);
            
            const response = await fetch('/api/hotels/reserve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    hotel_id: hotelId,
                    room_type_id: roomTypeId,
                    check_in_time: checkInDate.toISOString(),
                    check_out_time: checkOutDate.toISOString()
                })
            });
            
            if (response.status === 401) {
                // Try to refresh the token if unauthorized
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    // Retry with new token
                    const newToken = localStorage.getItem('accessToken');
                    const retryResponse = await fetch('/api/hotels/reserve', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${newToken}`
                        },
                        body: JSON.stringify({
                            hotel_id: hotelId,
                            room_type_id: roomTypeId,
                            check_in_time: checkInDate.toISOString(),
                            check_out_time: checkOutDate.toISOString()
                        })
                    });
                    
                    if (retryResponse.ok) {
                        handleReservationSuccess();
                        return;
                    } else {
                        const errorData = await retryResponse.json();
                        throw new Error(errorData.error || 'Failed to create reservation');
                    }
                }
                
                // If refresh failed, redirect to login
                alert('Your session has expired. Please log in again.');
                router.push('/login');
                return;
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create reservation');
            }
            
            // Handle successful reservation
            handleReservationSuccess();
            
        } catch (error: any) {
            setReservationError(error.message || 'Failed to make reservation');
            console.error('Reservation error:', error);
        } finally {
            setReservationLoading(false);
            setReservingHotelId(null);
        }
    };
    
    // Function to handle successful reservation
    const handleReservationSuccess = () => {
        setReservationSuccess(true);
        setReservingHotelId(null);
        
        // Show success message and clear it after a few seconds
        setTimeout(() => {
            setReservationSuccess(false);
        }, 5000);
        
        // Optionally redirect to reservations page
        // router.push('/reservations');
    };

    // Function to close modal
    const closeModal = () => {
        setReservingHotelId(null);
        setSelectedRoomTypeId(null);
        setReservationError(null);
    };

    return (
        <main className="min-h-screen bg-base-200" style={{ overflowY: 'auto', height: '100vh' }}>
            <Navbar/>
            <div className={`flex flex-col items-center w-full px-4 py-8 pb-16 ${fadeIn ? 'animate-fadeIn' : ''}`}>
                <h1 className="text-4xl font-bold text-center mb-6">Hotel Search</h1>
                
                {/* Show success notification */}
                {reservationSuccess && (
                    <div className="alert alert-success w-full max-w-4xl mb-4">
                        <div className="flex-1">
                            <span>Reservation successful! You can view your reservations in your account.</span>
                        </div>
                    </div>
                )}
                
                <p className="text-lg text-center mb-8">
                    Find the perfect accommodation for your next trip
                </p>
                
                {/* Search Form */}
                <div className="w-full max-w-4xl bg-base-100 rounded-lg shadow-lg p-6 mb-8">
                    <form onSubmit={searchHotels} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">City</span>
                                </label>
                                <input 
                                    type="text" 
                                    className="input input-bordered w-full" 
                                    placeholder="Enter city"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Check-in Date</span>
                                </label>
                                <input 
                                    type="date" 
                                    className="input input-bordered w-full" 
                                    value={checkin}
                                    onChange={(e) => setCheckin(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Check-out Date</span>
                                </label>
                                <input 
                                    type="date" 
                                    className="input input-bordered w-full" 
                                    value={checkout}
                                    onChange={(e) => setCheckout(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="divider">Filter Options</div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Hotel Name</span>
                                </label>
                                <input 
                                    type="text" 
                                    className="input input-bordered w-full" 
                                    placeholder="Filter by name"
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                />
                            </div>
                            
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Star Rating</span>
                                </label>
                                <select 
                                    className="select select-bordered w-full"
                                    value={starRating}
                                    onChange={(e) => setStarRating(e.target.value ? parseInt(e.target.value) : "")}
                                >
                                    <option value="">Any Rating</option>
                                    <option value="1">1+ Star</option>
                                    <option value="2">2+ Stars</option>
                                    <option value="3">3+ Stars</option>
                                    <option value="4">4+ Stars</option>
                                    <option value="5">5 Stars</option>
                                </select>
                            </div>
                            
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Price Range</span>
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        className="input input-bordered w-full" 
                                        placeholder="Min $"
                                        min="0"
                                        value={priceMin}
                                        onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : "")}
                                    />
                                    <input 
                                        type="number" 
                                        className="input input-bordered w-full" 
                                        placeholder="Max $"
                                        min="0"
                                        value={priceMax}
                                        onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : "")}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-center mt-4">
                            <button 
                                type="submit" 
                                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                                disabled={loading}
                            >
                                {loading ? 'Searching...' : 'Search Hotels'}
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* Search Results */}
                {searched && (
                    <div className="w-full max-w-4xl animate-fadeIn">
                        <h2 className="text-2xl font-bold mb-4">
                            {hotels.length} {hotels.length === 1 ? 'Hotel' : 'Hotels'} Found
                        </h2>
                        
                        {hotels.length === 0 ? (
                            <div className="bg-base-100 rounded-lg shadow p-6 text-center">
                                <p className="text-lg">No hotels found matching your criteria.</p>
                                <p>Try adjusting your filters or search for a different location.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {hotels.map(hotel => (
                                    <div key={hotel.id} className="card bg-base-100 shadow-lg">
                                        <div className="card-body">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="card-title">{hotel.name}</h3>
                                                    <p className="text-sm">{hotel.address}</p>
                                                    <p className="text-sm">{hotel.Location.city}, {hotel.Location.country}</p>
                                                    <div className="flex items-center mt-1">
                                                        {Array.from({ length: hotel.star_rating }, (_, i) => (
                                                            <span key={i} className="text-yellow-500">★</span>
                                                        ))}
                                                    </div>
                                                    <p className="mt-2">Starting from {getMinPrice(hotel)}</p>
                                                </div>
                                                <button 
                                                    className="btn btn-primary"
                                                    onClick={() => handleReserve(hotel)}
                                                >
                                                    Reserve Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Room Selection Modal */}
                {reservingHotelId && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full">
                            <h3 className="text-lg font-bold mb-4">Select Room Type</h3>
                            
                            {reservationError && (
                                <div className="alert alert-error mb-4">
                                    <div className="flex-1">
                                        <span>{reservationError}</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-2 mb-4">
                                {hotels.find(h => h.id === reservingHotelId)?.HotelRoomType.map(roomType => (
                                    <div 
                                        key={roomType.id} 
                                        className={`border p-3 rounded cursor-pointer ${selectedRoomTypeId === roomType.id ? 'border-primary bg-base-200' : ''}`}
                                        onClick={() => setSelectedRoomTypeId(roomType.id)}
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-medium">{roomType.name}</span>
                                            <span>${roomType.price_per_night}/night</span>
                                        </div>
                                        <div className="text-xs mt-1">
                                            {roomType.room_count} rooms available
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                                <button 
                                    className="btn btn-outline"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className={`btn btn-primary ${reservationLoading ? 'loading' : ''}`}
                                    disabled={!selectedRoomTypeId || reservationLoading}
                                    onClick={() => selectedRoomTypeId && reservingHotelId && makeReservation(reservingHotelId, selectedRoomTypeId)}
                                >
                                    {reservationLoading ? 'Processing...' : 'Confirm Reservation'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}