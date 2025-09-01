/**
 * Theme Manager - Handles light/dark theme switching
 */
export class ThemeManager {
  constructor() {
    this.theme = 'light';
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Bind methods
    this.init = this.init.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.getTheme = this.getTheme.bind(this);
    this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
  }

  /**
   * Initialize theme manager
   */
  init() {
    // Get saved theme or use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = this.mediaQuery.matches ? 'dark' : 'light';
    
    this.setTheme(savedTheme || systemTheme);
    
    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
  }

  /**
   * Set theme
   * @param {string} theme - 'light' or 'dark'
   */
  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('Invalid theme:', theme);
      return;
    }

    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { theme } 
    }));
    
    console.log('🎨 Theme changed to:', theme);
  }

  /**
   * Get current theme
   * @returns {string} Current theme
   */
  getTheme() {
    return this.theme;
  }

  /**
   * Toggle between light and dark theme
   */
  toggle() {
    this.setTheme(this.theme === 'light' ? 'dark' : 'light');
  }

  /**
   * Handle system theme changes
   * @param {MediaQueryListEvent} e - Media query event
   */
  handleSystemThemeChange(e) {
    // Only auto-switch if user hasn't manually set a theme
    if (!localStorage.getItem('theme')) {
      this.setTheme(e.matches ? 'dark' : 'light');
    }
  }

  /**
   * Reset to system preference
   */
  resetToSystem() {
    localStorage.removeItem('theme');
    const systemTheme = this.mediaQuery.matches ? 'dark' : 'light';
    this.setTheme(systemTheme);
  }
}
