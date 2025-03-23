import { NextResponse } from "next/server";
import { getAutocomplete } from "../../../utils/get-afs.js";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const cities = searchParams.get("cities") || "";
  const airports = searchParams.get("airports") || "";

  if (!cities && !airports) {
    return NextResponse.json({ error: "Missing cities or airports query" }, { status: 400 });
  }
  if (cities && airports) {
    return NextResponse.json({ error: "Only one query type allowed" }, { status: 400 });
  }

  try {
    const data = await getAutocomplete(cities ? "cities" : "airports");
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 500 });
    }

    if (cities) {
      // sorting code provided by chatgpt
      data.sort((a, b) => a.city.localeCompare(b.city, undefined, { sensitivity: 'base' }));
    } else {
      data.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Error fetching airport data" }, { status: 500 });
  }
}
