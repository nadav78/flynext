'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PaperClipIcon, ArrowDownTrayIcon, CalendarIcon, BuildingOfficeIcon, UserIcon } from '@heroicons/react/24/outline';

type Invoice = {
  id: string;
  tripId: string;
  bookingReference: string;
  ticketNumber: string;
  totalPrice: string;
  createdAt: string;
  invoiceUrl: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  hotelReservations: Array<{
    id: string;
    hotelName: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    price: string;
  }>;
  flights: Array<{
    id: string;
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    price: string;
  }>;
};

export default function InvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trips/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice data');
      }
      
      const data = await response.json();
      setInvoice(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the invoice');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async () => {
    setLoading(true);
    try {
      // Call the invoice generation API
      const response = await fetch(`/api/invoice?tripId=${params.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }
      
      // Get the PDF as a blob
      const blob = await response.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a link and trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${params.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke the URL
      window.URL.revokeObjectURL(url);
      
      setSuccess('Invoice generated successfully!');
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the invoice');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);
  
  if (loading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen bg-base-200 flex items-center justify-center">
          <div className="text-xl text-base-content flex items-center">
            <span className="loading loading-spinner loading-lg mr-4"></span>
            Loading invoice...
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  if (error) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen bg-base-200 p-4">
          <div className="max-w-3xl mx-auto bg-base-100 rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-error mb-4">Error</h1>
            <p className="text-base-content">{error}</p>
            <div className="mt-8">
              <Link href="/bookings" className="btn btn-primary">
                Back to Bookings
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  if (!invoice) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen bg-base-200 p-4">
          <div className="max-w-3xl mx-auto bg-base-100 rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-base-content mb-4">Invoice Not Found</h1>
            <p className="text-base-content/70">The requested invoice could not be found.</p>
            <div className="mt-8">
              <Link href="/bookings" className="btn btn-primary">
                Back to Bookings
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-base-100 rounded-lg shadow-md">
          {/* Success message */}
          {success && (
            <div className="mx-6 mt-4 p-3 bg-success/20 text-success-content rounded-md">
              {success}
            </div>
          )}
          
          {/* Invoice Header */}
          <div className="p-6 border-b border-base-300 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-base-content">Invoice</h1>
              <p className="text-sm text-base-content/70">Trip #{invoice.tripId}</p>
            </div>
            <div className="flex flex-col items-end">
              <button 
                onClick={generateInvoice}
                disabled={loading}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                <PaperClipIcon className="w-4 h-4" />
                Generate Invoice
              </button>
              <p className="text-xs text-base-content/70 mt-1">
                Created on {new Date(invoice.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Invoice Content */}
          <div className="p-6">
            {/* Customer Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Customer Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-base-content/70">Name</p>
                  <p className="font-medium">{invoice.user.firstName} {invoice.user.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Email</p>
                  <p className="font-medium">{invoice.user.email}</p>
                </div>
                {invoice.user.phoneNumber && (
                  <div>
                    <p className="text-sm text-base-content/70">Phone</p>
                    <p className="font-medium">{invoice.user.phoneNumber}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Booking Reference */}
            <div className="mb-8 p-4 bg-base-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/70">Booking Reference</p>
                  <p className="font-semibold text-lg">{invoice.bookingReference}</p>
                </div>
                {invoice.ticketNumber && (
                  <div className="text-right">
                    <p className="text-sm text-base-content/70">Ticket Number</p>
                    <p className="font-semibold">{invoice.ticketNumber}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Flight Information */}
            {invoice.flights && invoice.flights.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b border-base-300 pb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Flight Details
                </h2>
                
                {invoice.flights.map((flight, index) => (
                  <div 
                    key={flight.id} 
                    className={`p-4 rounded-lg ${index % 2 === 0 ? 'bg-base-200' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold">{flight.airline}</div>
                      <div className="badge badge-primary">{flight.flightNumber}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                      <div>
                        <p className="text-sm text-base-content/70">Departure</p>
                        <p className="font-medium">{flight.origin}</p>
                        <p className="text-sm">
                          {new Date(flight.departureTime).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <div className="border-t border-base-300 w-full relative">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-base-content/70">Arrival</p>
                        <p className="font-medium">{flight.destination}</p>
                        <p className="text-sm">
                          {new Date(flight.arrivalTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-base-content/70">Price</p>
                      <p className="font-semibold">${flight.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Hotel Information */}
            {invoice.hotelReservations && invoice.hotelReservations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b border-base-300 pb-2 flex items-center">
                  <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                  Hotel Reservations
                </h2>
                
                {invoice.hotelReservations.map((reservation, index) => (
                  <div 
                    key={reservation.id} 
                    className={`p-4 rounded-lg ${index % 2 === 0 ? 'bg-base-200' : ''}`}
                  >
                    <div className="font-semibold mb-2">{reservation.hotelName}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <p className="text-sm text-base-content/70">Room Type</p>
                        <p className="font-medium">{reservation.roomType}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-base-content/70">Dates</p>
                        <p className="font-medium flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(reservation.checkIn).toLocaleDateString()} to {new Date(reservation.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-base-content/70">Price</p>
                      <p className="font-semibold">${reservation.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Payment Summary */}
            <div className="border-t border-base-300 pt-4 mt-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Total</h2>
                <p className="text-xl font-bold">${invoice.totalPrice}</p>
              </div>
              <p className="text-sm text-base-content/70 mt-2">
                Payment has been received for this booking.
              </p>
            </div>
            
            {/* Actions */}
            <div className="mt-8 flex justify-between">
              <Link href="/bookings" className="btn btn-ghost">
                Back to Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}