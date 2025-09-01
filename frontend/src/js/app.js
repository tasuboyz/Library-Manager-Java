// app.js - Main Application Entry Point
import { AppStore } from './store/AppStore.js';
import { ApiService } from './services/ApiService.js';
import { ThemeManager } from './utils/ThemeManager.js';
import { AnimationObserver } from './utils/AnimationObserver.js';

// Import Components
import { DashboardHero } from './components/DashboardHero.js';
import { SmartSearch } from './components/SmartSearch.js';
import { BookGrid } from './components/BookGrid.js';
import { NotificationManager } from './components/NotificationManager.js';

/**
 * Main Application Class
 * Handles app initialization, routing, and global state
 */
class DigitalLibraryApp {
  constructor() {
    this.store = new AppStore();
    this.api = new ApiService('/api');
    this.theme = new ThemeManager();
    this.animations = new AnimationObserver();
    this.notifications = new NotificationManager();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.handleThemeToggle = this.handleThemeToggle.bind(this);
    this.hideLoader = this.hideLoader.bind(this);
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('🚀 Initializing Digital Library App...');
      
      // Register custom elements
      this.registerComponents();
      
      // Setup global event listeners
      this.setupEventListeners();
      
      // Initialize theme
      this.theme.init();
      
      // Load initial data
      await this.loadInitialData();
      
      // Render components
      this.renderComponents();
      
      // Setup animations
      this.setupAnimations();
      
      // Hide loading overlay
      this.hideLoader();
      
      console.log('✅ App initialized successfully!');
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.notifications.show('Errore durante l\'inizializzazione', 'error');
    }
  }

  /**
   * Register Web Components
   */
  registerComponents() {
    // Only register if not already defined
    if (!customElements.get('dashboard-hero')) {
      customElements.define('dashboard-hero', DashboardHero);
    }
    if (!customElements.get('smart-search')) {
      customElements.define('smart-search', SmartSearch);
    }
    if (!customElements.get('book-grid')) {
      customElements.define('book-grid', BookGrid);
    }
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', this.handleThemeToggle);
    }

    // Notifications toggle
    const notificationsToggle = document.getElementById('notifications-toggle');
    if (notificationsToggle) {
      notificationsToggle.addEventListener('click', () => {
        this.notifications.showPermissionRequest();
      });
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('smart-search input');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Ctrl/Cmd + T for theme toggle
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        this.handleThemeToggle();
      }
    });

    // Online/offline status
    window.addEventListener('online', () => {
      this.notifications.show('Connessione ristabilita', 'success');
    });

    window.addEventListener('offline', () => {
      this.notifications.show('Connessione persa - modalità offline', 'warning');
    });

    // Unload warning for unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (this.store.getState().hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  /**
   * Load initial application data
   */
  async loadInitialData() {
    try {
      // Show loading state
      this.store.dispatch({ type: 'SET_LOADING', payload: true });

      // Load books, users, and loans in parallel
      const [booksResponse, usersResponse, loansResponse] = await Promise.all([
        this.api.getBooks({ limit: 20, offset: 0 }),
        this.api.getUsers(),
        this.api.getLoans()
      ]);

      // Update store with loaded data
      this.store.dispatch({ type: 'BOOKS_LOADED', payload: booksResponse });
      this.store.dispatch({ type: 'USERS_LOADED', payload: usersResponse });
      this.store.dispatch({ type: 'LOANS_LOADED', payload: loansResponse });

      // Calculate and set statistics
      const stats = this.calculateStats(booksResponse, usersResponse, loansResponse);
      this.store.dispatch({ type: 'STATS_LOADED', payload: stats });

    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.store.dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      this.store.dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  /**
   * Calculate statistics for dashboard
   */
  calculateStats(books, users, loans) {
    const booksData = books.items || books || [];
    const usersData = users || [];
    const loansData = loans || [];

    return {
      totalBooks: booksData.length,
      availableBooks: booksData.filter(book => book.available).length,
      totalUsers: usersData.length,
      activeLoans: loansData.filter(loan => !loan.returnedAt).length,
      overdueLoans: loansData.filter(loan => {
        if (loan.returnedAt) return false;
        const dueDate = new Date(loan.dueAt);
        return dueDate < new Date();
      }).length
    };
  }

  /**
   * Render main components
   */
  renderComponents() {
    // Dashboard Hero
    const heroSection = document.getElementById('dashboard-hero');
    if (heroSection) {
      heroSection.innerHTML = '<dashboard-hero></dashboard-hero>';
    }

    // Smart Search
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
      searchSection.innerHTML = '<smart-search></smart-search>';
    }

    // Book Grid
    const contentGrid = document.getElementById('content-grid');
    if (contentGrid) {
      contentGrid.innerHTML = '<book-grid></book-grid>';
    }
  }

  /**
   * Setup animation observers
   */
  setupAnimations() {
    // Observe all animatable elements
    const animateElements = document.querySelectorAll('[data-animate]');
    animateElements.forEach(el => this.animations.observe(el));
  }

  /**
   * Handle theme toggle
   */
  handleThemeToggle() {
    const currentTheme = this.theme.getTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.theme.setTheme(newTheme);
    
    // Update button icon
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
    }
  }

  /**
   * Hide loading overlay with animation
   */
  hideLoader() {
    const loader = document.getElementById('app-loading');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => {
        loader.remove();
      }, 300);
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new DigitalLibraryApp();
  window.app.init();
});

// Make store globally available for debugging
window.addEventListener('load', () => {
  if (window.app) {
    window.store = window.app.store;
    window.api = window.app.api;
  }
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
