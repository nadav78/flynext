'use client';

/**
 * Wrapper around fetch that automatically refreshes the access token on 401
 * and retries the request once with the new token.
 */
export async function fetchWithAuth(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status !== 401) return response;

  // Try to refresh
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return response;

  const refreshRes = await fetch('/api/users/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshRes.ok) return response;

  const { accessToken } = await refreshRes.json();
  localStorage.setItem('accessToken', accessToken);

  // Retry with new token
  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
