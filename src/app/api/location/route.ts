import { NextResponse } from 'next/server';

interface GooglePlaceDetails {
  result: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
    name: string;
    place_id: string;
    url: string;
  };
  status: string;
}

const PLACE_ID = process.env.GOOGLE_PLACE_ID;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET() {
  try {
    if (!PLACE_ID || !API_KEY) {
      throw new Error('Google Places API configuration missing');
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=geometry,formatted_address,name,place_id,url&key=${API_KEY}`;

    const response = await fetch(url);
    const data: GooglePlaceDetails = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const locationData = {
      name: data.result.name,
      address: data.result.formatted_address,
      coordinates: {
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng
      },
      placeId: data.result.place_id,
      googleMapsUrl: data.result.url || `https://maps.app.goo.gl/P7vgB2XDpeRCMaH3A`,
      embedUrl: `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=place_id:${data.result.place_id}&zoom=15`
    };

    return NextResponse.json({
      success: true,
      data: locationData
    });

  } catch (error) {
    console.error('Location API error:', error);

    // Fallback data with the correct Google Maps link
    return NextResponse.json({
      success: false,
      data: {
        name: "MBR Auto Services",
        address: "Al Quoz Industrial Area 4, Dubai, UAE",
        coordinates: {
          lat: 25.1389859,
          lng: 55.2250031
        },
        placeId: PLACE_ID,
        googleMapsUrl: "https://maps.app.goo.gl/P7vgB2XDpeRCMaH3A",
        embedUrl: `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=place_id:${PLACE_ID}&zoom=15`
      },
      error: error instanceof Error ? error.message : 'Failed to fetch location data',
      fallback: true
    });
  }
}