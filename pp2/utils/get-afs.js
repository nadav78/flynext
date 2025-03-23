import fs from "fs/promises";
import path from "path";
import querystring from "querystring";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_KEY_FILE = path.join(process.cwd(), "..", "api-keys.txt");
console.log("API_KEY_FILE", API_KEY_FILE);
const BASE_URL = "https://advanced-flights-system.replit.app";

/*
* Retrieves the API key from the api-keys.txt file
* @returns {string} - The API key.
*/
export async function getAPIKey() {
  try {
    const apiKey = await fs.readFile(API_KEY_FILE, "utf-8");
    return apiKey.trim();
  } catch (error) {
    console.error("Error reading API key:", error);
    throw new Error("API key not found. Ensure api-keys.txt exists/key is valid.");
  }
}

/*
* Retrieves flight details from the AFS API
* @param {Object} params - Flight details.
* @param {string} params.origin - The origin city or airport code.
* @param {string} params.destination - The destination city or airport code.
* @param {string} params.departure - The departure date.
* @returns {Object} - Flight details or an error message.
*/
export async function getAFSFlightDetails(params) {
  // check that params are {origin, destination, date}
  const userParams = {
    origin: params.origin,
    destination: params.destination,
    date: params.departure,
  };

  // confirm userparams are valid just in case
  if (!userParams.origin || !userParams.destination || !userParams.date) {
    console.error("Invalid user params:", userParams);
    return { error: "Invalid user params" };
  }

  try {
    const apiKey = await getAPIKey();
    const queryString = querystring.stringify(userParams);
    const url = `${BASE_URL}/api/flights?${queryString}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      console.error("Error fetching flight details:", response.status, response.statusText, await response.text());
      throw new Error(`AFS API error`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching flight details:", error);
    return { error: "Failed to fetch flight details" };
  }
}

/*
* Retrieves autocomplete suggestions for cities or airports from the AFS API
* @param {string} queryType - The type of query to perform. Either "cities" or "airports".
* @returns {Object} - List of (sorted) autocomplete suggestions or an error message.
*/
export async function getAutocomplete(queryType) {
  if (!queryType || (queryType !== "cities" && queryType !== "airports")) {
    console.error("Invalid query type:", queryType);
    return { error: "Invalid query type" };
  }

  try {
    const apiKey = await getAPIKey();
    const url = `${BASE_URL}/api/${queryType === "cities" ? "cities" : "airports"}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`AFS API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    return { error: "Failed to fetch suggestions" };
  }
}

/*
* Books a flight through the AFS API for a logged in user
 * @param {Object} params - User and flight details.
 * @param {string} params.userId - The ID of the user booking the flight.
 * @param {string} params.id - The unique Prisma user ID of the user.
 * @param {string} params.firstName - The flight number.
 * @param {Date} params.lastName - The departure date of the flight.
 * @param {number} params.email - The number of passengers.
 * @param {number} params.passportNumber - The passport number of the passenger.
 * @param {string} params.firstFlightId - The ID of the first flight.
 * @param {string} [params.returnFlightId] - The ID of the return flight 
* @returns {Object} - Success message or error from AFS.
*/
export async function bookFlight(params) {
  const userParams = {
    userId: params.userId,
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    passportNumber: params.passportNumber,
    flightIds: [params.firstFlightId, params.returnFlightId]
  };
  const userDetails = await prisma.user.findFirst({
    where: {
      id: params.id,
      userId: params.userId,
    },
  });

  if (!userDetails) {
    console.error(`Invalid user with ID ${userParams.userId}`);
    return { error: "User not found" };
  }

  if (!userParams.userId) {
    console.error("User ID required to book flight");
    return { error: "User ID required to book flight" };
  }
  if (!userParams.firstName || !userParams.lastName) {
    console.error("First and last name required to book flight");
    return { error: "First and last name required to book flight" };
  }
  if (!userParams.email) {
    console.error("Email required to book flight");
    return { error: "Email required to book flight" };
  }
  if (!userParams.passportNumber) {
    console.error("Passport number required to book flight");
    return { error: "Passport number required to book flight" };
  }
  if (!userParams.firstFlightId) {
    console.error("First flight ID required to book flight");
    return { error: "First flight ID required to book flight" };
  }

  const apiKey = await getAPIKey();
  const url = `${BASE_URL}/api/bookings`;

  const postResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(userParams),
  });

  if (!postResponse.ok) {
    console.error("Error booking flight:", postResponse.status, postResponse.statusText, await postResponse.text());
    return { error: "Failed to book flight" };
  }

  // either 1 or 2 flights in postResponse.flights[0/1].price
  // so add both of them if second exists, otherwise just first one
  const total_price = postResponse.flights[0].price +
    (postResponse.flights[1] ? postResponse.flights[1].price : 0);

  // insert new booking into db
  const booking = await prisma.booking.create({
    data: {
      id: params.id,
      user_id: params.userId,
      afs_booking_reference: postResponse.bookingReference,
      total_price: total_price,
    },
  });

  if (!booking) {
    console.error("Failed to insert booking into database");
    return { error: "Failed to insert booking into database" };
  }
  return await postResponse.json();
}

/*
* Verifies a flight through the AFS API
 * @param {Object} params - Flight details.
 * @param {string} params.lastName - User's last name
 * @param {string} params.bookingReference - Booking reference
 * @returns {Object} - Success message or error from AFS.
*/
export async function verifyFlight(params) {
  const userParams = {
    lastName: params.lastName,
    bookingReference: params.bookingReference,
  };
  if (!userParams.lastName) {
    console.error("Last name required to verify flight");
    return { error: "Last name required to verify flight" };
  }
  if (!userParams.bookingReference) {
    console.error("Booking reference required to verify flight");
    return { error: "Booking reference required to verify flight" };
  }

  const apiKey = await getAPIKey();
  const url = `${BASE_URL}/api/verify`;

  const postResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(userParams),
  });

  if (!postResponse.ok) {
    console.error("Error verifying flight:", postResponse.status, postResponse.statusText, await postResponse.text());
    return { error: "Failed to verify flight" };
  }
  return await postResponse.json();
}


/*
 * Retrieves cities from AFS and populates local db
 * @returns {Object} - Success message or error from AFS.
 */
export async function populateLocations() {
  try {
    const apiKey = await getAPIKey();
    const url = `${BASE_URL}/api/cities`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`AFS API error: ${response.status} ${response.statusText}`);
    }
    const locations = await response.json();

    // insert locations into db
    for (const location of locations) {
      await prisma.location.create({
        data: {
          city: location.city,
          country: location.country
        },
      });
    }
    return { success: "Locations populated successfully" };
  } catch (error) {
    console.error("Error populating locations:", error);
    return { error: "Failed to populate locations" };
  }
}


/*
 * Retrieves airports from AFS and populates local db
 * @returns {Object} - Success message or error from AFS.
 */
export async function populateAirports() {
  try {
    const apiKey = await getAPIKey();
    const url = `${BASE_URL}/api/airports`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`AFS API error: ${response.status} ${response.statusText}`);
    }
    const airports = await response.json();

    // insert airports into db
    for (const airport of airports) {
      await prisma.airport.create({
        data: {
          afs_id: airport.id,
          code: airport.code,
          name: airport.name,
          Location: {
            connect: {
              unique_location: {
                city: airport.city,
                country: airport.country
              }
            }
          }
        },
      });
    }
    return { success: "Airports populated successfully" };
  } catch (error) {
    console.error("Error populating airports:", error);
    return { error: "Failed to populate airports" };
  }
}


export async function getInitialData() {
  try {
    await prisma.airport.deleteMany();
    await prisma.location.deleteMany();

    await populateLocations()
    await populateAirports()

    // console.log("Initial data populated successfully");
    return { success: "Initial data populated successfully" };
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return { error: "Failed to fetch initial data" };
  }
}