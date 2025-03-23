import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location info');
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results[0]) {
      throw new Error('No location data found');
    }

    const addressComponents = data.results[0].address_components;
    let city = '';
    let country = '';
    let countryCode = '';

    for (const component of addressComponents) {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('country')) {
        country = component.long_name;
        countryCode = component.short_name;
      }
    }

    return NextResponse.json({
      city,
      country,
      countryCode
    });
  } catch (error) {
    console.error('Error getting location info:', error);
    return NextResponse.json(
      { error: 'Failed to get location information' },
      { status: 500 }
    );
  }
}
