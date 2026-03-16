/**
 * Seed script — populates demo hotels with room types.
 * Run with: node prisma/seed.js
 *
 * Creates a system "hotel-owner" account (email: owner@flynext.com, password: owner123)
 * and 10 hotels across the seeded cities.
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// Simple password hash matching the app's auth utility
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

const HOTELS = [
  {
    name: 'The Manhattan Grand',
    city: 'New York',
    address: '123 Fifth Avenue, New York, NY',
    star_rating: 5,
    description: 'A luxury hotel in the heart of Manhattan with stunning skyline views.',
    website: 'https://manhattangrand.example.com',
    contact_email: 'info@manhattangrand.example.com',
    contact_phone: '+1-212-555-0101',
    rooms: [
      { name: 'Standard Room', price: 299, count: 30 },
      { name: 'Deluxe Suite', price: 549, count: 15 },
      { name: 'Penthouse', price: 1200, count: 3 },
    ],
  },
  {
    name: 'New York Budget Inn',
    city: 'New York',
    address: '45 West 34th Street, New York, NY',
    star_rating: 3,
    description: 'Comfortable and affordable rooms steps from the Empire State Building.',
    website: 'https://nybudgetinn.example.com',
    contact_email: 'stay@nybudgetinn.example.com',
    contact_phone: '+1-212-555-0102',
    rooms: [
      { name: 'Single Room', price: 119, count: 50 },
      { name: 'Double Room', price: 159, count: 40 },
    ],
  },
  {
    name: 'Toronto Lakefront Hotel',
    city: 'Toronto',
    address: '1 Harbour Square, Toronto, ON',
    star_rating: 4,
    description: 'Waterfront hotel with panoramic views of Lake Ontario.',
    website: 'https://torontolakefront.example.com',
    contact_email: 'reservations@torontolakefront.example.com',
    contact_phone: '+1-416-555-0201',
    rooms: [
      { name: 'Lake View Room', price: 229, count: 40 },
      { name: 'Executive Suite', price: 399, count: 10 },
    ],
  },
  {
    name: 'London Royal Court',
    city: 'London',
    address: '10 Buckingham Gate, London',
    star_rating: 5,
    description: 'Classic British luxury near Buckingham Palace.',
    website: 'https://londonroyalcourt.example.com',
    contact_email: 'concierge@londonroyalcourt.example.com',
    contact_phone: '+44-20-5550-0301',
    rooms: [
      { name: 'Classic Room', price: 349, count: 25 },
      { name: 'Junior Suite', price: 599, count: 12 },
      { name: 'Royal Suite', price: 1500, count: 2 },
    ],
  },
  {
    name: 'Paris Montmartre Boutique',
    city: 'Paris',
    address: '18 Rue Lepic, Montmartre, Paris',
    star_rating: 4,
    description: 'Charming boutique hotel in the artistic Montmartre neighbourhood.',
    website: 'https://parismontmartre.example.com',
    contact_email: 'bonjour@parismontmartre.example.com',
    contact_phone: '+33-1-5550-0401',
    rooms: [
      { name: 'Cozy Room', price: 199, count: 20 },
      { name: 'Artist Suite', price: 329, count: 8 },
    ],
  },
  {
    name: 'Dubai Desert Palace',
    city: 'Dubai',
    address: 'Sheikh Zayed Road, Dubai',
    star_rating: 5,
    description: 'Ultra-luxury resort with private beach and infinity pool.',
    website: 'https://dubaidesertpalace.example.com',
    contact_email: 'welcome@dubaidesertpalace.example.com',
    contact_phone: '+971-4-555-0501',
    rooms: [
      { name: 'Deluxe Room', price: 499, count: 60 },
      { name: 'Ocean Suite', price: 999, count: 20 },
      { name: 'Royal Villa', price: 3000, count: 5 },
    ],
  },
  {
    name: 'Tokyo Zen Garden Hotel',
    city: 'Tokyo',
    address: '2-chome Shinjuku, Tokyo',
    star_rating: 4,
    description: 'Modern hotel blending Japanese minimalism with Western comfort.',
    website: 'https://tokyozengarden.example.com',
    contact_email: 'info@tokyozengarden.example.com',
    contact_phone: '+81-3-5550-0601',
    rooms: [
      { name: 'Tatami Room', price: 189, count: 15 },
      { name: 'Western Room', price: 219, count: 35 },
      { name: 'Sakura Suite', price: 450, count: 6 },
    ],
  },
  {
    name: 'Sydney Harbour View',
    city: 'Sydney',
    address: '7 Circular Quay, Sydney NSW',
    star_rating: 4,
    description: 'Stunning views of the Sydney Opera House and Harbour Bridge.',
    website: 'https://sydneyharbourview.example.com',
    contact_email: 'stay@sydneyharbourview.example.com',
    contact_phone: '+61-2-5550-0701',
    rooms: [
      { name: 'Garden Room', price: 209, count: 30 },
      { name: 'Harbour View Room', price: 319, count: 20 },
      { name: 'Penthouse Suite', price: 750, count: 4 },
    ],
  },
  {
    name: 'Barcelona Beach Club',
    city: 'Barcelona',
    address: 'Passeig Marítim 12, Barcelona',
    star_rating: 4,
    description: 'Stylish hotel steps from Barceloneta beach.',
    website: 'https://barcelonabeachclub.example.com',
    contact_email: 'hola@barcelonabeachclub.example.com',
    contact_phone: '+34-93-555-0901',
    rooms: [
      { name: 'Standard Room', price: 179, count: 40 },
      { name: 'Sea View Room', price: 259, count: 20 },
      { name: 'Rooftop Suite', price: 499, count: 5 },
    ],
  },
  {
    name: 'Singapore Skyline Hotel',
    city: 'Singapore',
    address: '1 Marina Boulevard, Singapore',
    star_rating: 5,
    description: 'Iconic tower hotel in the Marina Bay financial district.',
    website: 'https://singaporeskyline.example.com',
    contact_email: 'reservations@singaporeskyline.example.com',
    contact_phone: '+65-6555-1001',
    rooms: [
      { name: 'City Room', price: 279, count: 50 },
      { name: 'Marina Suite', price: 599, count: 15 },
      { name: 'Sky Villa', price: 1800, count: 3 },
    ],
  },
];

async function main() {
  console.log('Seeding hotels...');

  // Create or find the system hotel owner account
  let owner = await prisma.user.findFirst({ where: { email: 'owner@flynext.com' } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        email: 'owner@flynext.com',
        password: hashPassword('owner123'),
        first_name: 'Hotel',
        last_name: 'Owner',
      },
    });
    console.log('Created system hotel owner account (owner@flynext.com / owner123)');
  }

  let created = 0;
  for (const h of HOTELS) {
    // Skip if a hotel with this name already exists
    const existing = await prisma.hotel.findFirst({ where: { name: h.name } });
    if (existing) {
      console.log(`  Skipping "${h.name}" (already exists)`);
      continue;
    }

    const location = await prisma.location.findFirst({
      where: { city: { equals: h.city, mode: 'insensitive' } },
    });
    if (!location) {
      console.log(`  Skipping "${h.name}" — city "${h.city}" not in DB`);
      continue;
    }

    const hotel = await prisma.hotel.create({
      data: {
        name: h.name,
        address: h.address,
        star_rating: h.star_rating,
        description: h.description,
        website: h.website,
        contact_email: h.contact_email,
        contact_phone: h.contact_phone,
        ownerId: owner.id,
        locationId: location.id,
      },
    });

    for (const room of h.rooms) {
      await prisma.hotelRoomType.create({
        data: {
          hotelId: hotel.id,
          name: room.name,
          price_per_night: room.price,
          room_count: room.count,
        },
      });
    }

    console.log(`  Created "${h.name}" (${h.city}) with ${h.rooms.length} room types`);
    created++;
  }

  console.log(`\nDone — ${created} hotels seeded.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
