// app/api/premium/weather/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // This code only runs AFTER payment is verified and settled
    
    const weatherData = {
      location: 'San Francisco',
      temperature: 72,
      condition: 'Sunny',
      humidity: 65,
      windSpeed: 10,
      forecast: [
        { day: 'Monday', high: 73, low: 58, condition: 'Partly Cloudy' },
        { day: 'Tuesday', high: 70, low: 55, condition: 'Rainy' },
        { day: 'Wednesday', high: 75, low: 60, condition: 'Sunny' },
        { day: 'Thursday', high: 74, low: 59, condition: 'Sunny' },
        { day: 'Friday', high: 71, low: 56, condition: 'Cloudy' },
        { day: 'Saturday', high: 72, low: 57, condition: 'Partly Cloudy' },
        { day: 'Sunday', high: 76, low: 61, condition: 'Sunny' }
      ],
      premium: true,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(weatherData);
  } catch (error: any) {
    console.error('Error in weather API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
