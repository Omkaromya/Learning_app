// src/services/api.js
const API_BASE_URL = 'http://127.0.0.1:8000';

// Token expiration time in minutes (matching backend)
const TOKEN_EXPIRY_MINUTES = 30;

// Function to check if token is expired or about to expire
const isTokenExpired = () => {
  const tokenExpiryTime = localStorage.getItem('token_expiry_time') || sessionStorage.getItem('token_expiry_time');
  if (!tokenExpiryTime) return true;
  
  // Check if token is expired or will expire in the next 5 minutes
  const expiryTime = parseInt(tokenExpiryTime);
  const currentTime = Date.now();
  const fiveMinutesInMs = 5 * 60 * 1000;
  
  return currentTime >= expiryTime - fiveMinutesInMs;
};

// Function to get token from storage
const getTokenFromStorage = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

// Function to get refresh token from storage
const getRefreshTokenFromStorage = () => {
  return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
};

// Common headers for all requests
export const getCommonHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (includeAuth) {
    const token = getTokenFromStorage();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Common fetch options
export const getFetchOptions = (method, body = null, includeAuth = true) => {
  const options = {
    method,
    headers: getCommonHeaders(includeAuth),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
};

// Add a wrapper function for fetch to handle CORS errors
export const fetchWithCorsHandling = async (url, options) => {
  try {
    const response = await fetch(url, options);
    
    // Check if the response is a CORS error
    if (!response.ok && response.type === 'opaque') {
      throw new Error('CORS error: Unable to access the resource');
    }
    
    return response;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check if the server is running.');
    }
    throw error;
  }
};

// Function to refresh token
export const refreshToken = async () => {
  try {
    const refreshToken = getRefreshTokenFromStorage();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const formData = new URLSearchParams();
    formData.append('refresh_token', refreshToken);

    const response = await fetch(`${API_BASE_URL}/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    // Store in the same storage as the original token
    const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
    storage.setItem('access_token', data.access_token);
    
    // Set token expiry time (30 minutes from now)
    const expiryTime = Date.now() + (TOKEN_EXPIRY_MINUTES * 60 * 1000);
    storage.setItem('token_expiry_time', expiryTime.toString());
    
    return data.access_token;
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear tokens on refresh failure
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry_time');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token_expiry_time');
    throw error;
  }
};

// Function to get a valid access token (refreshes if needed)
export const getValidAccessToken = async () => {
  if (isTokenExpired()) {
    return await refreshToken();
  }
  return localStorage.getItem('access_token');
};

export const registerUser = async (userData) => {
  try {
    const response = await fetchWithCorsHandling(
      `${API_BASE_URL}/auth/register`, 
      getFetchOptions('POST', {
        email: userData.email,
        username: userData.username,
        password: userData.password,
        password_confirm: userData.confirmPassword,
        role: userData.role.toUpperCase()
      }, false)
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Registration failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetchWithCorsHandling(
      `${API_BASE_URL}/auth/login`,
      getFetchOptions('POST', {
        email: credentials.email,
        password: credentials.password
      }, false)
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    
    const expiryTime = Date.now() + (TOKEN_EXPIRY_MINUTES * 60 * 1000);
    localStorage.setItem('token_expiry_time', expiryTime.toString());
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const accessToken = await getValidAccessToken();
    const response = await fetchWithCorsHandling(
      `${API_BASE_URL}/users/me/`,
      getFetchOptions('GET')
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch user error:', error);
    throw error;
  }
};

export const setupTokenRefresh = () => {
  
  setInterval(async () => {
    try {
      if (isTokenExpired()) {
        await refreshToken();
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      
    }
  }, 5 * 60 * 1000); 
};


