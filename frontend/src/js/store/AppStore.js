/**
 * Application State Store
 * Simple reactive state management with subscription pattern
 */
export class AppStore {
  constructor() {
    this.state = {
      // Data
      books: [],
      users: [],
      loans: [],
      stats: {
        totalBooks: 0,
        availableBooks: 0,
        totalUsers: 0,
        activeLoans: 0,
        overdueLoans: 0
      },
      
      // UI State
      loading: false,
      error: null,
      theme: 'light',
      searchQuery: '',
      currentPage: 0,
      pageSize: 20,
      sortBy: 'title',
      filterBy: 'all',
      
      // App State
      hasUnsavedChanges: false,
      isOnline: navigator.onLine,
      notifications: []
    };
    
    this.listeners = new Map();
    this.middleware = [];
    
    // Bind methods
    this.dispatch = this.dispatch.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.getState = this.getState.bind(this);
  }

  /**
   * Subscribe to state changes
   * @param {string|string[]} keys - State keys to watch
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(keys, callback) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    
    keyArray.forEach(key => {
      if (!this.listeners.has(key)) {
        this.listeners.set(key, new Set());
      }
      this.listeners.get(key).add(callback);
    });
    
    // Return unsubscribe function
    return () => {
      keyArray.forEach(key => {
        if (this.listeners.has(key)) {
          this.listeners.get(key).delete(callback);
        }
      });
    };
  }

  /**
   * Dispatch an action to update state
   * @param {Object} action - Action object with type and payload
   */
  dispatch(action) {
    if (!action || !action.type) {
      console.error('Invalid action dispatched:', action);
      return;
    }

    console.log('🔄 Store action:', action.type, action.payload);
    
    // Apply middleware
    const finalAction = this.middleware.reduce(
      (acc, middleware) => middleware(acc, this.state),
      action
    );
    
    const previousState = { ...this.state };
    const newState = this.reducer(this.state, finalAction);
    const changedKeys = this.getChangedKeys(previousState, newState);
    
    this.state = { ...newState };
    
    // Notify subscribers of changed keys
    changedKeys.forEach(key => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).forEach(callback => {
          try {
            callback(this.state[key], key, this.state);
          } catch (error) {
            console.error('Error in state subscriber:', error);
          }
        });
      }
    });
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Convenience imperative setter for a single state key.
   * Notifies subscribers for the changed key(s).
   * @param {string} key
   * @param {*} value
   */
  setState(key, value) {
    const prevState = { ...this.state };
    this.state = { ...this.state, [key]: value };
    const changedKeys = this.getChangedKeys(prevState, this.state);
    changedKeys.forEach(k => {
      if (this.listeners.has(k)) {
        this.listeners.get(k).forEach(callback => {
          try {
            callback(this.state[k], k, this.state);
          } catch (err) {
            console.error('Error in state subscriber:', err);
          }
        });
      }
    });
  }

  /**
   * State reducer - handles state updates based on action
   * @param {Object} state - Current state
   * @param {Object} action - Action object
   * @returns {Object} New state
   */
  reducer(state, action) {
    switch (action.type) {
      // Loading states
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
        
      case 'SET_ERROR':
        return { ...state, error: action.payload, loading: false };
        
      case 'CLEAR_ERROR':
        return { ...state, error: null };

      // Data loading
      case 'BOOKS_LOADED':
        return { 
          ...state, 
          books: action.payload.items || action.payload || [],
          loading: false,
          error: null
        };
        
      case 'USERS_LOADED':
        return { 
          ...state, 
          users: action.payload || [],
          loading: false,
          error: null
        };
        
      case 'LOANS_LOADED':
        return { 
          ...state, 
          loans: action.payload || [],
          loading: false,
          error: null
        };

      case 'STATS_LOADED':
        return { ...state, stats: { ...state.stats, ...action.payload } };

      // Data mutations
      case 'BOOK_ADDED':
        return {
          ...state,
          books: [...state.books, action.payload],
          hasUnsavedChanges: false
        };
        
      case 'BOOK_UPDATED':
        return {
          ...state,
          books: state.books.map(book => 
            book.id === action.payload.id ? { ...book, ...action.payload } : book
          ),
          hasUnsavedChanges: false
        };
        
      case 'BOOK_DELETED':
        return {
          ...state,
          books: state.books.filter(book => book.id !== action.payload),
          hasUnsavedChanges: false
        };

      case 'LOAN_CREATED':
        return {
          ...state,
          loans: [...state.loans, action.payload],
          hasUnsavedChanges: false
        };

      case 'LOAN_RETURNED':
        return {
          ...state,
          loans: state.loans.map(loan =>
            loan.id === action.payload.id ? { ...loan, ...action.payload } : loan
          ),
          hasUnsavedChanges: false
        };

      // UI state
      case 'SET_THEME':
        return { ...state, theme: action.payload };
        
      case 'SET_SEARCH_QUERY':
        return { ...state, searchQuery: action.payload, currentPage: 0 };
        
      case 'SET_PAGE':
        return { ...state, currentPage: action.payload };
        
      case 'SET_PAGE_SIZE':
        return { ...state, pageSize: action.payload, currentPage: 0 };
        
      case 'SET_SORT':
        return { ...state, sortBy: action.payload, currentPage: 0 };
        
      case 'SET_FILTER':
        return { ...state, filterBy: action.payload, currentPage: 0 };

      // App state
      case 'SET_UNSAVED_CHANGES':
        return { ...state, hasUnsavedChanges: action.payload };
        
      case 'SET_ONLINE_STATUS':
        return { ...state, isOnline: action.payload };

      // Notifications
      case 'ADD_NOTIFICATION':
        return {
          ...state,
          notifications: [...state.notifications, {
            id: Date.now(),
            timestamp: new Date(),
            ...action.payload
          }]
        };
        
      case 'REMOVE_NOTIFICATION':
        return {
          ...state,
          notifications: state.notifications.filter(n => n.id !== action.payload)
        };

      default:
        console.warn('Unknown action type:', action.type);
        return state;
    }
  }

  /**
   * Get keys that changed between two states
   * @param {Object} prevState - Previous state
   * @param {Object} newState - New state
   * @returns {string[]} Array of changed keys
   */
  getChangedKeys(prevState, newState) {
    const changedKeys = [];
    
    Object.keys(newState).forEach(key => {
      if (prevState[key] !== newState[key]) {
        changedKeys.push(key);
      }
    });
    
    return changedKeys;
  }

  /**
   * Add middleware to the store
   * @param {Function} middleware - Middleware function
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Reset store to initial state
   */
  reset() {
    this.state = {
      books: [],
      users: [],
      loans: [],
      stats: {
        totalBooks: 0,
        availableBooks: 0,
        totalUsers: 0,
        activeLoans: 0,
        overdueLoans: 0
      },
      loading: false,
      error: null,
      theme: 'light',
      searchQuery: '',
      currentPage: 0,
      pageSize: 20,
      sortBy: 'title',
      filterBy: 'all',
      hasUnsavedChanges: false,
      isOnline: navigator.onLine,
      notifications: []
    };
  }
}
