import { animateCounter, easeOutCubic } from '../utils/AnimationObserver.js';

/**
 * Dashboard Hero Component
 * Shows library statistics with animated counters
 */
export class DashboardHero extends HTMLElement {
  constructor() {
    super();
    this.stats = {
      totalBooks: 0,
      availableBooks: 0,
      totalUsers: 0,
      activeLoans: 0,
      overdueLoans: 0
    };
    
    this.hasAnimated = false;
  }

  connectedCallback() {
    this.render();
    this.setupStoreSubscription();
    this.setupIntersectionObserver();
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Subscribe to store updates
   */
  setupStoreSubscription() {
    if (window.app && window.app.store) {
      this.unsubscribe = window.app.store.subscribe('stats', (stats) => {
        this.stats = { ...this.stats, ...stats };
        this.updateStats();
      });
    }
  }

  /**
   * Setup intersection observer for animation trigger
   */
  setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.hasAnimated) {
            this.animateCounters();
            this.hasAnimated = true;
          }
        });
      },
      { threshold: 0.3 }
    );
    
    this.observer.observe(this);
  }

  /**
   * Render component HTML
   */
  render() {
    this.innerHTML = `
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              📚 <span class="gradient-text">Digital Library</span>
            </h1>
            <p class="hero-subtitle">
              Gestisci la tua biblioteca con stile e intelligenza
            </p>
            <div class="hero-actions">
              <button class="btn btn-primary" data-action="add-book">
                ➕ Aggiungi Libro
              </button>
              <button class="btn btn-ghost" data-action="import-books">
                📁 Importa Catalogo
              </button>
            </div>
          </div>
          
          <div class="hero-visual">
            <div class="floating-books">
              <div class="book-icon">📖</div>
              <div class="book-icon">📚</div>
              <div class="book-icon">📝</div>
            </div>
          </div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card" data-stat="totalBooks">
            <div class="stat-icon">📖</div>
            <div class="stat-value" data-counter="0">0</div>
            <div class="stat-label">Libri Totali</div>
            <div class="stat-trend">
              <span class="trend-icon">📈</span>
              <span class="trend-text">+12% questo mese</span>
            </div>
          </div>
          
          <div class="stat-card" data-stat="availableBooks">
            <div class="stat-icon">✅</div>
            <div class="stat-value" data-counter="0">0</div>
            <div class="stat-label">Disponibili</div>
            <div class="stat-trend">
              <span class="trend-icon">🟢</span>
              <span class="trend-text">Pronti per il prestito</span>
            </div>
          </div>
          
          <div class="stat-card" data-stat="totalUsers">
            <div class="stat-icon">👥</div>
            <div class="stat-value" data-counter="0">0</div>
            <div class="stat-label">Utenti Attivi</div>
            <div class="stat-trend">
              <span class="trend-icon">👆</span>
              <span class="trend-text">+5 nuovi questa settimana</span>
            </div>
          </div>
          
          <div class="stat-card" data-stat="activeLoans">
            <div class="stat-icon">📅</div>
            <div class="stat-value" data-counter="0">0</div>
            <div class="stat-label">Prestiti Attivi</div>
            <div class="stat-trend">
              <span class="trend-icon">⏰</span>
              <span class="trend-text">Da restituire</span>
            </div>
          </div>
          
          <div class="stat-card alert ${this.stats.overdueLoans > 0 ? 'visible' : ''}" data-stat="overdueLoans">
            <div class="stat-icon">⚠️</div>
            <div class="stat-value" data-counter="0">0</div>
            <div class="stat-label">In Ritardo</div>
            <div class="stat-trend">
              <span class="trend-icon">🚨</span>
              <span class="trend-text">Richiedono attenzione</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
    this.addStyles();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      if (action) {
        this.handleAction(action);
      }
    });
  }

  /**
   * Handle action buttons
   * @param {string} action - Action to perform
   */
  handleAction(action) {
    switch (action) {
      case 'add-book':
        this.dispatchEvent(new CustomEvent('add-book', {
          bubbles: true,
          detail: { source: 'hero' }
        }));
        break;
        
      case 'import-books':
        this.dispatchEvent(new CustomEvent('import-books', {
          bubbles: true,
          detail: { source: 'hero' }
        }));
        break;
    }
  }

  /**
   * Update statistics display
   */
  updateStats() {
    Object.keys(this.stats).forEach(key => {
      const card = this.querySelector(`[data-stat="${key}"]`);
      if (card) {
        const valueEl = card.querySelector('.stat-value');
        if (valueEl) {
          valueEl.setAttribute('data-counter', this.stats[key]);
          
          // Show/hide overdue card
          if (key === 'overdueLoans') {
            card.classList.toggle('visible', this.stats[key] > 0);
          }
        }
      }
    });
  }

  /**
   * Animate counters
   */
  animateCounters() {
    const counterElements = this.querySelectorAll('[data-counter]');
    
    counterElements.forEach((el, index) => {
      const target = parseInt(el.getAttribute('data-counter')) || 0;
      const delay = index * 150; // Stagger animations
      
      setTimeout(() => {
        animateCounter(el, target, 1500);
      }, delay);
    });
    
    // Animate stat cards
    const statCards = this.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
      setTimeout(() => {
        card.style.animation = `scaleIn 0.6s ease-out ${index * 0.1}s both`;
      }, index * 100);
    });
  }

  /**
   * Add component styles
   */
  addStyles() {
    if (document.getElementById('dashboard-hero-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'dashboard-hero-styles';
    style.textContent = `
      .hero-container {
        background: var(--gradient-hero);
        border-radius: var(--radius-xl);
        padding: var(--space-8);
        margin-bottom: var(--space-8);
        color: white;
        position: relative;
        overflow: hidden;
      }
      
      .hero-content {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--space-8);
        align-items: center;
        margin-bottom: var(--space-8);
      }
      
      .hero-title {
        font-size: var(--text-4xl);
        font-weight: 700;
        margin-bottom: var(--space-4);
        line-height: 1.2;
      }
      
      .gradient-text {
        background: linear-gradient(45deg, #fff, #e0f2fe);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .hero-subtitle {
        font-size: var(--text-lg);
        opacity: 0.9;
        margin-bottom: var(--space-6);
        max-width: 500px;
      }
      
      .hero-actions {
        display: flex;
        gap: var(--space-4);
        flex-wrap: wrap;
      }
      
      .hero-visual {
        position: relative;
        width: 200px;
        height: 150px;
      }
      
      .floating-books {
        position: relative;
        width: 100%;
        height: 100%;
      }
      
      .book-icon {
        position: absolute;
        font-size: 2rem;
        animation: float 3s ease-in-out infinite;
        opacity: 0.8;
      }
      
      .book-icon:nth-child(1) {
        top: 20%;
        left: 10%;
        animation-delay: 0s;
      }
      
      .book-icon:nth-child(2) {
        top: 60%;
        left: 60%;
        animation-delay: 1s;
      }
      
      .book-icon:nth-child(3) {
        top: 10%;
        right: 10%;
        animation-delay: 2s;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }
      
      .stat-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        text-align: center;
        transition: all var(--transition-base);
        opacity: 0;
        transform: scale(0.9);
      }
      
      .stat-card:hover {
        transform: translateY(-4px) scale(1.02);
        background: rgba(255, 255, 255, 0.15);
      }
      
      .stat-card.alert {
        display: none;
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }
      
      .stat-card.alert.visible {
        display: block;
      }
      
      .stat-icon {
        font-size: 2rem;
        margin-bottom: var(--space-2);
        display: block;
      }
      
      .stat-value {
        font-size: var(--text-3xl);
        font-weight: 700;
        margin-bottom: var(--space-1);
        display: block;
      }
      
      .stat-label {
        font-size: var(--text-sm);
        opacity: 0.9;
        margin-bottom: var(--space-2);
        font-weight: 500;
      }
      
      .stat-trend {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-1);
        font-size: var(--text-xs);
        opacity: 0.8;
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        25% { transform: translateY(-10px) rotate(2deg); }
        50% { transform: translateY(-5px) rotate(-1deg); }
        75% { transform: translateY(-15px) rotate(1deg); }
      }
      
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @media (max-width: 768px) {
        .hero-container {
          padding: var(--space-6);
        }
        
        .hero-content {
          grid-template-columns: 1fr;
          text-align: center;
        }
        
        .hero-title {
          font-size: var(--text-3xl);
        }
        
        .hero-visual {
          width: 150px;
          height: 100px;
          margin: 0 auto;
        }
        
        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-3);
        }
        
        .stat-card {
          padding: var(--space-4);
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}
