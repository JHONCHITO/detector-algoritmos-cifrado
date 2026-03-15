// API Route - Proxy to Render Backend
// This route acts as a bridge between frontend and Render backend
// Solves CORS issues and wake-up delays

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://wine-classifier-backend.onrender.com';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();

    // Make request to Render backend
    const response = await fetch(`${BACKEND_URL}/api/crypto/predict-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check if response is ok
    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get response data
    const data = await response.json();

    // Return the data to frontend
    return NextResponse.json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
