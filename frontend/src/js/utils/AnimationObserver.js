/**
 * Animation Observer - Handles scroll-based animations
 */
export class AnimationObserver {
  constructor() {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );
    
    this.animatedElements = new Set();
  }

  /**
   * Observe element for animations
   * @param {HTMLElement} element - Element to observe
   */
  observe(element) {
    if (!element) return;
    
    // Add animation delay based on element position
    const delay = Math.random() * 200;
    element.style.setProperty('--animation-delay', `${delay}ms`);
    
    this.observer.observe(element);
  }

  /**
   * Stop observing element
   * @param {HTMLElement} element - Element to unobserve
   */
  unobserve(element) {
    if (!element) return;
    this.observer.unobserve(element);
  }

  /**
   * Handle intersection changes
   * @param {IntersectionObserverEntry[]} entries - Observed entries
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
        this.animateElement(entry.target);
        this.animatedElements.add(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }

  /**
   * Animate element into view
   * @param {HTMLElement} element - Element to animate
   */
  animateElement(element) {
    const animationType = element.getAttribute('data-animate') || 'fadeInUp';
    
    element.classList.add('animate-in');
    element.style.animationName = animationType;
    
    // Remove animation class after completion
    element.addEventListener('animationend', () => {
      element.classList.remove('animate-in');
    }, { once: true });
  }

  /**
   * Disconnect observer
   */
  disconnect() {
    this.observer.disconnect();
    this.animatedElements.clear();
  }

  /**
   * Reset all animations (useful for testing)
   */
  reset() {
    this.animatedElements.clear();
    document.querySelectorAll('.animate-in').forEach(el => {
      el.classList.remove('animate-in');
    });
  }
}

/**
 * Counter Animation Utility
 * @param {HTMLElement} element - Element containing the number
 * @param {number} target - Target number
 * @param {number} duration - Animation duration in ms
 */
export function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const current = Math.floor(start + (target - start) * easeOutCubic(progress));
    element.textContent = current.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

/**
 * Easing function for smooth animations
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for bouncy animations
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value
 */
export function easeOutBounce(t) {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  } else if (t < 2 / 2.75) {
    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  } else if (t < 2.5 / 2.75) {
    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  } else {
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  }
}
