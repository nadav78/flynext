/**
 * Some parts of this code were generated with the assistance of GitHub Copilot.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as jose from 'jose'; 

// Universal secret retrieval that works in all environments
function getJwtSecret() {
  return process.env.JWT_SECRET;
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET;
}

export function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email
    },
    getJwtSecret(),
    { expiresIn: '1h' }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      tokenType: 'refresh'
    },
    getRefreshSecret(),
    { expiresIn: '7d' }
  );
}

// node.js-compatible verification (for API routes)
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

// node.js-compatible verification for refresh tokens 
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, getRefreshSecret());
  } catch (error) {
    console.error('Refresh token verification failed:', error.message);
    return null;
  }
}

// Edge-compatible verification (for middleware)
export async function verifyEdgeToken(token) {
  try {
    const secret = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Edge token verification failed:', error.message);
    return null;
  }
}

export async function hashedPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}