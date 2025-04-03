export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken');
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      // Handle 401 Unauthorized (token expired)
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshToken();
        
        if (refreshed) {
          // Retry the request with new token
          return fetchWithAuth(url, options);
        } else {
          // Redirect to login if refresh failed
          window.location.href = '/login';
        }
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  async function refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      return false;
    }
    
    try {
      const response = await fetch('/api/users/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (!response.ok) {
        // If refresh fails, clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return false;
      }
      
      const data = await response.json();
      
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }