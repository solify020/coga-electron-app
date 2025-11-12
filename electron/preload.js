const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App control methods
  platform: process.platform,
  version: process.versions.electron,
  
  // File system access (if needed in future)
  // showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  // showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Notifications (if needed in future)
  // showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Get app info
  getAppInfo: () => ({
    name: 'COGA',
    version: '0.1.0',
    description: 'Real-Time Stress Detection & Intervention System'
  }),
  
  // Development tools access
  isDev: process.env.NODE_ENV === 'development',
  
  // Open external links safely
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Log to main process (for debugging)
  log: (message) => ipcRenderer.invoke('log', message),
  
  // System monitoring API (NEW!)
  systemMonitoring: {
    // Start/stop system monitoring
    start: () => ipcRenderer.invoke('start-system-monitoring'),
    stop: () => ipcRenderer.invoke('stop-system-monitoring'),
    
    // Get system events for analysis
    getEvents: (options = {}) => ipcRenderer.invoke('get-system-events', options),
    
    // Get current system status
    getStatus: () => ipcRenderer.invoke('get-system-status'),
    
    // Listen for real-time activity updates
    onActivityUpdate: (callback) => {
      ipcRenderer.removeAllListeners('system-activity-update');
      ipcRenderer.on('system-activity-update', callback);
    },
    
    // Remove activity update listener
    removeActivityListener: () => {
      ipcRenderer.removeAllListeners('system-activity-update');
    }
  },
  
  // Custom events for COGA
  onAppReady: (callback) => ipcRenderer.on('app-ready', callback),
  onAppClosed: (callback) => ipcRenderer.on('app-closed', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Define what the renderer process can access
contextBridge.exposeInMainWorld('COGAElectron', {
  // Make it clear this is running in Electron
  isElectronApp: true,
  platform: process.platform,
  
  // App metadata
  appInfo: {
    name: 'COGA',
    version: '0.1.0',
    description: 'Real-Time Stress Detection & Intervention System'
  },
  
  // UI helpers specific to desktop
  desktop: {
    // Platform-specific CSS class for styling
    getPlatformClass: () => {
      const platform = process.platform;
      if (platform === 'win32') return 'windows';
      if (platform === 'darwin') return 'macos';
      return 'linux';
    },
    
    // Title bar height (useful for fullscreen layouts)
    getTitleBarHeight: () => {
      // This could be calculated based on platform
      return process.platform === 'darwin' ? 28 : 32;
    },
    
    // Show a desktop notification
    notify: (title, body) => {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    },
    
    // Clipboard access
    copyToClipboard: (text) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          document.body.removeChild(textArea);
          return Promise.resolve();
        } catch (err) {
          document.body.removeChild(textArea);
          return Promise.reject(err);
        }
      }
    },
    
    // Local storage with Electron security
    storage: {
      set: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (e) {
          console.error('Storage set error:', e);
          return false;
        }
      },
      
      get: (key, defaultValue = null) => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
          console.error('Storage get error:', e);
          return defaultValue;
        }
      },
      
      remove: (key) => {
        try {
          localStorage.removeItem(key);
          return true;
        } catch (e) {
          console.error('Storage remove error:', e);
          return false;
        }
      },
      
      clear: () => {
        try {
          localStorage.clear();
          return true;
        } catch (e) {
          console.error('Storage clear error:', e);
          return false;
        }
      }
    }
  }
});

// Handle app lifecycle events in the renderer
window.addEventListener('DOMContentLoaded', () => {
  // Add platform-specific CSS class to body
  const platformClass = process.platform.replace(' ', '-').toLowerCase();
  document.body.classList.add(`electron-${platformClass}`);
  
  // Emit app ready event
  ipcRenderer.send('renderer-ready');
  
  // Log that COGA Electron is initialized
  console.log('🖥️ COGA Electron App initialized');
  console.log(`Platform: ${process.platform}`);
  console.log(`Electron Version: ${process.versions.electron}`);
});

// Handle app closure
window.addEventListener('beforeunload', () => {
  ipcRenderer.send('renderer-closed');
});