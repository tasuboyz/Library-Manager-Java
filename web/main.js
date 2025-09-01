// Digital Library Manager - Frontend Application
// Modern JavaScript ES6+ implementation with dark theme

class DigitalLibraryApp {
    constructor() {
        this.api = new ApiClient();
        this.ui = new UIManager();
        this.data = {
            books: [],
            users: [],
            loans: []
        };
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadAllData();
        this.ui.updateStats(this.data);
        this.ui.showSection('books');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.ui.showSection(section);
                this.ui.setActiveNavButton(e.target);
            });
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadAllData();
        });

        // Add buttons
        document.getElementById('add-book-btn').addEventListener('click', () => {
            this.ui.showModal('book-modal');
        });

        document.getElementById('add-user-btn').addEventListener('click', () => {
            this.ui.showModal('user-modal');
        });

        document.getElementById('add-loan-btn').addEventListener('click', () => {
            this.ui.showModal('loan-modal');
            this.populateLoanSelects();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-close')) {
                    this.ui.hideModal(e.target.closest('.modal').id);
                } else {
                    this.ui.hideModal(e.target.closest('.modal').id);
                }
            });
        });

        // Forms
        document.getElementById('book-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBookSubmit();
        });

        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserSubmit();
        });

        document.getElementById('loan-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLoanSubmit();
        });

        // Search and filters
        document.getElementById('books-search').addEventListener('input', (e) => {
            this.filterBooks(e.target.value);
        });

        document.getElementById('users-search').addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        document.getElementById('loans-search').addEventListener('input', (e) => {
            this.filterLoans(e.target.value);
        });

        document.getElementById('genre-filter').addEventListener('change', (e) => {
            this.filterBooks(document.getElementById('books-search').value, e.target.value);
        });

        document.getElementById('availability-filter').addEventListener('change', (e) => {
            this.filterBooks(
                document.getElementById('books-search').value,
                document.getElementById('genre-filter').value,
                e.target.value
            );
        });

        document.getElementById('loan-status-filter').addEventListener('change', (e) => {
            this.filterLoans(document.getElementById('loans-search').value, e.target.value);
        });

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.ui.hideModal(modal.id);
                }
            });
        });
    }

    async loadAllData() {
        this.ui.showLoading();
        try {
            const [books, users, loans] = await Promise.all([
                this.api.getBooks(),
                this.api.getUsers(),
                this.api.getLoans()
            ]);

            this.data.books = books;
            this.data.users = users;
            this.data.loans = loans;

            this.ui.renderBooks(books);
            this.ui.renderUsers(users);
            this.ui.renderLoans(loans);
            this.ui.updateStats(this.data);
            this.ui.generateGenreChart(books);

        } catch (error) {
            this.ui.showToast('Errore nel caricamento dei dati', 'error');
            console.error('Error loading data:', error);
        } finally {
            this.ui.hideLoading();
        }
    }

    async handleBookSubmit() {
        const formData = {
            title: document.getElementById('book-title').value.trim(),
            author: document.getElementById('book-author').value.trim(),
            genre: document.getElementById('book-genre').value,
            publicationYear: parseInt(document.getElementById('book-year').value),
            isbn: document.getElementById('book-isbn').value.trim()
        };

        if (!formData.title || !formData.author || !formData.genre || !formData.publicationYear) {
            this.ui.showToast('Tutti i campi obbligatori devono essere compilati', 'error');
            return;
        }

        try {
            this.ui.showLoading();
            const newBook = await this.api.createBook(formData);
            this.data.books.push(newBook);
            this.ui.renderBooks(this.data.books);
            this.ui.updateStats(this.data);
            this.ui.generateGenreChart(this.data.books);
            this.ui.hideModal('book-modal');
            this.ui.showToast('Libro aggiunto con successo!', 'success');
            document.getElementById('book-form').reset();
        } catch (error) {
            this.ui.showToast('Errore nell\'aggiunta del libro', 'error');
            console.error('Error adding book:', error);
        } finally {
            this.ui.hideLoading();
        }
    }

    async handleUserSubmit() {
        const formData = {
            name: document.getElementById('user-name').value.trim(),
            email: document.getElementById('user-email').value.trim()
        };

        if (!formData.name || !formData.email) {
            this.ui.showToast('Nome e email sono obbligatori', 'error');
            return;
        }

        if (!this.isValidEmail(formData.email)) {
            this.ui.showToast('Inserisci un indirizzo email valido', 'error');
            return;
        }

        try {
            this.ui.showLoading();
            const newUser = await this.api.createUser(formData);
            this.data.users.push(newUser);
            this.ui.renderUsers(this.data.users);
            this.ui.updateStats(this.data);
            this.ui.hideModal('user-modal');
            this.ui.showToast('Utente registrato con successo!', 'success');
            document.getElementById('user-form').reset();
        } catch (error) {
            this.ui.showToast('Errore nella registrazione dell\'utente', 'error');
            console.error('Error adding user:', error);
        } finally {
            this.ui.hideLoading();
        }
    }

    async handleLoanSubmit() {
        const formData = {
            bookId: document.getElementById('loan-book').value,
            userId: document.getElementById('loan-user').value,
            days: parseInt(document.getElementById('loan-days').value)
        };

        if (!formData.bookId || !formData.userId || !formData.days) {
            this.ui.showToast('Tutti i campi sono obbligatori', 'error');
            return;
        }

        try {
            this.ui.showLoading();
            const newLoan = await this.api.createLoan(formData);
            
            // Update book availability
            const book = this.data.books.find(b => b.id === formData.bookId);
            if (book) {
                book.available = false;
            }

            // Reload data to get enriched loan info
            await this.loadAllData();
            
            this.ui.hideModal('loan-modal');
            this.ui.showToast('Prestito creato con successo!', 'success');
            document.getElementById('loan-form').reset();
        } catch (error) {
            this.ui.showToast('Errore nella creazione del prestito', 'error');
            console.error('Error creating loan:', error);
        } finally {
            this.ui.hideLoading();
        }
    }

    async returnLoan(loanId) {
        try {
            this.ui.showLoading();
            await this.api.returnLoan(loanId);
            
            // Reload data to update loan status and book availability
            await this.loadAllData();
            
            this.ui.showToast('Libro restituito con successo!', 'success');
        } catch (error) {
            this.ui.showToast('Errore nella restituzione del libro', 'error');
            console.error('Error returning loan:', error);
        } finally {
            this.ui.hideLoading();
        }
    }

    populateLoanSelects() {
        const bookSelect = document.getElementById('loan-book');
        const userSelect = document.getElementById('loan-user');

        // Clear existing options
        bookSelect.innerHTML = '<option value="">Seleziona libro</option>';
        userSelect.innerHTML = '<option value="">Seleziona utente</option>';

        // Populate available books
        this.data.books
            .filter(book => book.available)
            .forEach(book => {
                const option = document.createElement('option');
                option.value = book.id;
                option.textContent = `${book.title} - ${book.author}`;
                bookSelect.appendChild(option);
            });

        // Populate users
        this.data.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (${user.email})`;
            userSelect.appendChild(option);
        });
    }

    filterBooks(searchTerm = '', genre = '', availability = '') {
        let filteredBooks = [...this.data.books];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(term) ||
                book.author.toLowerCase().includes(term) ||
                book.isbn.toLowerCase().includes(term)
            );
        }

        if (genre) {
            filteredBooks = filteredBooks.filter(book => book.genre === genre);
        }

        if (availability) {
            filteredBooks = filteredBooks.filter(book => 
                availability === 'available' ? book.available : !book.available
            );
        }

        this.ui.renderBooks(filteredBooks);
    }

    filterUsers(searchTerm = '') {
        let filteredUsers = [...this.data.users];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredUsers = filteredUsers.filter(user =>
                user.name.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term)
            );
        }

        this.ui.renderUsers(filteredUsers);
    }

    filterLoans(searchTerm = '', status = '') {
        let filteredLoans = [...this.data.loans];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredLoans = filteredLoans.filter(loan =>
                loan.bookTitle.toLowerCase().includes(term) ||
                loan.userName.toLowerCase().includes(term)
            );
        }

        if (status) {
            const now = new Date();
            filteredLoans = filteredLoans.filter(loan => {
                const isReturned = loan.returnedAt && loan.returnedAt.trim() !== '';
                const dueDate = new Date(loan.dueAt);
                const isOverdue = !isReturned && dueDate < now;

                switch (status) {
                    case 'active':
                        return !isReturned;
                    case 'returned':
                        return isReturned;
                    case 'overdue':
                        return isOverdue;
                    default:
                        return true;
                }
            });
        }

        this.ui.renderLoans(filteredLoans);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

class ApiClient {
    constructor() {
        this.baseUrl = '/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        };

        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async getBooks() {
        return this.request('/books');
    }

    async createBook(bookData) {
        return this.request('/books', {
            method: 'POST',
            body: JSON.stringify(bookData),
        });
    }

    async getUsers() {
        return this.request('/users');
    }

    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async getLoans() {
        return this.request('/loans');
    }

    async createLoan(loanData) {
        return this.request('/loans', {
            method: 'POST',
            body: JSON.stringify(loanData),
        });
    }

    async returnLoan(loanId) {
        return this.request(`/loans/${loanId}/return`, {
            method: 'POST',
        });
    }
}

class UIManager {
    constructor() {
        this.currentSection = 'books';
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        document.getElementById(`${sectionName}-section`).classList.add('active');
        this.currentSection = sectionName;
    }

    setActiveNavButton(activeButton) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    renderBooks(books) {
        const container = document.getElementById('books-grid');
        
        if (books.length === 0) {
            container.innerHTML = this.createEmptyState('📚', 'Nessun libro trovato', 'Aggiungi il primo libro alla libreria');
            return;
        }

        container.innerHTML = books.map(book => this.createBookCard(book)).join('');
    }

    createBookCard(book) {
        const statusClass = book.available ? 'available' : 'unavailable';
        const statusText = book.available ? 'Disponibile' : 'Non disponibile';
        
        return `
            <div class="card book-card">
                <div class="book-status ${statusClass}">${statusText}</div>
                <div class="book-card-header">
                    <div>
                        <div class="book-title">${this.escapeHtml(book.title)}</div>
                        <div class="book-author">di ${this.escapeHtml(book.author)}</div>
                    </div>
                </div>
                <div class="book-meta">
                    <span class="book-genre">${this.escapeHtml(book.genre)}</span>
                    <span class="book-year">${book.publicationYear}</span>
                </div>
                ${book.isbn ? `<p><strong>ISBN:</strong> ${this.escapeHtml(book.isbn)}</p>` : ''}
                <div class="book-actions">
                    <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${book.id}')">
                        📋 Copia ID
                    </button>
                </div>
            </div>
        `;
    }

    renderUsers(users) {
        const container = document.getElementById('users-grid');
        
        if (users.length === 0) {
            container.innerHTML = this.createEmptyState('👥', 'Nessun utente trovato', 'Registra il primo utente');
            return;
        }

        container.innerHTML = users.map(user => this.createUserCard(user)).join('');
    }

    createUserCard(user) {
        const registeredDate = user.registeredAt ? 
            new Date(user.registeredAt).toLocaleDateString('it-IT') : 'Data non disponibile';
        
        return `
            <div class="card user-card">
                <div class="user-card-header">
                    <div class="user-name">${this.escapeHtml(user.name)}</div>
                    <div class="user-email">${this.escapeHtml(user.email)}</div>
                    <div class="user-registered">Registrato il ${registeredDate}</div>
                </div>
            </div>
        `;
    }

    renderLoans(loans) {
        const container = document.getElementById('loans-grid');
        
        if (loans.length === 0) {
            container.innerHTML = this.createEmptyState('📖', 'Nessun prestito trovato', 'Crea il primo prestito');
            return;
        }

        container.innerHTML = loans.map(loan => this.createLoanCard(loan)).join('');
    }

    createLoanCard(loan) {
        const isReturned = loan.returnedAt && loan.returnedAt.trim() !== '';
        const dueDate = new Date(loan.dueAt);
        const now = new Date();
        const isOverdue = !isReturned && dueDate < now;
        
        let statusClass, statusText;
        if (isReturned) {
            statusClass = 'returned';
            statusText = 'Restituito';
        } else if (isOverdue) {
            statusClass = 'overdue';
            statusText = 'In ritardo';
        } else {
            statusClass = 'active';
            statusText = 'Attivo';
        }

        const loanedDate = loan.loanedAt ? 
            new Date(loan.loanedAt).toLocaleDateString('it-IT') : 'N/A';
        const dueDateStr = dueDate.toLocaleDateString('it-IT');
        const returnedDate = isReturned ? 
            new Date(loan.returnedAt).toLocaleDateString('it-IT') : 'Non restituito';

        return `
            <div class="card loan-card">
                <div class="loan-status ${statusClass}">${statusText}</div>
                <div class="loan-info">
                    <div class="loan-book">${this.escapeHtml(loan.bookTitle)}</div>
                    <div class="loan-user">Prestato a: ${this.escapeHtml(loan.userName)}</div>
                </div>
                <div class="loan-dates">
                    <div class="loan-date">
                        <div class="loan-date-label">Data prestito</div>
                        <div class="loan-date-value">${loanedDate}</div>
                    </div>
                    <div class="loan-date">
                        <div class="loan-date-label">Scadenza</div>
                        <div class="loan-date-value">${dueDateStr}</div>
                    </div>
                </div>
                ${isReturned ? `
                    <div class="loan-date">
                        <div class="loan-date-label">Data restituzione</div>
                        <div class="loan-date-value">${returnedDate}</div>
                    </div>
                ` : ''}
                <div class="loan-actions">
                    ${!isReturned ? `
                        <button class="btn btn-success" onclick="app.returnLoan('${loan.id}')">
                            ✅ Restituisci
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    updateStats(data) {
        const totalBooks = data.books.length;
        const totalUsers = data.users.length;
        const activeLoans = data.loans.filter(loan => !loan.returnedAt || loan.returnedAt.trim() === '').length;
        const availableBooks = data.books.filter(book => book.available).length;

        document.getElementById('total-books').textContent = totalBooks;
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('active-loans').textContent = activeLoans;
        document.getElementById('available-books').textContent = availableBooks;
    }

    generateGenreChart(books) {
        const genreCounts = {};
        books.forEach(book => {
            genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
        });

        const chartContainer = document.getElementById('genre-chart');
        const maxCount = Math.max(...Object.values(genreCounts));

        if (maxCount === 0) {
            chartContainer.innerHTML = '<p class="text-muted">Nessun dato disponibile</p>';
            return;
        }

        chartContainer.innerHTML = Object.entries(genreCounts)
            .map(([genre, count]) => {
                const height = (count / maxCount) * 200;
                return `
                    <div class="chart-bar" style="height: ${height}px;">
                        <div class="chart-bar-value">${count}</div>
                        <div class="chart-bar-label">${genre}</div>
                    </div>
                `;
            })
            .join('');
    }

    createEmptyState(icon, title, description) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = '';
    }

    showLoading() {
        document.getElementById('loading').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loading').classList.remove('active');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 5000);

        // Allow manual close
        toast.addEventListener('click', () => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DigitalLibraryApp();
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
