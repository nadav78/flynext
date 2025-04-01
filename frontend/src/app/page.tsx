'use client';

import { useState } from 'react';
// import SearchFlights from '@/components/flights/SearchFlights';
// import SearchHotels from '@/components/hotels/SearchHotels';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels'>('flights');

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        FlyNext: Your Most Reliable Travel Companion
      </h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex border-b mb-6">
          <button 
            className={`px-6 py-3 font-medium ${activeTab === 'flights' 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'text-gray-500'}`}
            onClick={() => setActiveTab('flights')}
          >
            Flights
          </button>
          <button 
            className={`px-6 py-3 font-medium ${activeTab === 'hotels' 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'text-gray-500'}`}
            onClick={() => setActiveTab('hotels')}
          >
            Hotels
          </button>
        </div>
        
        {/* {activeTab === 'flights' ? <SearchFlights /> : <SearchHotels />} */}
      </div>
    </main>
  );
}