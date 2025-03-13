import { NextRequest, NextResponse } from 'next/server';

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  return response;
}

// Simple health check endpoint to verify ngrok is working
export async function GET() {
  console.log('Health check GET request received');
  
  return addCorsHeaders(
    NextResponse.json({
      status: 'ok',
      message: 'API is functioning correctly',
      timestamp: new Date().toISOString()
    })
  );
}

// CORS preflight handler
export async function OPTIONS() {
  console.log('Health check OPTIONS request received');
  
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
} 