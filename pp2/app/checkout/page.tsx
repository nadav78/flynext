/* Created with assistance from Claude 3.7 Sonnet */
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

interface CardDetails {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

interface FlightBooking {
  id: string;
  airline: string;
  flightNumber: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
}

interface HotelBooking {
  id: string;
  name: string;
  roomType: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  price: number;
}

interface FlightBookingResponse {
    message?: string;
    bookingReference?: string;
    ticketNumber?: string;
    error?: string;
  }

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [flight, setFlight] = useState<FlightBooking | null>(null);
  const [hotel, setHotel] = useState<HotelBooking | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [passportNumber, setPassportNumber] = useState('');

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry date with slash
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  useEffect(() => {
    // Get flight and hotel data from localStorage or API
    const flightData = localStorage.getItem('selectedFlight');
    const hotelData = localStorage.getItem('selectedHotel');
    
    if (flightData) {
      const parsedFlight = JSON.parse(flightData);
      setFlight(parsedFlight);
      setTotalPrice(prev => prev + parsedFlight.price);
    }
    
    if (hotelData) {
      const parsedHotel = JSON.parse(hotelData);
      setHotel(parsedHotel);
      setTotalPrice(prev => prev + parsedHotel.price);
    }
    
    // If no items to check out, redirect to home
    if (!flightData && !hotelData) {
      router.push('/');
    }
  }, [router]);

  const validateCard = () => {
    // Basic validation
    if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(cardDetails.number)) {
      setError('Invalid card number');
      return false;
    }

