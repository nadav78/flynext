import { NextResponse } from "next/server";
import { getAFSFlightDetailsById } from "../../../../utils/get-afs";

export async function GET(request, { params }) {
  // Await the dynamic params object
  const awaitedParams = await params;
  const { id } = awaitedParams;
  
  if (!id) {
    return NextResponse.json({ error: "Flight id is required" }, { status: 400 });
  }
  
  try {
    const flight = await getAFSFlightDetailsById(id);
    
    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }
    
    return NextResponse.json(flight, { status: 200 });
  } catch (error) {
    console.error("Error fetching flight details:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
