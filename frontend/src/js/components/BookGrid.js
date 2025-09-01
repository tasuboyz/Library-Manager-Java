/**
 * Book Grid Component
 * Advanced grid display with multiple view modes, sorting, and filtering
 */
export class BookGrid extends HTMLElement {
  constructor() {
    super();
    
    this.state = {
      books: [],
      filteredBooks: [],
      viewMode: localStorage.getItem('bookGrid-viewMode') || 'grid', // 'grid', 'list', 'table'
      sortBy: localStorage.getItem('bookGrid-sortBy') || 'title', // 'title', 'author', 'date', 'popularity'
      sortOrder: localStorage.getItem('bookGrid-sortOrder') || 'asc', // 'asc', 'desc'
      filters: {
        status: 'all', // 'all', 'available', 'borrowed'
        genre: 'all',
        author: 'all'
      },
      isLoading: false,
      selectedBooks: new Set(),
      pagination: {
        page: 1,
        limit: parseInt(localStorage.getItem('bookGrid-pageSize')) || 20,
        total: 0,
        totalPages: 0
      }
    };
    
    this.genres = new Set();
    this.authors = new Set();
  }

  connectedCallback() {
    this.render();
    this.setupStoreSubscription();
    this.loadBooks();
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  /**
   * Subscribe to store updates
   */
  setupStoreSubscription() {
    if (window.app && window.app.store) {
      this.unsubscribe = window.app.store.subscribe('books', (books) => {
        this.state.books = books || [];
        this.updateCollections();
        this.applyFiltersAndSort();
      });
    }
  }

  /**
   * Load books from API
   */
  async loadBooks() {
    this.state.isLoading = true;
    this.render();
    
    try {
      const params = new URLSearchParams({
        page: this.state.pagination.page,
        limit: this.state.pagination.limit,
        sortBy: this.state.sortBy,
        sortOrder: this.state.sortOrder
      });
      
      if (this.state.filters.status !== 'all') {
        params.set('status', this.state.filters.status);
      }
      
      if (this.state.filters.genre !== 'all') {
        params.set('genre', this.state.filters.genre);
      }
      
      if (this.state.filters.author !== 'all') {
        params.set('author', this.state.filters.author);
      }
      
      const response = await fetch(`/api/books?${params}`);
      if (!response.ok) throw new Error('Failed to load books');
      
      const data = await response.json();
      
      // Update store
      if (window.app && window.app.store) {
        window.app.store.setState('books', data.items || data);
      }
      
      // Update pagination
      if (data.total !== undefined) {
        this.state.pagination.total = data.total;
        this.state.pagination.totalPages = Math.ceil(data.total / this.state.pagination.limit);
      }
      
    } catch (error) {
      console.error('Error loading books:', error);
      this.showError('Errore nel caricamento dei libri');
    } finally {
      this.state.isLoading = false;
      this.render();
    }
  }

  /**
   * Update genre and author collections
   */
  updateCollections() {
    this.genres.clear();
    this.authors.clear();
    
    this.state.books.forEach(book => {
      if (book.genre) this.genres.add(book.genre);
      if (book.author) this.authors.add(book.author);
    });
  }

  /**
   * Apply filters and sorting
   */
  applyFiltersAndSort() {
    let filtered = [...this.state.books];
    
    // Apply filters
    if (this.state.filters.status !== 'all') {
      filtered = filtered.filter(book => {
        if (this.state.filters.status === 'available') return book.available;
        if (this.state.filters.status === 'borrowed') return !book.available;
        return true;
      });
    }
    
    if (this.state.filters.genre !== 'all') {
      filtered = filtered.filter(book => book.genre === this.state.filters.genre);
    }
    
    if (this.state.filters.author !== 'all') {
      filtered = filtered.filter(book => book.author === this.state.filters.author);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (this.state.sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'author':
          aVal = a.author.toLowerCase();
          bVal = b.author.toLowerCase();
          break;
        case 'date':
          aVal = new Date(a.addedDate || 0);
          bVal = new Date(b.addedDate || 0);
          break;
        case 'popularity':
          aVal = a.borrowCount || 0;
          bVal = b.borrowCount || 0;
          break;
        default:
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
      }
      
      if (aVal < bVal) return this.state.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.state.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.state.filteredBooks = filtered;
    this.render();
  }

  /**
   * Render component HTML
   */
  render() {
    this.innerHTML = `
      <div class="book-grid-container">
        ${this.renderToolbar()}
        ${this.renderFilters()}
        ${this.state.isLoading ? this.renderLoading() : this.renderContent()}
        ${this.renderPagination()}
      </div>
    `;
    
    this.setupEventListeners();
    this.addStyles();
  }

  /**
   * Render toolbar with view controls
   */
  renderToolbar() {
    return `
      <div class="grid-toolbar">
        <div class="toolbar-left">
          <div class="results-info">
            <span class="results-count">${this.state.filteredBooks.length}</span>
            <span class="results-label">libri trovati</span>
          </div>
          
          ${this.state.selectedBooks.size > 0 ? `
            <div class="selection-actions">
              <span class="selection-count">${this.state.selectedBooks.size} selezionati</span>
              <button class="btn btn-sm btn-ghost" data-action="clear-selection">
                Deseleziona tutto
              </button>
              <button class="btn btn-sm btn-primary" data-action="bulk-actions">
                Azioni ⌄
              </button>
            </div>
          ` : ''}
        </div>
        
        <div class="toolbar-right">
          <div class="sort-controls">
            <select class="sort-select" data-control="sortBy">
              <option value="title" ${this.state.sortBy === 'title' ? 'selected' : ''}>Titolo</option>
              <option value="author" ${this.state.sortBy === 'author' ? 'selected' : ''}>Autore</option>
              <option value="date" ${this.state.sortBy === 'date' ? 'selected' : ''}>Data aggiunta</option>
              <option value="popularity" ${this.state.sortBy === 'popularity' ? 'selected' : ''}>Popolarità</option>
            </select>
            
            <button class="sort-direction-btn ${this.state.sortOrder === 'desc' ? 'desc' : 'asc'}" 
                    data-control="sortOrder" 
                    title="Ordine: ${this.state.sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}">
              ${this.state.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
          <div class="page-size-controls">
            <label>Per pagina:</label>
            <select class="page-size-select" data-control="pageSize">
              <option value="10" ${this.state.pagination.limit === 10 ? 'selected' : ''}>10</option>
              <option value="20" ${this.state.pagination.limit === 20 ? 'selected' : ''}>20</option>
              <option value="50" ${this.state.pagination.limit === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${this.state.pagination.limit === 100 ? 'selected' : ''}>100</option>
            </select>
          </div>
          
          <div class="view-mode-controls">
            <button class="view-mode-btn ${this.state.viewMode === 'grid' ? 'active' : ''}" 
                    data-view="grid" title="Vista griglia">
              ⊞
            </button>
            <button class="view-mode-btn ${this.state.viewMode === 'list' ? 'active' : ''}" 
                    data-view="list" title="Vista lista">
              ☰
            </button>
            <button class="view-mode-btn ${this.state.viewMode === 'table' ? 'active' : ''}" 
                    data-view="table" title="Vista tabella">
              ⊟
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render filter controls
   */
  renderFilters() {
    return `
      <div class="grid-filters">
        <div class="filter-group">
          <label>Stato:</label>
          <select class="filter-select" data-filter="status">
            <option value="all">Tutti</option>
            <option value="available" ${this.state.filters.status === 'available' ? 'selected' : ''}>Disponibili</option>
            <option value="borrowed" ${this.state.filters.status === 'borrowed' ? 'selected' : ''}>In prestito</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Genere:</label>
          <select class="filter-select" data-filter="genre">
            <option value="all">Tutti i generi</option>
            ${Array.from(this.genres).sort().map(genre => `
              <option value="${genre}" ${this.state.filters.genre === genre ? 'selected' : ''}>
                ${genre}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="filter-group">
          <label>Autore:</label>
          <select class="filter-select" data-filter="author">
            <option value="all">Tutti gli autori</option>
            ${Array.from(this.authors).sort().map(author => `
              <option value="${author}" ${this.state.filters.author === author ? 'selected' : ''}>
                ${author}
              </option>
            `).join('')}
          </select>
        </div>
        
        <button class="filter-clear-btn" data-action="clear-filters">
          🗑️ Cancella filtri
        </button>
      </div>
    `;
  }

  /**
   * Render loading state
   */
  renderLoading() {
    return `
      <div class="grid-loading">
        <div class="loading-spinner"></div>
        <span>Caricamento libri...</span>
      </div>
    `;
  }

  /**
   * Render main content based on view mode
   */
  renderContent() {
    if (this.state.filteredBooks.length === 0) {
      return this.renderEmptyState();
    }
    
    switch (this.state.viewMode) {
      case 'grid':
        return this.renderGridView();
      case 'list':
        return this.renderListView();
      case 'table':
        return this.renderTableView();
      default:
        return this.renderGridView();
    }
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>Nessun libro trovato</h3>
        <p>Prova a modificare i filtri o aggiungi nuovi libri alla biblioteca</p>
        <button class="btn btn-primary" data-action="add-book">
          ➕ Aggiungi primo libro
        </button>
      </div>
    `;
  }

  /**
   * Render grid view
   */
  renderGridView() {
    return `
      <div class="books-grid grid-view">
        ${this.state.filteredBooks.map(book => this.renderGridCard(book)).join('')}
      </div>
    `;
  }

  /**
   * Render list view
   */
  renderListView() {
    return `
      <div class="books-grid list-view">
        ${this.state.filteredBooks.map(book => this.renderListCard(book)).join('')}
      </div>
    `;
  }

  /**
   * Render table view
   */
  renderTableView() {
    return `
      <div class="books-table">
        <table>
          <thead>
            <tr>
              <th>
                <input type="checkbox" class="select-all-checkbox" 
                       ${this.state.selectedBooks.size === this.state.filteredBooks.length && this.state.filteredBooks.length > 0 ? 'checked' : ''}>
              </th>
              <th>Copertina</th>
              <th>Titolo</th>
              <th>Autore</th>
              <th>Genere</th>
              <th>Stato</th>
              <th>Prestiti</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            ${this.state.filteredBooks.map(book => this.renderTableRow(book)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render grid card
   */
  renderGridCard(book) {
    const isSelected = this.state.selectedBooks.has(book.id);
    
    return `
      <div class="book-card grid-card ${isSelected ? 'selected' : ''}" data-book-id="${book.id}">
        <div class="card-selection">
          <input type="checkbox" class="book-checkbox" ${isSelected ? 'checked' : ''}>
        </div>
        
        <div class="card-cover">
          ${book.coverUrl ? `
            <img src="${book.coverUrl}" alt="${book.title}" loading="lazy">
          ` : `
            <div class="cover-placeholder">
              <span class="cover-icon">📖</span>
              <span class="cover-text">${book.title.substring(0, 3)}</span>
            </div>
          `}
          
          <div class="card-overlay">
            <button class="btn btn-sm btn-primary" data-action="view-book">
              👁️ Dettagli
            </button>
            <button class="btn btn-sm btn-ghost" data-action="edit-book">
              ✏️ Modifica
            </button>
          </div>
        </div>
        
        <div class="card-content">
          <h3 class="card-title" title="${book.title}">${book.title}</h3>
          <p class="card-author">${book.author}</p>
          <p class="card-genre">${book.genre || 'N/A'}</p>
          
          <div class="card-status">
            <span class="status-badge ${book.available ? 'available' : 'borrowed'}">
              ${book.available ? '✅ Disponibile' : '📅 In prestito'}
            </span>
          </div>
          
          <div class="card-stats">
            <span class="stat">
              <span class="stat-icon">📊</span>
              <span class="stat-value">${book.borrowCount || 0}</span>
              <span class="stat-label">prestiti</span>
            </span>
          </div>
        </div>
        
        <div class="card-actions">
          ${book.available ? `
            <button class="btn btn-sm btn-primary" data-action="loan-book">
              📅 Presta
            </button>
          ` : `
            <button class="btn btn-sm btn-warning" data-action="return-book">
              ↩️ Restituisci
            </button>
          `}
          
          <div class="card-menu">
            <button class="menu-trigger" data-action="show-menu">⋮</button>
            <div class="menu-dropdown">
              <a href="#" data-action="view-book">👁️ Visualizza</a>
              <a href="#" data-action="edit-book">✏️ Modifica</a>
              <a href="#" data-action="duplicate-book">📋 Duplica</a>
              <hr>
              <a href="#" data-action="delete-book" class="danger">🗑️ Elimina</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render list card
   */
  renderListCard(book) {
    const isSelected = this.state.selectedBooks.has(book.id);
    
    return `
      <div class="book-card list-card ${isSelected ? 'selected' : ''}" data-book-id="${book.id}">
        <div class="card-selection">
          <input type="checkbox" class="book-checkbox" ${isSelected ? 'checked' : ''}>
        </div>
        
        <div class="card-cover-small">
          ${book.coverUrl ? `
            <img src="${book.coverUrl}" alt="${book.title}">
          ` : `
            <div class="cover-placeholder-small">📖</div>
          `}
        </div>
        
        <div class="card-content">
          <div class="card-main">
            <h3 class="card-title">${book.title}</h3>
            <p class="card-subtitle">${book.author} • ${book.genre || 'N/A'}</p>
            <p class="card-description">${book.description || 'Nessuna descrizione disponibile'}</p>
          </div>
          
          <div class="card-meta">
            <span class="status-badge ${book.available ? 'available' : 'borrowed'}">
              ${book.available ? '✅ Disponibile' : '📅 In prestito'}
            </span>
            <span class="borrow-count">${book.borrowCount || 0} prestiti</span>
          </div>
        </div>
        
        <div class="card-actions">
          ${book.available ? `
            <button class="btn btn-sm btn-primary" data-action="loan-book">
              📅 Presta
            </button>
          ` : `
            <button class="btn btn-sm btn-warning" data-action="return-book">
              ↩️ Restituisci
            </button>
          `}
          
          <button class="btn btn-sm btn-ghost" data-action="edit-book">
            ✏️ Modifica
          </button>
          
          <div class="card-menu">
            <button class="menu-trigger" data-action="show-menu">⋮</button>
            <div class="menu-dropdown">
              <a href="#" data-action="view-book">👁️ Visualizza</a>
              <a href="#" data-action="edit-book">✏️ Modifica</a>
              <a href="#" data-action="duplicate-book">📋 Duplica</a>
              <hr>
              <a href="#" data-action="delete-book" class="danger">🗑️ Elimina</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render table row
   */
  renderTableRow(book) {
    const isSelected = this.state.selectedBooks.has(book.id);
    
    return `
      <tr class="book-row ${isSelected ? 'selected' : ''}" data-book-id="${book.id}">
        <td>
          <input type="checkbox" class="book-checkbox" ${isSelected ? 'checked' : ''}>
        </td>
        <td>
          <div class="table-cover">
            ${book.coverUrl ? `
              <img src="${book.coverUrl}" alt="${book.title}">
            ` : '📖'}
          </div>
        </td>
        <td>
          <div class="table-title">
            <strong>${book.title}</strong>
            ${book.subtitle ? `<br><small>${book.subtitle}</small>` : ''}
          </div>
        </td>
        <td>${book.author}</td>
        <td>
          <span class="genre-tag">${book.genre || 'N/A'}</span>
        </td>
        <td>
          <span class="status-badge ${book.available ? 'available' : 'borrowed'}">
            ${book.available ? '✅ Disponibile' : '📅 In prestito'}
          </span>
        </td>
        <td>
          <span class="borrow-count">${book.borrowCount || 0}</span>
        </td>
        <td>
          <div class="table-actions">
            ${book.available ? `
              <button class="btn btn-xs btn-primary" data-action="loan-book">Presta</button>
            ` : `
              <button class="btn btn-xs btn-warning" data-action="return-book">Restituisci</button>
            `}
            
            <div class="action-menu">
              <button class="menu-trigger" data-action="show-menu">⋮</button>
              <div class="menu-dropdown">
                <a href="#" data-action="view-book">👁️ Visualizza</a>
                <a href="#" data-action="edit-book">✏️ Modifica</a>
                <a href="#" data-action="duplicate-book">📋 Duplica</a>
                <hr>
                <a href="#" data-action="delete-book" class="danger">🗑️ Elimina</a>
              </div>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Render pagination
   */
  renderPagination() {
    if (this.state.pagination.totalPages <= 1) return '';
    
    const { page, totalPages } = this.state.pagination;
    const showPages = this.calculatePaginationPages(page, totalPages);
    
    return `
      <div class="grid-pagination">
        <div class="pagination-info">
          Pagina ${page} di ${totalPages} 
          (${this.state.filteredBooks.length} di ${this.state.pagination.total} libri)
        </div>
        
        <div class="pagination-controls">
          <button class="btn btn-sm ${page === 1 ? 'disabled' : ''}" 
                  data-page="1" ${page === 1 ? 'disabled' : ''}>
            ⏮️ Prima
          </button>
          
          <button class="btn btn-sm ${page === 1 ? 'disabled' : ''}" 
                  data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>
            ⬅️ Precedente
          </button>
          
          ${showPages.map(pageNum => `
            <button class="btn btn-sm ${pageNum === page ? 'active' : ''}" 
                    data-page="${pageNum}">
              ${pageNum}
            </button>
          `).join('')}
          
          <button class="btn btn-sm ${page === totalPages ? 'disabled' : ''}" 
                  data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>
            Successiva ➡️
          </button>
          
          <button class="btn btn-sm ${page === totalPages ? 'disabled' : ''}" 
                  data-page="${totalPages}" ${page === totalPages ? 'disabled' : ''}>
            Ultima ⏭️
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Calculate which page numbers to show in pagination
   */
  calculatePaginationPages(currentPage, totalPages) {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.addEventListener('click', (e) => {
      this.handleClick(e);
    });
    
    this.addEventListener('change', (e) => {
      this.handleChange(e);
    });
  }

  /**
   * Handle click events
   */
  handleClick(e) {
    const action = e.target.getAttribute('data-action');
    const page = e.target.getAttribute('data-page');
    const view = e.target.getAttribute('data-view');
    const bookId = e.target.closest('[data-book-id]')?.getAttribute('data-book-id');
    
    if (page) {
      this.goToPage(parseInt(page));
      return;
    }
    
    if (view) {
      this.changeViewMode(view);
      return;
    }
    
    if (action) {
      this.handleAction(action, bookId, e.target);
    }
  }

  /**
   * Handle change events
   */
  handleChange(e) {
    const control = e.target.getAttribute('data-control');
    const filter = e.target.getAttribute('data-filter');
    
    if (control) {
      this.handleControlChange(control, e.target.value);
    }
    
    if (filter) {
      this.handleFilterChange(filter, e.target.value);
    }
    
    if (e.target.classList.contains('book-checkbox')) {
      this.handleBookSelection(e.target);
    }
    
    if (e.target.classList.contains('select-all-checkbox')) {
      this.handleSelectAll(e.target.checked);
    }
  }

  /**
   * Handle various actions
   */
  handleAction(action, bookId, element) {
    switch (action) {
      case 'clear-filters':
        this.clearFilters();
        break;
        
      case 'clear-selection':
        this.clearSelection();
        break;
        
      case 'bulk-actions':
        this.showBulkActions(element);
        break;
        
      case 'add-book':
        this.dispatchEvent(new CustomEvent('add-book', { bubbles: true }));
        break;
        
      case 'view-book':
        this.dispatchEvent(new CustomEvent('view-book', { 
          bubbles: true, 
          detail: { bookId } 
        }));
        break;
        
      case 'edit-book':
        this.dispatchEvent(new CustomEvent('edit-book', { 
          bubbles: true, 
          detail: { bookId } 
        }));
        break;
        
      case 'loan-book':
        this.dispatchEvent(new CustomEvent('loan-book', { 
          bubbles: true, 
          detail: { bookId } 
        }));
        break;
        
      case 'return-book':
        this.dispatchEvent(new CustomEvent('return-book', { 
          bubbles: true, 
          detail: { bookId } 
        }));
        break;
        
      case 'delete-book':
        this.confirmDeleteBook(bookId);
        break;
        
      case 'duplicate-book':
        this.duplicateBook(bookId);
        break;
        
      case 'show-menu':
        this.toggleMenu(element);
        break;
    }
  }

  /**
   * Handle control changes (sorting, page size)
   */
  handleControlChange(control, value) {
    switch (control) {
      case 'sortBy':
        this.state.sortBy = value;
        localStorage.setItem('bookGrid-sortBy', value);
        this.applyFiltersAndSort();
        break;
        
      case 'sortOrder':
        this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
        localStorage.setItem('bookGrid-sortOrder', this.state.sortOrder);
        this.applyFiltersAndSort();
        break;
        
      case 'pageSize':
        this.state.pagination.limit = parseInt(value);
        this.state.pagination.page = 1;
        localStorage.setItem('bookGrid-pageSize', value);
        this.loadBooks();
        break;
    }
  }

  /**
   * Handle filter changes
   */
  handleFilterChange(filter, value) {
    this.state.filters[filter] = value;
    this.state.pagination.page = 1;
    this.applyFiltersAndSort();
  }

  /**
   * Handle individual book selection
   */
  handleBookSelection(checkbox) {
    const bookId = checkbox.closest('[data-book-id]').getAttribute('data-book-id');
    
    if (checkbox.checked) {
      this.state.selectedBooks.add(bookId);
    } else {
      this.state.selectedBooks.delete(bookId);
    }
    
    this.updateSelectionUI();
  }

  /**
   * Handle select all
   */
  handleSelectAll(checked) {
    if (checked) {
      this.state.filteredBooks.forEach(book => {
        this.state.selectedBooks.add(book.id);
      });
    } else {
      this.clearSelection();
    }
    
    this.updateSelectionUI();
  }

  /**
   * Update selection UI
   */
  updateSelectionUI() {
    this.render();
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    this.state.selectedBooks.clear();
    this.updateSelectionUI();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.state.filters = {
      status: 'all',
      genre: 'all',
      author: 'all'
    };
    this.state.pagination.page = 1;
    this.applyFiltersAndSort();
  }

  /**
   * Change view mode
   */
  changeViewMode(mode) {
    this.state.viewMode = mode;
    localStorage.setItem('bookGrid-viewMode', mode);
    this.render();
  }

  /**
   * Go to specific page
   */
  goToPage(page) {
    if (page < 1 || page > this.state.pagination.totalPages) return;
    
    this.state.pagination.page = page;
    this.loadBooks();
  }

  /**
   * Show error message
   */
  showError(message) {
    // This could be enhanced with a toast system
    console.error(message);
    alert(message);
  }

  /**
   * Confirm book deletion
   */
  async confirmDeleteBook(bookId) {
    if (!confirm('Sei sicuro di voler eliminare questo libro?')) return;
    
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete book');
      
      // Refresh data
      this.loadBooks();
      
    } catch (error) {
      this.showError('Errore durante l\'eliminazione del libro');
    }
  }

  /**
   * Duplicate book
   */
  async duplicateBook(bookId) {
    try {
      const book = this.state.books.find(b => b.id === bookId);
      if (!book) return;
      
      const duplicate = {
        ...book,
        id: undefined,
        title: `${book.title} (Copia)`,
        available: true
      };
      
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicate)
      });
      
      if (!response.ok) throw new Error('Failed to duplicate book');
      
      this.loadBooks();
      
    } catch (error) {
      this.showError('Errore durante la duplicazione del libro');
    }
  }

  /**
   * Toggle context menu
   */
  toggleMenu(trigger) {
    // Close other open menus
    this.querySelectorAll('.menu-dropdown.visible').forEach(menu => {
      if (menu !== trigger.nextElementSibling) {
        menu.classList.remove('visible');
      }
    });
    
    // Toggle current menu
    const menu = trigger.nextElementSibling;
    if (menu) {
      menu.classList.toggle('visible');
    }
  }

  /**
   * Show bulk actions menu
   */
  showBulkActions(button) {
    // Implementation for bulk actions dropdown
    console.log('Bulk actions for:', Array.from(this.state.selectedBooks));
  }

  /**
   * Add component styles
   */
  addStyles() {
    if (document.getElementById('book-grid-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'book-grid-styles';
    style.textContent = `
      .book-grid-container {
        width: 100%;
      }
      
      .grid-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4) 0;
        margin-bottom: var(--space-4);
        border-bottom: 1px solid var(--border);
        flex-wrap: wrap;
        gap: var(--space-4);
      }
      
      .toolbar-left {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        flex-wrap: wrap;
      }
      
      .results-info {
        display: flex;
        align-items: baseline;
        gap: var(--space-1);
      }
      
      .results-count {
        font-size: var(--text-xl);
        font-weight: 700;
        color: var(--primary);
      }
      
      .results-label {
        color: var(--text-secondary);
        font-size: var(--text-sm);
      }
      
      .selection-actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-4);
        background: var(--primary-light);
        border-radius: var(--radius-md);
      }
      
      .selection-count {
        font-weight: 600;
        color: var(--primary-dark);
        font-size: var(--text-sm);
      }
      
      .toolbar-right {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        flex-wrap: wrap;
      }
      
      .sort-controls {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      
      .sort-select {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: var(--space-2);
        font-size: var(--text-sm);
      }
      
      .sort-direction-btn {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: var(--space-2);
        font-size: var(--text-lg);
        cursor: pointer;
        transition: all var(--transition-fast);
        min-width: 36px;
      }
      
      .sort-direction-btn:hover {
        background: var(--surface-secondary);
      }
      
      .page-size-controls {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
      }
      
      .page-size-select {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: var(--space-1) var(--space-2);
        font-size: var(--text-sm);
      }
      
      .view-mode-controls {
        display: flex;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }
      
      .view-mode-btn {
        background: none;
        border: none;
        padding: var(--space-2);
        font-size: var(--text-lg);
        cursor: pointer;
        transition: all var(--transition-fast);
        border-right: 1px solid var(--border);
      }
      
      .view-mode-btn:last-child {
        border-right: none;
      }
      
      .view-mode-btn:hover {
        background: var(--surface-secondary);
      }
      
      .view-mode-btn.active {
        background: var(--primary);
        color: white;
      }
      
      .grid-filters {
        display: flex;
        align-items: end;
        gap: var(--space-4);
        margin-bottom: var(--space-6);
        padding: var(--space-4);
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
        flex-wrap: wrap;
      }
      
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        min-width: 120px;
      }
      
      .filter-group label {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
      }
      
      .filter-select {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: var(--space-2);
        font-size: var(--text-sm);
      }
      
      .filter-clear-btn {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
      }
      
      .filter-clear-btn:hover {
        background: var(--danger-light);
        border-color: var(--danger);
        color: var(--danger-dark);
      }
      
      .grid-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-8);
        color: var(--text-secondary);
      }
      
      .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--border);
        border-top: 2px solid var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .empty-state {
        text-align: center;
        padding: var(--space-12) var(--space-6);
      }
      
      .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--space-4);
      }
      
      .empty-state h3 {
        margin: 0 0 var(--space-2);
        color: var(--text-primary);
      }
      
      .empty-state p {
        color: var(--text-secondary);
        margin-bottom: var(--space-6);
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
      }
      
      /* Grid View */
      .books-grid.grid-view {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--space-6);
      }
      
      .grid-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        overflow: hidden;
        transition: all var(--transition-base);
        position: relative;
      }
      
      .grid-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary-light);
      }
      
      .grid-card.selected {
        border-color: var(--primary);
        box-shadow: 0 0 0 2px var(--primary-light);
      }
      
      .card-selection {
        position: absolute;
        top: var(--space-3);
        left: var(--space-3);
        z-index: 10;
      }
      
      .card-cover {
        position: relative;
        height: 200px;
        overflow: hidden;
      }
      
      .card-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .cover-placeholder {
        width: 100%;
        height: 100%;
        background: var(--gradient-card);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
      }
      
      .cover-icon {
        font-size: 3rem;
        margin-bottom: var(--space-2);
      }
      
      .cover-text {
        font-size: var(--text-xl);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      
      .card-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        opacity: 0;
        transition: opacity var(--transition-base);
      }
      
      .grid-card:hover .card-overlay {
        opacity: 1;
      }
      
      .card-content {
        padding: var(--space-4);
      }
      
      .card-title {
        margin: 0 0 var(--space-1);
        font-size: var(--text-lg);
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .card-author {
        margin: 0 0 var(--space-1);
        color: var(--text-secondary);
        font-size: var(--text-sm);
      }
      
      .card-genre {
        margin: 0 0 var(--space-3);
        color: var(--text-secondary);
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        font-weight: 600;
      }
      
      .status-badge.available {
        background: var(--success-light);
        color: var(--success-dark);
      }
      
      .status-badge.borrowed {
        background: var(--warning-light);
        color: var(--warning-dark);
      }
      
      .card-stats {
        margin-top: var(--space-3);
        display: flex;
        gap: var(--space-4);
      }
      
      .stat {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-xs);
        color: var(--text-secondary);
      }
      
      .stat-value {
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .card-actions {
        padding: var(--space-4);
        border-top: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .card-menu {
        position: relative;
      }
      
      .menu-trigger {
        background: none;
        border: none;
        padding: var(--space-1);
        font-size: var(--text-lg);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: background var(--transition-fast);
      }
      
      .menu-trigger:hover {
        background: var(--surface-secondary);
      }
      
      .menu-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        padding: var(--space-2);
        min-width: 150px;
        z-index: 100;
        display: none;
      }
      
      .menu-dropdown.visible {
        display: block;
      }
      
      .menu-dropdown a {
        display: block;
        padding: var(--space-2);
        color: var(--text-primary);
        text-decoration: none;
        border-radius: var(--radius-sm);
        font-size: var(--text-sm);
        transition: background var(--transition-fast);
      }
      
      .menu-dropdown a:hover {
        background: var(--surface-secondary);
      }
      
      .menu-dropdown a.danger {
        color: var(--danger);
      }
      
      .menu-dropdown a.danger:hover {
        background: var(--danger-light);
      }
      
      .menu-dropdown hr {
        border: none;
        border-top: 1px solid var(--border);
        margin: var(--space-1) 0;
      }
      
      /* List View */
      .books-grid.list-view {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }
      
      .list-card {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        transition: all var(--transition-base);
      }
      
      .list-card:hover {
        border-color: var(--primary-light);
        box-shadow: var(--shadow-md);
      }
      
      .list-card.selected {
        border-color: var(--primary);
        background: var(--primary-light);
      }
      
      .card-cover-small {
        width: 60px;
        height: 80px;
        flex-shrink: 0;
        border-radius: var(--radius-sm);
        overflow: hidden;
      }
      
      .card-cover-small img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .cover-placeholder-small {
        width: 100%;
        height: 100%;
        background: var(--gradient-card);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
      }
      
      .card-main {
        flex: 1;
        min-width: 0;
      }
      
      .card-subtitle {
        margin: 0 0 var(--space-2);
        color: var(--text-secondary);
        font-size: var(--text-sm);
      }
      
      .card-description {
        margin: 0;
        color: var(--text-secondary);
        font-size: var(--text-sm);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .card-meta {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        align-items: flex-end;
        text-align: right;
      }
      
      .borrow-count {
        font-size: var(--text-xs);
        color: var(--text-secondary);
      }
      
      /* Table View */
      .books-table {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }
      
      .books-table table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .books-table th {
        background: var(--surface-secondary);
        padding: var(--space-3);
        text-align: left;
        font-weight: 600;
        color: var(--text-secondary);
        font-size: var(--text-sm);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border);
      }
      
      .books-table td {
        padding: var(--space-3);
        border-bottom: 1px solid var(--border);
        vertical-align: middle;
      }
      
      .book-row:hover {
        background: var(--surface-secondary);
      }
      
      .book-row.selected {
        background: var(--primary-light);
      }
      
      .table-cover {
        width: 40px;
        height: 50px;
        border-radius: var(--radius-sm);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-secondary);
      }
      
      .table-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .table-title strong {
        color: var(--text-primary);
      }
      
      .table-title small {
        color: var(--text-secondary);
      }
      
      .genre-tag {
        background: var(--surface-secondary);
        color: var(--text-secondary);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .table-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      
      .action-menu {
        position: relative;
      }
      
      /* Pagination */
      .grid-pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: var(--space-6);
        padding-top: var(--space-4);
        border-top: 1px solid var(--border);
        flex-wrap: wrap;
        gap: var(--space-4);
      }
      
      .pagination-info {
        color: var(--text-secondary);
        font-size: var(--text-sm);
      }
      
      .pagination-controls {
        display: flex;
        gap: var(--space-1);
      }
      
      .pagination-controls .btn {
        min-width: auto;
        padding: var(--space-2) var(--space-3);
      }
      
      .pagination-controls .btn.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }
      
      .pagination-controls .btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      /* Responsive Design */
      @media (max-width: 1024px) {
        .books-grid.grid-view {
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        }
        
        .toolbar-right {
          flex-wrap: wrap;
        }
      }
      
      @media (max-width: 768px) {
        .grid-toolbar {
          flex-direction: column;
          align-items: stretch;
        }
        
        .toolbar-left,
        .toolbar-right {
          justify-content: space-between;
        }
        
        .books-grid.grid-view {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-4);
        }
        
        .grid-filters {
          flex-direction: column;
          align-items: stretch;
        }
        
        .filter-group {
          min-width: auto;
        }
        
        .list-card {
          flex-direction: column;
          align-items: stretch;
          text-align: center;
        }
        
        .card-meta {
          align-items: center;
          text-align: center;
        }
        
        .books-table {
          overflow-x: auto;
        }
        
        .pagination-controls {
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .grid-pagination {
          flex-direction: column;
          text-align: center;
        }
      }
      
      @media (max-width: 480px) {
        .books-grid.grid-view {
          grid-template-columns: 1fr;
        }
        
        .view-mode-controls {
          width: 100%;
          justify-content: center;
        }
        
        .card-actions {
          flex-direction: column;
          gap: var(--space-2);
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}