    if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
      setError('Invalid expiry date (MM/YY)');
      return false;
    }

    // Parse expiry date
    const [month, year] = cardDetails.expiry.split('/').map(n => parseInt(n));
    const expiryDate = new Date(2000 + year, month - 1);
    const currentDate = new Date();
    
    if (expiryDate < currentDate) {
      setError('Card has expired');
      return false;
    }

    if (!/^\d{3}$/.test(cardDetails.cvc)) {
      setError('Invalid CVC (3 digits)');
      return false;
    }

    if (!cardDetails.name.trim()) {
      setError('Name on card is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    let flightResult: FlightBookingResponse | null = null;
    e.preventDefault();
    setError('');
    setLoading(true);
  
    if (!validateCard()) {
      setLoading(false);
      return;
    }
  
    try {
      // First create a trip itinerary if both flight and hotel exist
      let tripId = null;
      
      // Book flight if selected
      if (flight) {
        // Additional required fields for flight booking
        
        const flightBookingData = {
            firstName: user?.first_name || '',
            lastName: user?.last_name || '',
            email: user?.email || '',
            tripItineraryId: tripId,
            passportNumber: passportNumber, // Use the input value instead of hardcoded
            firstFlightId: flight.id,
            returnFlightId: '' // Add return flight if applicable
          };
  
        const flightResponse = await fetch('/api/flights/book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(flightBookingData),
        });
  
        flightResult = await flightResponse.json();
        
        if (!flightResponse.ok) {
            throw new Error(flightResult?.error || 'Failed to book flight');
          }
          
          // Store booking reference for invoice
          localStorage.setItem('bookingReference', flightResult?.bookingReference || '');
          localStorage.setItem('ticketNumber', flightResult?.ticketNumber || '');
      }
      
      // Book hotel if selected
      if (hotel) {
        const hotelBookingData = {
          hotel_id: parseInt(hotel.id),
          room_type_id: parseInt(hotel.id), // Assuming hotel.id also contains room type ID - adjust as needed
          check_in_time: hotel.checkIn,
          check_out_time: hotel.checkOut
        };
  
        const hotelResponse = await fetch('/api/hotels/reserve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id?.toString() || '',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(hotelBookingData),
        });
  
        const hotelResult = await hotelResponse.json();
        
        if (!hotelResponse.ok) {
          throw new Error(hotelResult.error || 'Failed to book hotel');
        }
        
        // Store hotel reservation ID
        tripId = hotelResult.id;
      }
  
      // Clear selected items
      localStorage.removeItem('selectedFlight');
      localStorage.removeItem('selectedHotel');
      
      // Show success state
      setSuccess(true);
      
      // Redirect to invoice/bookings page after a delay
      setTimeout(() => {
        if (tripId) {
          // Hotel booking has an ID we can use
          router.push(`/invoice/${tripId}`);
        } else if (flightResult && flightResult.bookingReference) {
          // Flight booking has a reference
          router.push(`/bookings?reference=${flightResult.bookingReference}`);
        } else {
          // Fallback
          router.push('/bookings');
        }
      }, 2000);
      
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'An error occurred while processing your payment');
    } finally {
      setLoading(false);
    }
  };

  const getCardType = (number: string) => {
    // Basic card type detection
    const firstDigit = number.charAt(0);
    if (firstDigit === '4') return 'Visa';
    if (firstDigit === '5') return 'MasterCard';
    if (firstDigit === '3') return 'American Express';
    if (firstDigit === '6') return 'Discover';
    return 'Credit Card';
  };

  if (success) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen bg-base-200 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="card bg-base-100 shadow-xl p-8">
              <h1 className="text-3xl font-bold text-success mb-4">Booking Successful!</h1>
              <div className="text-lg mb-6">
                Your booking has been confirmed. Redirecting you to your invoice...
              </div>
              <div className="loading loading-spinner loading-lg mx-auto"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-screen bg-base-200 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Booking</h1>
          
          {/* Order Summary */}
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Order Summary</h2>
              
              {flight && (
                <div className="mb-4 p-4 border border-base-300 rounded-lg">
                  <h3 className="font-bold text-lg">Flight</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm opacity-70">Airline:</div>
                    <div>{flight.airline}</div>
                    
                    <div className="text-sm opacity-70">Flight:</div>
                    <div>{flight.flightNumber}</div>
                    
                    <div className="text-sm opacity-70">Route:</div>
                    <div>{flight.departureCity} to {flight.arrivalCity}</div>
                    
                    <div className="text-sm opacity-70">Departure:</div>
                    <div>{new Date(flight.departureTime).toLocaleString()}</div>
                    
                    <div className="text-sm opacity-70">Price:</div>
                    <div className="font-semibold">${flight.price.toFixed(2)}</div>
                  </div>
                </div>
              )}
              
              {hotel && (
                <div className="mb-4 p-4 border border-base-300 rounded-lg">
                  <h3 className="font-bold text-lg">Hotel</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm opacity-70">Hotel:</div>
                    <div>{hotel.name}</div>
                    
                    <div className="text-sm opacity-70">Room Type:</div>
                    <div>{hotel.roomType}</div>
                    
                    <div className="text-sm opacity-70">Check-in:</div>
                    <div>{new Date(hotel.checkIn).toLocaleDateString()}</div>
                    
                    <div className="text-sm opacity-70">Check-out:</div>
                    <div>{new Date(hotel.checkOut).toLocaleDateString()}</div>
                    
                    <div className="text-sm opacity-70">Price:</div>
                    <div className="font-semibold">${hotel.price.toFixed(2)}</div>
                  </div>
                </div>
              )}
              
              <div className="divider"></div>
              
              <div className="flex justify-between items-center">
                <div className="text-lg font-bold">Total:</div>
                <div className="text-xl font-bold">${totalPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>

            {flight && (
            <div className="card bg-base-100 shadow-xl mb-8">
                <div className="card-body">
                <h2 className="card-title text-2xl mb-4">Flight Information</h2>
                <div className="form-control">
                    <label className="label">
                    <span className="label-text">Passport Number</span>
                    </label>
                    <input
                    type="text"
                    className="input input-bordered"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456789"
                    required
                    />
                </div>
                </div>
            </div>
            )}

          {/* Payment Form */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Payment Details</h2>
              
              {error && (
                <div className="alert alert-error mb-4">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name on Card</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Card Number</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails(prev => ({
                      ...prev,
                      number: formatCardNumber(e.target.value)
                    }))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Expiry Date</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails(prev => ({
                        ...prev,
                        expiry: formatExpiry(e.target.value)
                      }))}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">CVC</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails(prev => ({
                        ...prev,
                        cvc: e.target.value.replace(/\D/g, '').slice(0, 3)
                      }))}
                      placeholder="123"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    type="submit" 
                    className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Pay $${totalPrice.toFixed(2)}`}
                  </button>
                </div>
                
                <div className="text-center mt-4">
                  <Link href="/" className="link link-primary">
                    Cancel and return to home
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}