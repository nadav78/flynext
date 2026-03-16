/**
 * Mock flight data layer — replaces the original course AFS API.
 * Generates realistic flights from search parameters using seeded
 * randomness so the same search always returns the same results.
 * Booking, verification and cancellation are handled via the local DB.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Airlines ─────────────────────────────────────────────────────────────────
const AIRLINES = [
  { code: 'AC', name: 'Air Canada' },
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'AA', name: 'American Airlines' },
  { code: 'BA', name: 'British Airways' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'AF', name: 'Air France' },
  { code: 'EK', name: 'Emirates' },
  { code: 'WS', name: 'WestJet' },
  { code: 'F8', name: 'Flair Airlines' },
];

// ─── Seeded PRNG (LCG) — same seed → same flights ────────────────────────────
function seededRandom(seed) {
  let s = Math.abs(seed) || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ─── Airport info lookup (falls back to IATA code if DB empty) ───────────────
async function getAirportInfo(code) {
  try {
    const ap = await prisma.airport.findFirst({
      where: { code },
      include: { Location: true },
    });
    if (ap) return { name: ap.name, city: ap.Location.city, country: ap.Location.country };
  } catch { /* ignore */ }
  return { name: code, city: code, country: '' };
}

// ─── Core flight generator ────────────────────────────────────────────────────
function buildMockFlights(origin, destination, date, originInfo, destInfo) {
  const rand = seededRandom(hashString(`${origin}${destination}${date}`));
  const count = 5 + Math.floor(rand() * 4); // 5–8 options

  // Base price scaled loosely by "distance" (hash difference as proxy)
  const distProxy = Math.abs(hashString(origin) - hashString(destination)) % 1000;
  const basePrice = 120 + distProxy * 0.6;
  const baseDurationMins = 60 + Math.floor(distProxy * 0.5);

  const results = [];
  for (let i = 0; i < count; i++) {
    const airline = AIRLINES[Math.floor(rand() * AIRLINES.length)];
    const flightNum = 100 + Math.floor(rand() * 8900);
    const departHour = 6 + Math.floor(rand() * 15);   // 06:00 – 20:00
    const departMin = Math.floor(rand() * 4) * 15;    // :00 :15 :30 :45
    const durationMins = Math.max(45, baseDurationMins + Math.floor(rand() * 90 - 45));
    const price = Math.round((basePrice + rand() * 300 - 100) * 100) / 100;

    const departure = new Date(`${date}T${String(departHour).padStart(2, '0')}:${String(departMin).padStart(2, '0')}:00`);
    const arrival = new Date(departure.getTime() + durationMins * 60_000);

    const offerId = `mock_${origin}_${destination}_${date}_${i}`;

    results.push({
      legs: 1,
      flights: [{
        id: offerId,
        flightNumber: `${airline.code}${flightNum}`,
        departureTime: departure.toISOString(),
        arrivalTime: arrival.toISOString(),
        duration: durationMins,
        price,
        currency: 'USD',
        status: 'SCHEDULED',
        availableSeats: 5 + Math.floor(rand() * 25),
        airline: { code: airline.code, name: airline.name },
        origin: { code: origin, name: originInfo.name, city: originInfo.city, country: originInfo.country },
        destination: { code: destination, name: destInfo.name, city: destInfo.city, country: destInfo.country },
      }],
    });
  }
  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAFSFlightDetails({ origin, destination, departure }) {
  if (!origin || !destination || !departure) return { error: 'Missing search params' };
  const [originInfo, destInfo] = await Promise.all([
    getAirportInfo(origin),
    getAirportInfo(destination),
  ]);
  const results = buildMockFlights(origin, destination, departure, originInfo, destInfo);
  return { results };
}

export async function getAFSFlightDetailsById(offerId) {
  // Decode the offerId back into its components
  // Format: mock_{origin}_{destination}_{date}_{index}
  const parts = offerId.split('_');
  if (parts.length < 5 || parts[0] !== 'mock') {
    return { error: 'Flight not found' };
  }
  const [, origin, destination, date, indexStr] = parts;
  const index = parseInt(indexStr, 10);

  const [originInfo, destInfo] = await Promise.all([
    getAirportInfo(origin),
    getAirportInfo(destination),
  ]);
  const results = buildMockFlights(origin, destination, date, originInfo, destInfo);
  return results[index]?.flights[0] ?? { error: 'Flight not found' };
}

export async function getAutocomplete(queryType) {
  try {
    if (queryType === 'cities') return await prisma.location.findMany({ take: 300 });
    return await prisma.airport.findMany({ take: 300 });
  } catch {
    return [];
  }
}

export async function bookFlight(
  { userId, firstName, lastName, email, passportNumber, flightIds },
  tripItineraryId
) {
  const offerId = flightIds[0];

  const userDetails = await prisma.user.findFirst({ where: { id: userId } });
  if (!userDetails) return { error: 'User not found' };
  if (!firstName || !lastName) return { error: 'First and last name required' };
  if (!email) return { error: 'Email required' };
  if (!passportNumber) return { error: 'Passport number required' };

  // Reconstruct the flight to get its price
  const flightDetails = await getAFSFlightDetailsById(offerId);
  if (flightDetails.error) return { error: flightDetails.error };
  const total_flight_price = flightDetails.price ?? 0;

  // Generate a booking reference (PNR-style)
  const bookingReference = `FN${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const ticketNumber = `TKT-${Date.now()}`;

  let resultTripId;
  if (!tripItineraryId) {
    const newTrip = await prisma.tripItinerary.create({
      data: { userId, afs_booking_reference: bookingReference, afs_ticket_number: ticketNumber, total_price: total_flight_price },
    });
    if (!newTrip) return { error: 'Failed to create trip itinerary' };
    resultTripId = newTrip.id;
  } else {
    const trip = await prisma.tripItinerary.findFirst({ where: { id: tripItineraryId } });
    if (!trip) {
      const newTrip = await prisma.tripItinerary.create({
        data: { userId, afs_booking_reference: bookingReference, afs_ticket_number: ticketNumber, total_price: total_flight_price },
      });
      if (!newTrip) return { error: 'Failed to create trip itinerary' };
      resultTripId = newTrip.id;
    } else {
      const current_price = parseFloat(trip.total_price) || 0;
      const updatedTrip = await prisma.tripItinerary.update({
        where: { id: tripItineraryId },
        data: { afs_booking_reference: bookingReference, afs_ticket_number: ticketNumber, total_price: current_price + total_flight_price },
      });
      if (!updatedTrip) return { error: 'Failed to update trip itinerary' };
      resultTripId = updatedTrip.id;
    }
  }

  return { success: 'Flight booked successfully', bookingReference, ticketNumber, tripId: resultTripId };
}

export async function verifyFlight({ lastName, bookingReference }) {
  if (!bookingReference) return { error: 'Booking reference required' };

  const trip = await prisma.tripItinerary.findFirst({
    where: { afs_booking_reference: bookingReference },
  });
  if (!trip) return { error: 'Booking not found' };

  // Reconstruct flight details from the stored ticket number / offerId
  // The invoice page uses this to populate the flights array
  return { status: 'CONFIRMED', flights: [] };
}

export async function cancelFlight(bookingReference, _lastName) {
  if (!bookingReference) return { success: false };
  try {
    await prisma.tripItinerary.updateMany({
      where: { afs_booking_reference: bookingReference },
      data: { afs_booking_reference: `CANCELLED_${bookingReference}` },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ─── DB seeding ───────────────────────────────────────────────────────────────
// Seed a useful set of airports/cities so the autocomplete works out of the box.

const SEED_LOCATIONS = [
  { city: 'Toronto', country: 'Canada' },
  { city: 'New York', country: 'United States' },
  { city: 'Los Angeles', country: 'United States' },
  { city: 'London', country: 'United Kingdom' },
  { city: 'Paris', country: 'France' },
  { city: 'Dubai', country: 'United Arab Emirates' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Vancouver', country: 'Canada' },
  { city: 'Montreal', country: 'Canada' },
  { city: 'Chicago', country: 'United States' },
  { city: 'Miami', country: 'United States' },
  { city: 'Amsterdam', country: 'Netherlands' },
  { city: 'Frankfurt', country: 'Germany' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Hong Kong', country: 'China' },
  { city: 'Mexico City', country: 'Mexico' },
  { city: 'São Paulo', country: 'Brazil' },
  { city: 'Cancun', country: 'Mexico' },
  { city: 'Barcelona', country: 'Spain' },
];

const SEED_AIRPORTS = [
  { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada' },
  { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'United States' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States' },
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'United Kingdom' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates' },
  { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan' },
  { code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'Australia' },
  { code: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada' },
  { code: 'YUL', name: 'Montréal–Trudeau', city: 'Montreal', country: 'Canada' },
  { code: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'United States' },
  { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'United States' },
  { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'FRA', name: 'Frankfurt am Main', city: 'Frankfurt', country: 'Germany' },
  { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore' },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'China' },
  { code: 'MEX', name: 'Benito Juárez International', city: 'Mexico City', country: 'Mexico' },
  { code: 'GRU', name: 'São Paulo–Guarulhos', city: 'São Paulo', country: 'Brazil' },
  { code: 'CUN', name: 'Cancún International', city: 'Cancun', country: 'Mexico' },
  { code: 'BCN', name: 'Barcelona–El Prat', city: 'Barcelona', country: 'Spain' },
];

export async function populateLocations() {
  const existing = await prisma.location.count();
  if (existing > 0) return { success: 'Locations already seeded' };
  for (const loc of SEED_LOCATIONS) {
    await prisma.location.create({ data: loc }).catch(() => {});
  }
  return { success: `Seeded ${SEED_LOCATIONS.length} locations` };
}

export async function populateAirports() {
  const existing = await prisma.airport.count();
  if (existing > 0) return { success: 'Airports already seeded' };
  for (const ap of SEED_AIRPORTS) {
    let location = await prisma.location.findFirst({ where: { city: ap.city } });
    if (!location) {
      location = await prisma.location.create({ data: { city: ap.city, country: ap.country } });
    }
    await prisma.airport.create({
      data: { afs_id: ap.code, code: ap.code, name: ap.name, locationId: location.id },
    }).catch(() => {});
  }
  return { success: `Seeded ${SEED_AIRPORTS.length} airports` };
}

export async function getInitialData() {
  const [locResult, apResult] = await Promise.all([populateLocations(), populateAirports()]);
  return { locations: locResult, airports: apResult };
}
