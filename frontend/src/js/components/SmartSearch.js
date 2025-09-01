/**
 * Smart Search Component
 * Advanced search with autocomplete, filters, and real-time results
 */
export class SmartSearch extends HTMLElement {
  constructor() {
    super();
    
    this.state = {
      query: '',
      filters: {
        type: 'all', // 'all', 'books', 'users', 'loans'
        status: 'all', // 'all', 'available', 'borrowed', 'overdue'
        category: 'all'
      },
      suggestions: [],
      results: [],
      isLoading: false,
      isExpanded: false,
      recentSearches: this.loadRecentSearches()
    };
    
    this.debounceTimer = null;
    this.abortController = null;
  }

  connectedCallback() {
    this.render();
    this.setupStoreSubscription();
    this.setupKeyboardShortcuts();
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.clearDebounceTimer();
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Subscribe to store updates
   */
  setupStoreSubscription() {
    if (window.app && window.app.store) {
      this.unsubscribe = window.app.store.subscribe(['books', 'users', 'loans'], 
        (data) => {
          this.generateSuggestions();
        }
      );
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.focusSearch();
      }
      
      // Escape to close search
      if (e.key === 'Escape' && this.state.isExpanded) {
        this.collapseSearch();
      }
    });
  }

  /**
   * Render component HTML
   */
  render() {
    this.innerHTML = `
      <div class="smart-search ${this.state.isExpanded ? 'expanded' : ''}">
        <div class="search-container">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              class="search-input" 
              placeholder="Cerca libri, utenti, prestiti... (Ctrl+K)"
              value="${this.state.query}"
              autocomplete="off"
              spellcheck="false"
            />
            <div class="search-shortcuts">
              <span class="shortcut-hint">Ctrl+K</span>
            </div>
            ${this.state.query ? `
              <button class="clear-btn" title="Cancella ricerca">
                <span>✕</span>
              </button>
            ` : ''}
          </div>
          
          <div class="search-filters ${this.state.isExpanded ? 'visible' : ''}">
            <div class="filter-group">
              <label>Tipo:</label>
              <select class="filter-select" data-filter="type">
                <option value="all">Tutto</option>
                <option value="books" ${this.state.filters.type === 'books' ? 'selected' : ''}>Libri</option>
                <option value="users" ${this.state.filters.type === 'users' ? 'selected' : ''}>Utenti</option>
                <option value="loans" ${this.state.filters.type === 'loans' ? 'selected' : ''}>Prestiti</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Stato:</label>
              <select class="filter-select" data-filter="status">
                <option value="all">Tutti</option>
                <option value="available" ${this.state.filters.status === 'available' ? 'selected' : ''}>Disponibili</option>
                <option value="borrowed" ${this.state.filters.status === 'borrowed' ? 'selected' : ''}>In Prestito</option>
                <option value="overdue" ${this.state.filters.status === 'overdue' ? 'selected' : ''}>In Ritardo</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Categoria:</label>
              <select class="filter-select" data-filter="category">
                <option value="all">Tutte</option>
                <option value="fiction">Narrativa</option>
                <option value="non-fiction">Saggistica</option>
                <option value="science">Scienze</option>
                <option value="history">Storia</option>
                <option value="technology">Tecnologia</option>
              </select>
            </div>
            
            <button class="advanced-search-btn">
              ⚙️ Ricerca Avanzata
            </button>
          </div>
        </div>
        
        <div class="search-dropdown ${this.state.isExpanded ? 'visible' : ''}">
          ${this.renderDropdownContent()}
        </div>
        
        ${this.state.isLoading ? `
          <div class="search-loading">
            <div class="loading-spinner"></div>
            <span>Ricerca in corso...</span>
          </div>
        ` : ''}
      </div>
    `;
    
    this.setupEventListeners();
    this.addStyles();
  }

  /**
   * Render dropdown content based on current state
   */
  renderDropdownContent() {
    if (this.state.query.length === 0) {
      return this.renderRecentSearches();
    }
    
    if (this.state.suggestions.length > 0) {
      return this.renderSuggestions();
    }
    
    if (this.state.results.length > 0) {
      return this.renderResults();
    }
    
    if (this.state.query.length > 0 && !this.state.isLoading) {
      return `
        <div class="no-results">
          <div class="no-results-icon">🤷‍♂️</div>
          <div class="no-results-text">
            <h3>Nessun risultato trovato</h3>
            <p>Prova con termini diversi o usa i filtri</p>
          </div>
          <div class="search-suggestions">
            <h4>Suggerimenti:</h4>
            <ul>
              <li>Verifica l'ortografia</li>
              <li>Usa parole chiave più generali</li>
              <li>Prova a cercare per autore o titolo</li>
            </ul>
          </div>
        </div>
      `;
    }
    
    return '';
  }

  /**
   * Render recent searches
   */
  renderRecentSearches() {
    if (this.state.recentSearches.length === 0) {
      return `
        <div class="search-welcome">
          <div class="welcome-icon">👋</div>
          <h3>Benvenuto nella Ricerca Intelligente</h3>
          <p>Inizia a digitare per cercare libri, utenti e prestiti</p>
          <div class="search-tips">
            <h4>💡 Suggerimenti veloci:</h4>
            <ul>
              <li><strong>Ctrl+K</strong> per aprire la ricerca</li>
              <li>Usa i <strong>filtri</strong> per risultati precisi</li>
              <li>La ricerca è <strong>istantanea</strong> mentre digiti</li>
            </ul>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="recent-searches">
        <div class="section-header">
          <h4>🕒 Ricerche Recenti</h4>
          <button class="clear-recent-btn">Cancella</button>
        </div>
        <div class="recent-list">
          ${this.state.recentSearches.map(search => `
            <div class="recent-item" data-query="${search.query}">
              <span class="recent-icon">${this.getSearchTypeIcon(search.type)}</span>
              <span class="recent-text">${search.query}</span>
              <span class="recent-time">${this.formatRelativeTime(search.timestamp)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render autocomplete suggestions
   */
  renderSuggestions() {
    return `
      <div class="suggestions">
        <div class="section-header">
          <h4>💭 Suggerimenti</h4>
        </div>
        <div class="suggestion-list">
          ${this.state.suggestions.map((suggestion, index) => `
            <div class="suggestion-item ${index === 0 ? 'highlighted' : ''}" 
                 data-suggestion="${suggestion.text}">
              <span class="suggestion-icon">${suggestion.icon}</span>
              <span class="suggestion-text">${this.highlightMatch(suggestion.text, this.state.query)}</span>
              <span class="suggestion-type">${suggestion.type}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render search results
   */
  renderResults() {
    const groupedResults = this.groupResultsByType(this.state.results);
    
    return `
      <div class="search-results">
        ${Object.entries(groupedResults).map(([type, items]) => `
          <div class="result-group">
            <div class="group-header">
              <span class="group-icon">${this.getSearchTypeIcon(type)}</span>
              <h4>${this.getTypeLabel(type)} (${items.length})</h4>
            </div>
            <div class="result-list">
              ${items.map(item => this.renderResultItem(item, type)).join('')}
            </div>
          </div>
        `).join('')}
        
        <div class="search-footer">
          <button class="view-all-btn">
            👁️ Vedi tutti i risultati (${this.state.results.length})
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render individual result item
   */
  renderResultItem(item, type) {
    switch (type) {
      case 'books':
        return `
          <div class="result-item book-item" data-id="${item.id}" data-type="book">
            <div class="item-icon">📖</div>
            <div class="item-content">
              <div class="item-title">${this.highlightMatch(item.title, this.state.query)}</div>
              <div class="item-subtitle">${item.author} • ${item.genre || 'N/A'}</div>
              <div class="item-status ${item.available ? 'available' : 'borrowed'}">
                ${item.available ? '✅ Disponibile' : '📅 In prestito'}
              </div>
            </div>
          </div>
        `;
        
      case 'users':
        return `
          <div class="result-item user-item" data-id="${item.id}" data-type="user">
            <div class="item-icon">👤</div>
            <div class="item-content">
              <div class="item-title">${this.highlightMatch(item.name, this.state.query)}</div>
              <div class="item-subtitle">${item.email}</div>
              <div class="item-status">
                📚 ${item.activeLoans || 0} prestiti attivi
              </div>
            </div>
          </div>
        `;
        
      case 'loans':
        return `
          <div class="result-item loan-item" data-id="${item.id}" data-type="loan">
            <div class="item-icon">📅</div>
            <div class="item-content">
              <div class="item-title">${item.bookTitle} → ${item.userName}</div>
              <div class="item-subtitle">Dal ${this.formatDate(item.loanDate)}</div>
              <div class="item-status ${item.isOverdue ? 'overdue' : 'active'}">
                ${item.isOverdue ? '⚠️ In ritardo' : '✅ Attivo'}
              </div>
            </div>
          </div>
        `;
        
      default:
        return '';
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const searchInput = this.querySelector('.search-input');
    const clearBtn = this.querySelector('.clear-btn');
    const filterSelects = this.querySelectorAll('.filter-select');
    
    // Search input events
    searchInput.addEventListener('input', (e) => {
      this.handleSearchInput(e.target.value);
    });
    
    searchInput.addEventListener('focus', () => {
      this.expandSearch();
    });
    
    searchInput.addEventListener('blur', (e) => {
      // Delay collapse to allow dropdown clicks
      setTimeout(() => {
        if (!this.contains(document.activeElement)) {
          this.collapseSearch();
        }
      }, 150);
    });
    
    // Clear button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearSearch();
      });
    }
    
    // Filter changes
    filterSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const filterType = e.target.getAttribute('data-filter');
        this.updateFilter(filterType, e.target.value);
      });
    });
    
    // Dropdown interactions
    this.addEventListener('click', (e) => {
      this.handleDropdownClick(e);
    });
    
    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });
  }

  /**
   * Handle search input with debouncing
   */
  handleSearchInput(query) {
    this.state.query = query.trim();
    
    this.clearDebounceTimer();
    
    if (query.length === 0) {
      this.state.suggestions = [];
      this.state.results = [];
      this.render();
      return;
    }
    
    if (query.length < 2) {
      this.generateSuggestions();
      this.render();
      return;
    }
    
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }

  /**
   * Perform the actual search
   */
  async performSearch(query) {
    this.state.isLoading = true;
    this.render();
    
    try {
      // Cancel previous request
      if (this.abortController) {
        this.abortController.abort();
      }
      
      this.abortController = new AbortController();
      
      const searchParams = new URLSearchParams({
        q: query,
        type: this.state.filters.type,
        status: this.state.filters.status,
        category: this.state.filters.category,
        limit: 10
      });
      
      const response = await fetch(`/api/search?${searchParams}`, {
        signal: this.abortController.signal
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const results = await response.json();
      
      this.state.results = results.items || [];
      this.state.suggestions = [];
      this.saveRecentSearch(query);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
        this.state.results = [];
      }
    } finally {
      this.state.isLoading = false;
      this.render();
    }
  }

  /**
   * Generate autocomplete suggestions
   */
  generateSuggestions() {
    const query = this.state.query.toLowerCase();
    if (query.length < 2) return;
    
    const suggestions = [];
    
    // Get data from store
    const store = window.app?.store;
    if (!store) return;
    
    const books = store.getState('books') || [];
    const users = store.getState('users') || [];
    
    // Book suggestions
    books.forEach(book => {
      if (book.title.toLowerCase().includes(query)) {
        suggestions.push({
          text: book.title,
          type: 'libro',
          icon: '📖'
        });
      }
      if (book.author.toLowerCase().includes(query)) {
        suggestions.push({
          text: book.author,
          type: 'autore',
          icon: '✍️'
        });
      }
    });
    
    // User suggestions
    users.forEach(user => {
      if (user.name.toLowerCase().includes(query)) {
        suggestions.push({
          text: user.name,
          type: 'utente',
          icon: '👤'
        });
      }
    });
    
    // Limit and dedupe suggestions
    this.state.suggestions = suggestions
      .slice(0, 8)
      .filter((item, index, arr) => 
        arr.findIndex(i => i.text === item.text) === index
      );
  }

  /**
   * Handle dropdown clicks
   */
  handleDropdownClick(e) {
    const suggestionItem = e.target.closest('.suggestion-item');
    const recentItem = e.target.closest('.recent-item');
    const resultItem = e.target.closest('.result-item');
    
    if (suggestionItem) {
      const suggestion = suggestionItem.getAttribute('data-suggestion');
      this.selectSuggestion(suggestion);
    }
    
    if (recentItem) {
      const query = recentItem.getAttribute('data-query');
      this.selectSuggestion(query);
    }
    
    if (resultItem) {
      const id = resultItem.getAttribute('data-id');
      const type = resultItem.getAttribute('data-type');
      this.selectResult(id, type);
    }
    
    if (e.target.closest('.clear-recent-btn')) {
      this.clearRecentSearches();
    }
    
    if (e.target.closest('.view-all-btn')) {
      this.viewAllResults();
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboardNavigation(e) {
    const items = this.querySelectorAll('.suggestion-item, .recent-item, .result-item');
    const highlighted = this.querySelector('.highlighted');
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.navigateItems(items, highlighted, 1);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.navigateItems(items, highlighted, -1);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (highlighted) {
          highlighted.click();
        }
        break;
        
      case 'Tab':
        if (highlighted && e.shiftKey === false) {
          e.preventDefault();
          const suggestion = highlighted.getAttribute('data-suggestion');
          if (suggestion) {
            this.selectSuggestion(suggestion);
          }
        }
        break;
    }
  }

  /**
   * Navigate through dropdown items
   */
  navigateItems(items, current, direction) {
    if (items.length === 0) return;
    
    let currentIndex = Array.from(items).indexOf(current);
    let nextIndex;
    
    if (currentIndex === -1) {
      nextIndex = direction > 0 ? 0 : items.length - 1;
    } else {
      nextIndex = currentIndex + direction;
      if (nextIndex >= items.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = items.length - 1;
    }
    
    // Remove current highlight
    if (current) {
      current.classList.remove('highlighted');
    }
    
    // Add new highlight
    items[nextIndex].classList.add('highlighted');
    items[nextIndex].scrollIntoView({ block: 'nearest' });
  }

  /**
   * Utility methods
   */
  expandSearch() {
    this.state.isExpanded = true;
    this.render();
  }

  collapseSearch() {
    this.state.isExpanded = false;
    this.render();
  }

  focusSearch() {
    const input = this.querySelector('.search-input');
    if (input) {
      input.focus();
      input.select();
    }
  }

  clearSearch() {
    this.state.query = '';
    this.state.suggestions = [];
    this.state.results = [];
    this.render();
    this.focusSearch();
  }

  selectSuggestion(suggestion) {
    this.state.query = suggestion;
    this.performSearch(suggestion);
    this.querySelector('.search-input').value = suggestion;
  }

  selectResult(id, type) {
    this.dispatchEvent(new CustomEvent('item-selected', {
      bubbles: true,
      detail: { id, type }
    }));
    this.collapseSearch();
  }

  updateFilter(filterType, value) {
    this.state.filters[filterType] = value;
    if (this.state.query.length >= 2) {
      this.performSearch(this.state.query);
    }
  }

  clearDebounceTimer() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  // Data persistence
  saveRecentSearch(query) {
    const search = {
      query,
      type: this.state.filters.type,
      timestamp: Date.now()
    };
    
    this.state.recentSearches = this.state.recentSearches
      .filter(s => s.query !== query)
      .concat(search)
      .slice(-5);
    
    localStorage.setItem('recentSearches', JSON.stringify(this.state.recentSearches));
  }

  loadRecentSearches() {
    try {
      const saved = localStorage.getItem('recentSearches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  clearRecentSearches() {
    this.state.recentSearches = [];
    localStorage.removeItem('recentSearches');
    this.render();
  }

  // Helper methods
  highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  groupResultsByType(results) {
    return results.reduce((groups, item) => {
      const type = item.type || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
      return groups;
    }, {});
  }

  getSearchTypeIcon(type) {
    const icons = {
      all: '🔍',
      books: '📖',
      users: '👤',
      loans: '📅',
      book: '📖',
      user: '👤',
      loan: '📅'
    };
    return icons[type] || '🔍';
  }

  getTypeLabel(type) {
    const labels = {
      books: 'Libri',
      users: 'Utenti',
      loans: 'Prestiti'
    };
    return labels[type] || type;
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('it-IT');
  }

  formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'ora';
    if (minutes < 60) return `${minutes}m fa`;
    if (hours < 24) return `${hours}h fa`;
    return `${days}g fa`;
  }

  viewAllResults() {
    this.dispatchEvent(new CustomEvent('view-all-results', {
      bubbles: true,
      detail: { 
        query: this.state.query,
        filters: this.state.filters,
        totalResults: this.state.results.length
      }
    }));
  }

  /**
   * Add component styles
   */
  addStyles() {
    if (document.getElementById('smart-search-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'smart-search-styles';
    style.textContent = `
      .smart-search {
        position: relative;
        max-width: 600px;
        margin: 0 auto var(--space-6);
        z-index: 100;
      }
      
      .search-container {
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: var(--radius-lg);
        overflow: hidden;
        transition: all var(--transition-base);
      }
      
      .smart-search.expanded .search-container {
        border-color: var(--primary);
        box-shadow: var(--shadow-lg);
      }
      
      .search-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        padding: var(--space-4);
      }
      
      .search-icon {
        font-size: 1.2rem;
        margin-right: var(--space-3);
        color: var(--text-secondary);
      }
      
      .search-input {
        flex: 1;
        border: none;
        background: none;
        font-size: var(--text-base);
        color: var(--text-primary);
        outline: none;
      }
      
      .search-input::placeholder {
        color: var(--text-secondary);
      }
      
      .search-shortcuts {
        margin-left: var(--space-3);
      }
      
      .shortcut-hint {
        background: var(--surface-secondary);
        color: var(--text-secondary);
        font-size: var(--text-xs);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        font-family: monospace;
      }
      
      .clear-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1rem;
        padding: var(--space-1);
        margin-left: var(--space-2);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
      }
      
      .clear-btn:hover {
        background: var(--surface-secondary);
        color: var(--text-primary);
      }
      
      .search-filters {
        background: var(--surface-secondary);
        padding: var(--space-4);
        border-top: 1px solid var(--border);
        display: none;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: var(--space-4);
        align-items: end;
      }
      
      .search-filters.visible {
        display: grid;
      }
      
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }
      
      .filter-group label {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .filter-select {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: var(--space-2);
        font-size: var(--text-sm);
        color: var(--text-primary);
        cursor: pointer;
      }
      
      .advanced-search-btn {
        background: var(--primary);
        color: white;
        border: none;
        border-radius: var(--radius-sm);
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
      }
      
      .advanced-search-btn:hover {
        background: var(--primary-dark);
      }
      
      .search-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--surface);
        border: 2px solid var(--primary);
        border-top: none;
        border-radius: 0 0 var(--radius-lg) var(--radius-lg);
        max-height: 60vh;
        overflow-y: auto;
        display: none;
        z-index: 1000;
      }
      
      .search-dropdown.visible {
        display: block;
      }
      
      .search-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-6);
        color: var(--text-secondary);
      }
      
      .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid var(--border);
        border-top: 2px solid var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4) var(--space-4) var(--space-2);
        border-bottom: 1px solid var(--border);
      }
      
      .section-header h4 {
        margin: 0;
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--text-secondary);
      }
      
      .clear-recent-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: var(--text-xs);
        cursor: pointer;
        padding: var(--space-1);
      }
      
      .clear-recent-btn:hover {
        color: var(--primary);
      }
      
      .search-welcome {
        padding: var(--space-6);
        text-align: center;
      }
      
      .welcome-icon {
        font-size: 3rem;
        margin-bottom: var(--space-4);
      }
      
      .search-welcome h3 {
        margin: 0 0 var(--space-2);
        color: var(--text-primary);
      }
      
      .search-welcome p {
        color: var(--text-secondary);
        margin-bottom: var(--space-4);
      }
      
      .search-tips {
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
        padding: var(--space-4);
        text-align: left;
        max-width: 400px;
        margin: 0 auto;
      }
      
      .search-tips h4 {
        margin: 0 0 var(--space-2);
        font-size: var(--text-sm);
        color: var(--text-primary);
      }
      
      .search-tips ul {
        margin: 0;
        padding-left: var(--space-4);
        color: var(--text-secondary);
        font-size: var(--text-sm);
      }
      
      .search-tips li {
        margin-bottom: var(--space-1);
      }
      
      .recent-list,
      .suggestion-list,
      .result-list {
        padding: 0 var(--space-2) var(--space-2);
      }
      
      .recent-item,
      .suggestion-item,
      .result-item {
        display: flex;
        align-items: center;
        padding: var(--space-3);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);
      }
      
      .recent-item:hover,
      .suggestion-item:hover,
      .result-item:hover,
      .suggestion-item.highlighted,
      .recent-item.highlighted,
      .result-item.highlighted {
        background: var(--surface-secondary);
      }
      
      .recent-icon,
      .suggestion-icon,
      .item-icon {
        font-size: 1.2rem;
        margin-right: var(--space-3);
        flex-shrink: 0;
      }
      
      .recent-text,
      .suggestion-text {
        flex: 1;
        color: var(--text-primary);
      }
      
      .recent-time,
      .suggestion-type {
        color: var(--text-secondary);
        font-size: var(--text-xs);
        margin-left: var(--space-2);
      }
      
      .item-content {
        flex: 1;
        min-width: 0;
      }
      
      .item-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .item-subtitle {
        color: var(--text-secondary);
        font-size: var(--text-sm);
        margin-bottom: var(--space-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .item-status {
        font-size: var(--text-xs);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        display: inline-block;
      }
      
      .item-status.available {
        background: var(--success-light);
        color: var(--success-dark);
      }
      
      .item-status.borrowed {
        background: var(--warning-light);
        color: var(--warning-dark);
      }
      
      .item-status.overdue {
        background: var(--danger-light);
        color: var(--danger-dark);
      }
      
      .item-status.active {
        background: var(--info-light);
        color: var(--info-dark);
      }
      
      .no-results {
        padding: var(--space-6);
        text-align: center;
      }
      
      .no-results-icon {
        font-size: 3rem;
        margin-bottom: var(--space-4);
      }
      
      .no-results-text h3 {
        margin: 0 0 var(--space-2);
        color: var(--text-primary);
      }
      
      .no-results-text p {
        color: var(--text-secondary);
        margin-bottom: var(--space-4);
      }
      
      .search-suggestions {
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
        padding: var(--space-4);
        text-align: left;
        max-width: 300px;
        margin: 0 auto;
      }
      
      .search-suggestions h4 {
        margin: 0 0 var(--space-2);
        font-size: var(--text-sm);
        color: var(--text-primary);
      }
      
      .search-suggestions ul {
        margin: 0;
        padding-left: var(--space-4);
        color: var(--text-secondary);
        font-size: var(--text-sm);
      }
      
      .search-footer {
        padding: var(--space-4);
        border-top: 1px solid var(--border);
        text-align: center;
      }
      
      .view-all-btn {
        background: var(--primary);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        padding: var(--space-3) var(--space-4);
        font-size: var(--text-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
      }
      
      .view-all-btn:hover {
        background: var(--primary-dark);
      }
      
      .result-group {
        border-bottom: 1px solid var(--border);
      }
      
      .result-group:last-child {
        border-bottom: none;
      }
      
      .group-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-4) var(--space-4) var(--space-2);
        background: var(--surface-secondary);
      }
      
      .group-header h4 {
        margin: 0;
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--text-secondary);
      }
      
      .group-icon {
        font-size: 1rem;
      }
      
      mark {
        background: var(--primary-light);
        color: var(--primary-dark);
        padding: 0 2px;
        border-radius: 2px;
      }
      
      @media (max-width: 768px) {
        .smart-search {
          max-width: none;
          margin-left: var(--space-4);
          margin-right: var(--space-4);
        }
        
        .search-filters {
          grid-template-columns: 1fr;
          gap: var(--space-3);
        }
        
        .search-dropdown {
          max-height: 50vh;
        }
        
        .search-input-wrapper {
          padding: var(--space-3);
        }
        
        .shortcut-hint {
          display: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}
