/**
 * Authentication middleware for protected routes
 * Created with assistance from Claude 3.7 Sonnet
 */

import { NextResponse } from 'next/server';
import { verifyEdgeToken } from './utils/auth';

// define protected paths that require authentication
const protectedPaths = [
  '/api/users/profile',
  '/api/users/logout',
  '/api/users/notifications',
  '/api/users/change-password',
  '/api/flights/book',
  '/api/flights/verify',
  '/api/hotels',     
  '/api/booking',  
  '/api/trips',   
  '/api/invoice',    
];

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // check if current path needs authentication
  if (protectedPaths.some(protectedPath => path.startsWith(protectedPath))) {
    // get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // extract and verify token
    const token = authHeader.split(' ')[1];
    const decodedToken = await verifyEdgeToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // clone the headers and add user id
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decodedToken.userId);
    
    // forward the request with the modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/users/profile', // Exact match for the root endpoint
    '/api/users/profile/:path*', // Match for any sub-paths
    '/api/users/logout',
    '/api/users/logout/:path*',
    '/api/users/notifications',
    '/api/users/change-password',
    '/api/hotels',         
    '/api/hotels/:path*',  
    '/api/booking',       
    '/api/booking/:path*',
    '/api/trips',
    '/api/trips/:path*',
    '/api/invoice',
    '/api/invoice/:path*',
  ],
};