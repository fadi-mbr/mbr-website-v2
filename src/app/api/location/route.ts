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
      embedUrl: `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3609.7896!2d${data.result.geometry.location.lng}!3d${data.result.geometry.location.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${encodeURIComponent(data.result.name)}!5e0!3m2!1sen!2sae`
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
        embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3609.7896!2d55.2250031!3d25.1389859!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6b71675d0d27%3A0x1d4e82b5f02b40f1!2sMBR%20Auto%20Services!5e0!3m2!1sen!2sae"
      },
      error: error instanceof Error ? error.message : 'Failed to fetch location data',
      fallback: true
    });
  }
}