/**
 * Amadeus flight API integration
 * Replaces the original AFS (course) API with the free Amadeus Self-Service API.
 * Test credentials: https://developers.amadeus.com (free, no credit card)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'https://test.api.amadeus.com';

// ─── OAuth2 token cache ───────────────────────────────────────────────────────
let tokenCache = { token: null, expiresAt: 0 };

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_CLIENT_ID ?? '',
      client_secret: process.env.AMADEUS_CLIENT_SECRET ?? '',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Amadeus auth failed: ${err}`);
  }
  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenCache.token;
}

// ─── In-memory offer cache (offerId → { offer, dictionaries }) ────────────────
const offerCache = new Map();

function cacheOffer(offer, dictionaries) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  offerCache.set(id, { offer, dictionaries });
  // prevent unbounded growth
  if (offerCache.size > 500) offerCache.delete(offerCache.keys().next().value);
  return id;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function parseDurationMins(iso = '') {
  const h = parseInt(iso.match(/(\d+)H/)?.[1] ?? '0', 10);
  const m = parseInt(iso.match(/(\d+)M/)?.[1] ?? '0', 10);
  return h * 60 + m;
}

function buildFlight(segment, offerId, price, currency, seats, dictionaries) {
  const loc = dictionaries?.locations ?? {};
  return {
    id: offerId,
    flightNumber: `${segment.carrierCode}${segment.number}`,
    departureTime: segment.departure.at,
    arrivalTime: segment.arrival.at,
    duration: parseDurationMins(segment.duration),
    price: parseFloat(price) || 0,
    currency: currency ?? 'USD',
    status: 'SCHEDULED',
    availableSeats: seats ?? 9,
    airline: {
      code: segment.carrierCode,
      name: dictionaries?.carriers?.[segment.carrierCode] ?? segment.carrierCode,
    },
    origin: {
      code: segment.departure.iataCode,
      name: segment.departure.iataCode,
      city: loc[segment.departure.iataCode]?.cityCode ?? segment.departure.iataCode,
      country: loc[segment.departure.iataCode]?.countryCode ?? '',
    },
    destination: {
      code: segment.arrival.iataCode,
      name: segment.arrival.iataCode,
      city: loc[segment.arrival.iataCode]?.cityCode ?? segment.arrival.iataCode,
      country: loc[segment.arrival.iataCode]?.countryCode ?? '',
    },
  };
}

// ─── Flight search ────────────────────────────────────────────────────────────
export async function getAFSFlightDetails({ origin, destination, departure }) {
  if (!origin || !destination || !departure) return { error: 'Missing search params' };
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departure,
      adults: '1',
      max: '20',
    });
    const res = await fetch(`${BASE_URL}/v2/shopping/flight-offers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.errors?.[0]?.detail ?? 'Failed to search flights' };
    }
    const data = await res.json();
    const results = (data.data ?? []).map(offer => {
      const offerId = cacheOffer(offer, data.dictionaries);
      const itinerary = offer.itineraries[0];
      return {
        legs: itinerary.segments.length,
        flights: itinerary.segments.map(seg =>
          buildFlight(seg, offerId, offer.price.total, offer.price.currency, offer.numberOfBookableSeats, data.dictionaries)
        ),
      };
    });
    return { results };
  } catch (err) {
    console.error('Flight search error:', err.message);
    return { error: 'Failed to search flights' };
  }
}

// ─── Single flight lookup (by cached offer ID) ────────────────────────────────
export async function getAFSFlightDetailsById(offerId) {
  const cached = offerCache.get(offerId);
  if (!cached) return { error: 'Flight not found — offer may have expired. Please search again.' };
  const { offer, dictionaries } = cached;
  const seg = offer.itineraries[0].segments[0];
  return buildFlight(seg, offerId, offer.price.total, offer.price.currency, offer.numberOfBookableSeats, dictionaries);
}

// ─── Autocomplete (reads from local DB seeded on first run) ───────────────────
export async function getAutocomplete(queryType) {
  try {
    if (queryType === 'cities') {
      return await prisma.location.findMany({ take: 300 });
    }
    return await prisma.airport.findMany({ take: 300 });
  } catch {
    return [];
  }
}

// ─── Book flight ──────────────────────────────────────────────────────────────
export async function bookFlight(
  { userId, firstName, lastName, email, passportNumber, flightIds },
  tripItineraryId
) {
  const offerId = flightIds[0];
  const cached = offerCache.get(offerId);
  if (!cached) {
    return { error: 'Flight offer has expired. Please go back and select your flight again.' };
  }
  const { offer } = cached;

  const userDetails = await prisma.user.findFirst({ where: { id: userId } });
  if (!userDetails) return { error: 'User not found' };
  if (!firstName || !lastName) return { error: 'First and last name required' };
  if (!email) return { error: 'Email required' };
  if (!passportNumber) return { error: 'Passport number required' };

  try {
    const token = await getToken();

    // Amadeus requires a pricing call before creating an order
    const priceRes = await fetch(`${BASE_URL}/v1/shopping/flight-offers/pricing`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { type: 'flight-offers-pricing', flightOffers: [offer] } }),
    });
    if (!priceRes.ok) {
      const err = await priceRes.json().catch(() => ({}));
      return { error: err.errors?.[0]?.detail ?? 'Failed to confirm flight price' };
    }
    const priceData = await priceRes.json();
    const pricedOffer = priceData.data.flightOffers[0];
    const total_flight_price = parseFloat(pricedOffer.price.total);

    // Create the booking
    const bookRes = await fetch(`${BASE_URL}/v1/booking/flight-orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          type: 'flight-order',
          flightOffers: [pricedOffer],
          travelers: [{
            id: '1',
            dateOfBirth: '1990-01-01',
            name: { firstName, lastName },
            gender: 'MALE',
            contact: {
              emailAddress: email,
              phones: [{ deviceType: 'MOBILE', countryCallingCode: '1', number: '5550000000' }],
            },
            documents: [{
              documentType: 'PASSPORT',
              birthPlace: 'Toronto',
              issuanceLocation: 'Toronto',
              issuanceDate: '2015-04-14',
              number: String(passportNumber),
              expiryDate: '2030-01-01',
              issuanceCountry: 'CA',
              validityCountry: 'CA',
              nationality: 'CA',
              holder: true,
            }],
          }],
        },
      }),
    });
    if (!bookRes.ok) {
      const err = await bookRes.json().catch(() => ({}));
      return { error: err.errors?.[0]?.detail ?? 'Booking failed' };
    }
    const bookData = await bookRes.json();
    const orderId = bookData.data.id;
    // Amadeus order ID is the primary reference; GDS PNR stored as associatedRecord
    const bookingReference = orderId;
    const ticketNumber = bookData.data.associatedRecords?.[0]?.reference ?? orderId;

    // Persist TripItinerary
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
        if (trip.afs_booking_reference) {
          await cancelFlight(trip.afs_booking_reference, lastName);
        }
        resultTripId = updatedTrip.id;
      }
    }
    return { success: 'Flight booked successfully', bookingReference, ticketNumber, tripId: resultTripId };
  } catch (err) {
    console.error('Booking error:', err.message);
    return { error: 'Booking failed: ' + err.message };
  }
}

// ─── Verify booking ───────────────────────────────────────────────────────────
export async function verifyFlight({ lastName, bookingReference }) {
  if (!bookingReference) return { error: 'Booking reference required' };
  try {
    const token = await getToken();
    const res = await fetch(
      `${BASE_URL}/v1/booking/flight-orders/${encodeURIComponent(bookingReference)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return { error: 'Failed to verify booking' };
    const data = await res.json();

    // Map Amadeus order segments → the flight shape the invoice page expects
    const flightOffers = data.data?.flightOffers ?? [];
    const dictionaries = data.dictionaries ?? {};
    const flights = [];
    for (const fo of flightOffers) {
      for (const itinerary of (fo.itineraries ?? [])) {
        for (const segment of (itinerary.segments ?? [])) {
          flights.push(buildFlight(segment, bookingReference, fo.price?.total ?? '0', fo.price?.currency ?? 'USD', null, dictionaries));
        }
      }
    }
    return { status: 'CONFIRMED', flights };
  } catch {
    return { error: 'Failed to verify booking' };
  }
}

// ─── Cancel flight ────────────────────────────────────────────────────────────
export async function cancelFlight(bookingReference, _lastName) {
  if (!bookingReference) return { success: false };
  try {
    const token = await getToken();
    const res = await fetch(
      `${BASE_URL}/v1/booking/flight-orders/${encodeURIComponent(bookingReference)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: res.status === 200 || res.status === 204 };
  } catch {
    return { success: false };
  }
}

// ─── DB seeding ───────────────────────────────────────────────────────────────
// These seed the Location and Airport tables on first startup using the
// Amadeus reference-data API so the autocomplete works.

export async function populateLocations() {
  const existing = await prisma.location.count();
  if (existing > 0) return { success: 'Locations already seeded' };
  try {
    const token = await getToken();
    const res = await fetch(
      `${BASE_URL}/v1/reference-data/locations?subType=CITY&view=LIGHT&max=250`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return { error: 'Failed to fetch locations' };
    const data = await res.json();
    for (const loc of (data.data ?? [])) {
      const city = loc.address?.cityName ?? loc.name ?? '';
      const country = loc.address?.countryName ?? '';
      if (!city) continue;
      await prisma.location.upsert({
        where: { unique_location: { city, country } },
        update: {},
        create: { city, country },
      }).catch(() => {});
    }
    return { success: `Seeded ${data.data?.length ?? 0} locations` };
  } catch (err) {
    return { error: 'Failed to populate locations: ' + err.message };
  }
}

export async function populateAirports() {
  const existing = await prisma.airport.count();
  if (existing > 0) return { success: 'Airports already seeded' };
  try {
    const token = await getToken();
    const res = await fetch(
      `${BASE_URL}/v1/reference-data/locations?subType=AIRPORT&view=LIGHT&max=250`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return { error: 'Failed to fetch airports' };
    const data = await res.json();
    for (const ap of (data.data ?? [])) {
      const city = ap.address?.cityName ?? '';
      const country = ap.address?.countryName ?? '';
      let location = await prisma.location.findFirst({ where: { city, country } });
      if (!location) {
        location = await prisma.location.create({ data: { city, country } }).catch(() => null);
      }
      if (!location) continue;
      await prisma.airport.create({
        data: { afs_id: ap.iataCode, code: ap.iataCode, name: ap.name, locationId: location.id },
      }).catch(() => {});
    }
    return { success: `Seeded ${data.data?.length ?? 0} airports` };
  } catch (err) {
    return { error: 'Failed to populate airports: ' + err.message };
  }
}

export async function getInitialData() {
  const [locResult, apResult] = await Promise.all([populateLocations(), populateAirports()]);
  return { locations: locResult, airports: apResult };
}
