/**
 * API Service for Digital Library
 * Handles all HTTP requests with caching, retries, and error handling
 */
export class ApiService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.abortControllers = new Map();
    this.retryDelays = [1000, 2000, 4000]; // Exponential backoff
    
    // Bind methods
    this.request = this.request.bind(this);
  }

  /**
   * Make HTTP request with automatic retries and caching
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const requestId = `${method}_${url}_${JSON.stringify(options.body || {})}`;
    
    // Cancel previous identical request
    if (this.abortControllers.has(requestId)) {
      this.abortControllers.get(requestId).abort();
    }
    
    // Check cache for GET requests
    if (method === 'GET' && this.cache.has(url)) {
      const cached = this.cache.get(url);
      const age = Date.now() - cached.timestamp;
      const maxAge = options.cacheTime || 5 * 60 * 1000; // 5 minutes default
      
      if (age < maxAge) {
        console.log('📋 Cache hit:', url);
        return cached.data;
      }
    }
    
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal,
      ...options
    };
    
    if (options.body && method !== 'GET') {
      config.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body);
    }

    // Retry logic
    let lastError;
    for (let attempt = 0; attempt <= this.retryDelays.length; attempt++) {
      try {
        console.log(`🌐 ${method} ${url}${attempt > 0 ? ` (retry ${attempt})` : ''}`);
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
          throw new ApiError(response.status, response.statusText, await this.parseErrorResponse(response));
        }
        
        const data = await response.json();
        
        // Cache successful GET requests
        if (method === 'GET') {
          this.cache.set(url, { 
            data, 
            timestamp: Date.now() 
          });
        }
        
        return data;
        
      } catch (error) {
        lastError = error;
        
        // Don't retry if request was aborted
        if (error.name === 'AbortError') {
          throw error;
        }
        
        // Don't retry client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === this.retryDelays.length) {
          break;
        }
        
        // Wait before retry
        await this.delay(this.retryDelays[attempt]);
      }
    }
    
    // Cleanup
    this.abortControllers.delete(requestId);
    throw lastError;
  }

  /**
   * Parse error response body
   * @param {Response} response - Fetch response
   * @returns {Promise<Object>} Error details
   */
  async parseErrorResponse(response) {
    try {
      return await response.json();
    } catch {
      return { message: response.statusText };
    }
  }

  /**
   * Delay helper for retries
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === Books API ===
  
  /**
   * Get books with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Books response with pagination
   */
  async getBooks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/books${query ? `?${query}` : ''}`);
  }

  /**
   * Search books
   * @param {string} q - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Search results
   */
  async searchBooks(q, filters = {}) {
    const params = { q, ...filters };
    return this.getBooks(params);
  }

  /**
   * Get single book by ID
   * @param {string} id - Book ID
   * @returns {Promise<Object>} Book data
   */
  async getBook(id) {
    return this.request(`/books/${id}`);
  }

  /**
   * Create new book
   * @param {Object} book - Book data
   * @returns {Promise<Object>} Created book
   */
  async createBook(book) {
    return this.request('/books', {
      method: 'POST',
      body: book
    });
  }

  /**
   * Update existing book
   * @param {string} id - Book ID
   * @param {Object} updates - Book updates
   * @returns {Promise<Object>} Updated book
   */
  async updateBook(id, updates) {
    return this.request(`/books/${id}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete book
   * @param {string} id - Book ID
   * @returns {Promise<void>}
   */
  async deleteBook(id) {
    return this.request(`/books/${id}`, {
      method: 'DELETE'
    });
  }

  // === Users API ===
  
  /**
   * Get all users
   * @returns {Promise<Array>} Users array
   */
  async getUsers() {
    return this.request('/users');
  }

  /**
   * Get single user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} User data
   */
  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  /**
   * Create new user
   * @param {Object} user - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(user) {
    return this.request('/users', {
      method: 'POST',
      body: user
    });
  }

  /**
   * Update existing user
   * @param {string} id - User ID
   * @param {Object} updates - User updates
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(id, updates) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // === Loans API ===
  
  /**
   * Get all loans
   * @returns {Promise<Array>} Loans array
   */
  async getLoans() {
    return this.request('/loans');
  }

  /**
   * Get single loan by ID
   * @param {string} id - Loan ID
   * @returns {Promise<Object>} Loan data
   */
  async getLoan(id) {
    return this.request(`/loans/${id}`);
  }

  /**
   * Create new loan
   * @param {Object} loan - Loan data
   * @returns {Promise<Object>} Created loan
   */
  async createLoan(loan) {
    return this.request('/loans', {
      method: 'POST',
      body: loan
    });
  }

  /**
   * Return a loan
   * @param {string} id - Loan ID
   * @returns {Promise<Object>} Updated loan
   */
  async returnLoan(id) {
    return this.request(`/loans/${id}/return`, {
      method: 'POST'
    });
  }

  // === Statistics API ===
  
  /**
   * Get library statistics
   * @returns {Promise<Object>} Statistics data
   */
  async getStatistics() {
    return this.request('/statistics', {
      cacheTime: 2 * 60 * 1000 // Cache for 2 minutes
    });
  }

  // === Utility Methods ===
  
  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ API cache cleared');
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    console.log('🚫 All requests cancelled');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalSize: JSON.stringify(Array.from(this.cache.values())).length
    };
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(status, statusText, details = {}) {
    super(details.message || statusText);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.details = details;
  }

  /**
   * Check if error is a network error
   * @returns {boolean}
   */
  isNetworkError() {
    return this.status >= 500 || this.status === 0;
  }

  /**
   * Check if error is a client error
   * @returns {boolean}
   */
  isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Get user-friendly error message
   * @returns {string}
   */
  getUserMessage() {
    if (this.isNetworkError()) {
      return 'Errore di connessione. Riprova più tardi.';
    }
    
    if (this.status === 404) {
      return 'Risorsa non trovata.';
    }
    
    if (this.status === 403) {
      return 'Accesso negato.';
    }
    
    if (this.status === 401) {
      return 'Autenticazione richiesta.';
    }
    
    return this.details.message || this.message || 'Errore sconosciuto.';
  }
}
