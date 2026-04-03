
// src/services/connectionService.js
class ConnectionService {
  constructor() {
    this.listeners = [];
    this.isOnline = navigator.onLine;
    this.connectionType = 'unknown';
    this.isSlow = false;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notify('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notify('offline');
    });

    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.connectionType = connection.effectiveType;
      this.isSlow = connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g';
      
      connection.addEventListener('change', () => {
        this.connectionType = connection.effectiveType;
        this.isSlow = connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g';
        this.notify('quality', { type: this.connectionType, isSlow: this.isSlow });
      });
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  notify(event, data = {}) {
    this.listeners.forEach(callback => callback(event, { ...data, isOnline: this.isOnline, isSlow: this.isSlow }));
  }

  checkConnection() {
    return this.isOnline;
  }

  isSlowConnection() {
    return this.isSlow;
  }
}

export default new ConnectionService();
