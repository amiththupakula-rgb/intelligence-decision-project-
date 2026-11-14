let rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// On deployed hosting (e.g. Vercel), ensure we never try to call local port 5000 from client
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  if (rawBaseUrl.includes('localhost') || rawBaseUrl.includes('127.0.0.1')) {
    rawBaseUrl = '/api/v1';
  }
}

const BASE_URL = rawBaseUrl;

class ApiClient {
  getToken() {
    return localStorage.getItem('id_token') || 'demo-token';
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('id_token', token);
    } else {
      localStorage.removeItem('id_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check content-type for binary / CSV downloads
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) {
      return response.text();
    }

    let data;
    try {
      data = await response.json();
    } catch {
      data = { success: false, message: 'Invalid response format from server' };
    }

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.code = data.code;
      error.details = data.details || [];
      throw error;
    }

    return data;
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  upload(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiClient();
