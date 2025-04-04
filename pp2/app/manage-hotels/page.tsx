'use client';
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

// Define types for hotel management
type HotelRoomType = {
  id: number;
  name: string;
  price_per_night: number;
  room_count: number;
  amenities?: string;
};

type Hotel = {
  id: number;
  name: string;
  address: string;
  description?: string;
  star_rating: number;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  amenities?: string;
  Location?: {
    city: string;
    country: string;
  };
};

type Reservation = {
  id: number;
  userId: number;
  hotelId: number;
  hotelRoomTypeId: number;
  check_in_time: string;
  check_out_time: string;
  is_cancelled: boolean;
  is_paid: boolean;
  reserver?: {
    first_name: string;
    last_name: string;
  };
  hotelRoomType?: {
    name: string;
  };
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  roomType?: {
    name: string;
    price_per_night: number;
  };
  createdAt?: string;
};

export default function ManageHotels() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("hotels");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [roomTypes, setRoomTypes] = useState<HotelRoomType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Form states for adding/editing
  const [isAddingHotel, setIsAddingHotel] = useState(false);
  const [isEditingRoomType, setIsEditingRoomType] = useState(false);
  const [isAddingRoomType, setIsAddingRoomType] = useState(false);
  const [formData, setFormData] = useState({
    // Hotel form fields
    name: "",
    address: "",
    city: "",
    country: "",
    description: "",
    star_rating: 3,
    website: "",
    contact_email: "",
    contact_phone: "",
    amenities: "",
    
    // Room type form fields
    room_type_id: 0,
    room_name: "",
    price_per_night: 0,
    room_count: 1,
    room_amenities: "",
  });
  
  // Filters for reservations
  const [filters, setFilters] = useState({
    room_type_id: "",
    checkin_date: "",
    checkout_date: "",
    is_cancelled: "",
    is_paid: "",
  });
  
  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (user === null) {
      router.push('/login?redirect=/manage-hotels');
    } else {
      fetchHotels();
    }
  }, [user, router]);
  
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
  
  // Fetch all hotels owned by the user
  const fetchHotels = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error("Authentication required");
      
      const response = await fetch('/api/hotels/owner', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry with new token
          const newToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch('/api/hotels/owner', {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          });
          
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setHotels(data || []);
            return;
          }
        }
        
        // If refresh failed, redirect to login
        router.push('/login?redirect=/manage-hotels');
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch hotels');
      
      const data = await response.json();
      setHotels(data || []);
    } catch (error: any) {
      setError(error.message || "Failed to load hotels");
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch room types for a specific hotel
  const fetchRoomTypes = async (hotelId: number) => {
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error("Authentication required");
      
      const response = await fetch(`/api/hotels/owner/room-type?hotel_id=${hotelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch room types');
      
      const data = await response.json();
      setRoomTypes(data || []);
    } catch (error: any) {
      setError(error.message || "Failed to load room types");
      console.error('Error fetching room types:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch reservations for a specific hotel
  const fetchReservations = async (hotelId: number) => {
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error("Authentication required");
      
      // Build query parameters from filters
      const params = new URLSearchParams({ hotel_id: hotelId.toString() });
      
      if (filters.room_type_id) params.append('room_type_id', filters.room_type_id);
      if (filters.checkin_date) params.append('checkin_date', filters.checkin_date);
      if (filters.checkout_date) params.append('checkout_date', filters.checkout_date);
      if (filters.is_cancelled) params.append('is_cancelled', filters.is_cancelled);
      if (filters.is_paid) params.append('is_paid', filters.is_paid);
      
      const response = await fetch(`/api/hotels/owner/reservations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch reservations');
      
      const data = await response.json();
      setReservations(data || []);
    } catch (error: any) {
      setError(error.message || "Failed to load reservations");
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle hotel selection
  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setActiveTab("rooms");
    fetchRoomTypes(hotel.id);
  };
  
  // View reservations for a hotel
  const viewReservations = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setActiveTab("reservations");
    fetchReservations(hotel.id);
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit new hotel form
  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error("Authentication required");
      
      const hotelData = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        star_rating: parseInt(formData.star_rating.toString()),
        description: formData.description,
        website: formData.website,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        amenities: formData.amenities ? formData.amenities.split(',').map(item => item.trim()) : []
      };
      
      const response = await fetch('/api/hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(hotelData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create hotel');
      }
      
      // Reset form and refresh hotel list
      setIsAddingHotel(false);
      setFormData({
        ...formData,
        name: "",
        address: "",
        city: "",
        country: "",
        description: "",
        star_rating: 3,
        website: "",
        contact_email: "",
        contact_phone: "",
        amenities: ""
      });
      fetchHotels();
      
    } catch (error: any) {
      setError(error.message || "Failed to add hotel");
      console.error('Error adding hotel:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Submit new room type form
  const handleAddRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;
    
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error("Authentication required");
      
      const roomTypeData = {
        hotel_id: selectedHotel.id,
        name: formData.room_name,
        price_per_night: parseFloat(formData.price_per_night.toString()),
        room_count: parseInt(formData.room_count.toString()),
        amenities: formData.room_amenities ? formData.room_amenities.split(',').map(item => item.trim()) : []
      };
      
      const response = await fetch('/api/hotels/owner/room-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roomTypeData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room type');
      }
      
      // Reset form and refresh room types
      setIsAddingRoomType(false);
      setFormData({
        ...formData,
        room_name: "",
        price_per_night: 0,
        room_count: 1,
        room_amenities: ""
      });
      fetchRoomTypes(selectedHotel.id);
      
    } catch (error: any) {
      setError(error.message || "Failed to add room type");
      console.error('Error adding room type:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle updating a room type
  const handleUpdateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;
    
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error("Authentication required");
      
      const roomTypeData = {
        hotel_id: selectedHotel.id,
        room_type_id: formData.room_type_id,
        name: formData.room_name,
        price_per_night: parseFloat(formData.price_per_night.toString()),
        room_count: parseInt(formData.room_count.toString()),
        amenities: formData.room_amenities ? formData.room_amenities.split(',').map(item => item.trim()) : []
      };
      
      const response = await fetch('/api/hotels/owner/room-type', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roomTypeData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update room type');
      }
      
      // Reset form and refresh room types
      setIsEditingRoomType(false);
      setFormData({
        ...formData,
        room_type_id: 0,
        room_name: "",
        price_per_night: 0,
        room_count: 1,
        room_amenities: ""
      });
      fetchRoomTypes(selectedHotel.id);
      
    } catch (error: any) {
      setError(error.message || "Failed to update room type");
      console.error('Error updating room type:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle editing a room type - populate form
  const editRoomType = (roomType: HotelRoomType) => {
    setIsEditingRoomType(true);
    setFormData({
      ...formData,
      room_type_id: roomType.id,
      room_name: roomType.name,
      price_per_night: roomType.price_per_night,
      room_count: roomType.room_count,
      room_amenities: roomType.amenities || ""
    });
  };
  
  // Handle reservation cancellation
  const cancelReservation = async (reservationId: number) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error("Authentication required");
      
      const response = await fetch('/api/hotels/owner/reservations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          is_cancelled: "true"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel reservation');
      }
      
      // Refresh reservations
      if (selectedHotel) {
        fetchReservations(selectedHotel.id);
      }
      
    } catch (error: any) {
      setError(error.message || "Failed to cancel reservation");
      console.error('Error cancelling reservation:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply reservation filters
  const applyFilters = () => {
    if (selectedHotel) {
      fetchReservations(selectedHotel.id);
    }
  };
  
  // Reset reservation filters
  const resetFilters = () => {
    setFilters({
      room_type_id: "",
      checkin_date: "",
      checkout_date: "",
      is_cancelled: "",
      is_paid: ""
    });
    
    if (selectedHotel) {
      fetchReservations(selectedHotel.id);
    }
  };
  
  return (
    <main className="flex flex-col min-h-screen bg-base-200">
      <Navbar />
      <div className="flex flex-col items-center w-full px-4 py-8 pb-16">
        <h1 className="text-4xl font-bold text-center mb-6">Hotel Management</h1>
        
        {error && (
          <div className="alert alert-error w-full max-w-4xl mb-4">
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6">
          <a 
            className={`tab ${activeTab === 'hotels' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('hotels')}
          >
            My Hotels
          </a>
          {selectedHotel && (
            <>
              <a 
                className={`tab ${activeTab === 'rooms' ? 'tab-active' : ''}`}
                onClick={() => {
                  setActiveTab('rooms');
                  fetchRoomTypes(selectedHotel.id);
                }}
              >
                Room Types
              </a>
              <a 
                className={`tab ${activeTab === 'reservations' ? 'tab-active' : ''}`}
                onClick={() => {
                  setActiveTab('reservations');
                  fetchReservations(selectedHotel.id);
                }}
              >
                Reservations
              </a>
            </>
          )}
        </div>
        
        {/* Main content area */}
        <div className="w-full max-w-4xl bg-base-100 rounded-lg shadow-lg p-6">
          {/* Hotels Tab */}
          {activeTab === 'hotels' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Hotels</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => setIsAddingHotel(!isAddingHotel)}
                >
                  {isAddingHotel ? 'Cancel' : 'Add Hotel'}
                </button>
              </div>
              
              {/* Add Hotel Form */}
              {isAddingHotel && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Add New Hotel</h3>
                  <form onSubmit={handleAddHotel} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Hotel Name</span>
                        </label>
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="input input-bordered w-full" 
                          required
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Address</span>
                        </label>
                        <input 
                          type="text" 
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="input input-bordered w-full" 
                          required
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">City</span>
                        </label>
                        <input 
                          type="text" 
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="input input-bordered w-full" 
                          required
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Country</span>
                        </label>
                        <input 
                          type="text" 
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className="input input-bordered w-full" 
                          required
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Star Rating</span>
                        </label>
                        <select 
                          name="star_rating"
                          value={formData.star_rating}
                          onChange={handleChange}
                          className="select select-bordered w-full"
                        >
                          <option value="1">1 Star</option>
                          <option value="2">2 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="5">5 Stars</option>
                        </select>
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Website</span>
                        </label>
                        <input 
                          type="url" 
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          className="input input-bordered w-full" 
                          required
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Contact Email</span>
                        </label>
                        <input 
                          type="email" 
                          name="contact_email"
                          value={formData.contact_email}
                          onChange={handleChange}
                          className="input input-bordered w-full" 
                          required
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Contact Phone</span>
                        </label>
                        <input 
                          type="tel" 
                          name="contact_phone"
                          value={formData.contact_phone}
                          onChange={handleChange}
                          className="input input-bordered w-full" 
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Description</span>
                      </label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="textarea textarea-bordered h-24" 
                        required
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Amenities (comma-separated)</span>
                      </label>
                      <input 
                        type="text" 
                        name="amenities"
                        value={formData.amenities}
                        onChange={handleChange}
                        placeholder="WiFi, Pool, Gym, etc."
                        className="input input-bordered w-full" 
                      />
                    </div>
                    
                    <div className="form-control mt-6">
                      <button 
                        type="submit" 
                        className={`btn btn-primary ${loading ? 'loading' : ''}`}
                        disabled={loading}
                      >
                        {loading ? 'Creating...' : 'Create Hotel'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Hotels List */}
              {loading && !isAddingHotel ? (
                <div className="flex justify-center">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <div className="space-y-4">
                  {hotels.length === 0 ? (
                    <div className="text-center py-8">
                      <p>You don't have any hotels yet. Add your first hotel to get started!</p>
                    </div>
                  ) : (
                    hotels.map(hotel => (
                      <div key={hotel.id} className="card bg-base-100 shadow-lg border">
                        <div className="card-body">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="card-title">{hotel.name}</h3>
                              <p className="text-sm">{hotel.address}</p>
                              {hotel.Location && (
                                <p className="text-sm">{hotel.Location.city}, {hotel.Location.country}</p>
                              )}
                              <div className="flex items-center mt-1">
                                {Array.from({ length: hotel.star_rating }, (_, i) => (
                                  <span key={i} className="text-yellow-500">★</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => handleHotelSelect(hotel)}
                              >
                                Manage Rooms
                              </button>
                              <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => viewReservations(hotel)}
                              >
                                Reservations
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Room Types Tab */}
          {activeTab === 'rooms' && selectedHotel && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Room Types for {selectedHotel.name}</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setIsAddingRoomType(!isAddingRoomType);
                    setIsEditingRoomType(false);
                    setFormData({
                      ...formData,
                      room_type_id: 0,
                      room_name: "",
                      price_per_night: 0,
                      room_count: 1,
                      room_amenities: ""
                    });
                  }}
                >
                  {isAddingRoomType ? 'Cancel' : 'Add Room Type'}
                </button>
              </div>
              
              {/* Add/Edit Room Type Form */}
              {(isAddingRoomType || isEditingRoomType) && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">
                    {isEditingRoomType ? 'Edit Room Type' : 'Add New Room Type'}
                  </h3>
                  <form onSubmit={isEditingRoomType ? handleUpdateRoomType : handleAddRoomType} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Room Type Name</span>
                        </label>
                        <input 
                          type="text" 
                          name="room_name"
                          value={formData.room_name}
                          onChange={handleChange}
                          className="input input-bordered w-full" 
                          required
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Price Per Night</span>
                        </label>
                        <input 
                          type="number" 
                          name="price_per_night"
                          value={formData.price_per_night}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          className="input input-bordered w-full" 
                          required
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Number of Rooms</span>
                        </label>
                        <input 
                          type="number" 
                          name="room_count"
                          value={formData.room_count}
                          onChange={handleChange}
                          min="1"
                          className="input input-bordered w-full" 
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Amenities (comma-separated)</span>
                      </label>
                      <input 
                        type="text" 
                        name="room_amenities"
                        value={formData.room_amenities}
                        onChange={handleChange}
                        placeholder="WiFi, TV, Mini Bar, etc."
                        className="input input-bordered w-full" 
                      />
                    </div>
                    
                    <div className="form-control mt-6">
                      <button 
                        type="submit" 
                        className={`btn btn-primary ${loading ? 'loading' : ''}`}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : isEditingRoomType ? 'Update Room Type' : 'Create Room Type'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Room Types List */}
              {loading && !isAddingRoomType && !isEditingRoomType ? (
                <div className="flex justify-center">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <div className="space-y-4">
                  {roomTypes.length === 0 ? (
                    <div className="text-center py-8">
                      <p>No room types defined for this hotel yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Price Per Night</th>
                            <th>Available Rooms</th>
                            <th>Amenities</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomTypes.map(roomType => (
                            <tr key={roomType.id}>
                              <td>{roomType.name}</td>
                              <td>${Number(roomType.price_per_night).toFixed(2)}</td>
                              <td>{roomType.room_count}</td>
                              <td>
                                {roomType.amenities ? 
                                  (typeof roomType.amenities === 'string' ? 
                                    JSON.parse(roomType.amenities).join(", ") : 
                                    Array.isArray(roomType.amenities) ? 
                                      (roomType.amenities as string[]).join(", ") : 
                                      "None listed") : 
                                  "None listed"}
                              </td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-outline"
                                  onClick={() => editRoomType(roomType)}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Reservations Tab */}
          {activeTab === 'reservations' && selectedHotel && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Reservations for {selectedHotel.name}</h2>
              
              {/* Filters */}
              <div className="p-4 border rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Filter Reservations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Room Type</span>
                    </label>
                    <select 
                      className="select select-bordered w-full"
                      value={filters.room_type_id}
                      onChange={(e) => setFilters({...filters, room_type_id: e.target.value})}
                    >
                      <option value="">All Room Types</option>
                      {roomTypes.map(roomType => (
                        <option key={roomType.id} value={roomType.id}>
                          {roomType.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Check-in Date</span>
                    </label>
                    <input 
                      type="date" 
                      className="input input-bordered w-full" 
                      value={filters.checkin_date}
                      onChange={(e) => setFilters({...filters, checkin_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Check-out Date</span>
                    </label>
                    <input 
                      type="date" 
                      className="input input-bordered w-full" 
                      value={filters.checkout_date}
                      onChange={(e) => setFilters({...filters, checkout_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Cancellation Status</span>
                    </label>
                    <select 
                      className="select select-bordered w-full"
                      value={filters.is_cancelled}
                      onChange={(e) => setFilters({...filters, is_cancelled: e.target.value})}
                    >
                      <option value="">All Statuses</option>
                      <option value="false">Active</option>
                      <option value="true">Cancelled</option>
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Payment Status</span>
                    </label>
                    <select 
                      className="select select-bordered w-full"
                      value={filters.is_paid}
                      onChange={(e) => setFilters({...filters, is_paid: e.target.value})}
                    >
                      <option value="">All Statuses</option>
                      <option value="true">Paid</option>
                      <option value="false">Unpaid</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 gap-2">
                  <button 
                    className="btn btn-outline"
                    onClick={resetFilters}
                  >
                    Reset
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={applyFilters}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
              
              {/* Reservations List */}
              {loading ? (
                <div className="flex justify-center">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.length === 0 ? (
                    <div className="text-center py-8">
                      <p>No reservations found matching your criteria.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Guest</th>
                            <th>Room Type</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservations.map(reservation => (
                            <tr key={reservation.id}>
                              <td>{reservation.id}</td>
                              <td>
                                {reservation.reserver ? 
                                  `${reservation.reserver.first_name} ${reservation.reserver.last_name}` : 
                                  reservation.user ? 
                                    `${reservation.user.first_name} ${reservation.user.last_name}` : 
                                    "Unknown Guest"}
                              </td>
                              <td>
                                {reservation.hotelRoomType ? 
                                  reservation.hotelRoomType.name :
                                  reservation.roomType ? 
                                    reservation.roomType.name : 
                                    "Unknown Room"}
                              </td>
                              <td>{new Date(reservation.check_in_time).toLocaleDateString()}</td>
                              <td>{new Date(reservation.check_out_time).toLocaleDateString()}</td>
                              <td>
                                <span className={`badge ${reservation.is_cancelled ? 'badge-error' : 'badge-success'}`}>
                                  {reservation.is_cancelled ? 'Cancelled' : 'Active'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${reservation.is_paid ? 'badge-success' : 'badge-warning'}`}>
                                  {reservation.is_paid ? 'Paid' : 'Unpaid'}
                                </span>
                              </td>
                              <td>
                                {!reservation.is_cancelled && (
                                  <button 
                                    className="btn btn-sm btn-error"
                                    onClick={() => cancelReservation(reservation.id)}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </main>
  );
}
