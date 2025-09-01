export class NotificationManager {
  constructor() {
    this.container = document.getElementById('notifications') || this.createContainer();
  }

  createContainer() {
    const c = document.createElement('div');
    c.id = 'notifications';
    c.className = 'notifications-container';
    document.body.appendChild(c);
    return c;
  }

  async showPermissionRequest() {
    if (!('Notification' in window)) return this.show('Notifiche non supportate', 'warning');
    try {
      const res = await Notification.requestPermission();
      this.show(res === 'granted' ? 'Permesso notifiche concesso' : 'Permesso notifiche negato', 'info');
    } catch (e) {
      this.show('Errore richiesta permessi', 'error');
    }
  }

  show(message, type = 'info', timeout = 4000) {
    // browser notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Digital Library', { body: message, icon: '/src/assets/icons/favicon.svg' });
    }

    // in-app toast
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    this.container.appendChild(el);
    setTimeout(() => {
      el.classList.add('visible');
    }, 10);
    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 400);
    }, timeout);
  }
}
