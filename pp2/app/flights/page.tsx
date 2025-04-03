// app/flights/page.tsx
import React from "react";
import FlightsForm from "@/components/FlightsForm";
import { PrismaClient } from "@prisma/client";
import Navbar from "@/components/Navbar";

const prisma = new PrismaClient();

export type Airport = {
  id: number;
  code: string;
  name: string;
  city: string;
  country: string;
};

async function getAirports(): Promise<Airport[]> {
  const airports = await prisma.airport.findMany({
    include: { Location: true },
    orderBy: { code: "asc" },
  });
  return airports.map((airport) => ({
    id: airport.id,
    code: airport.code,
    name: airport.name,
    city: airport.Location.city,
    country: airport.Location.country,
  }));
}

export default async function FlightsPage() {
  const airports = await getAirports();

  return (
    <main className="flex flex-col min-h-screen min-w-screen bg-base-200">
      <Navbar />
      <div className="flex flex-col min-h-screen items-center justify-center w-full px-4">
        <FlightsForm airports={airports} />
      </div>
    </main>
  );
}
