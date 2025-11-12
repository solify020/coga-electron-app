const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const iohook = require('node-gg');
const SystemEventProcessor = require('./SystemEventProcessor');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

// System event processor for enhanced stress detection
let systemProcessor;

// System-wide event tracking
let eventBuffer = [];
let isMonitoring = false;

// Initialize system-wide event capture
function initializeSystemMonitoring() {
  try {
    // Initialize the system event processor
    systemProcessor = new SystemEventProcessor();
    
    // Start listening to system events
    iohook.start();
    isMonitoring = true;
    
    console.log('🔍 System-wide monitoring activated with enhanced stress detection');
    
    // Mouse event listeners
    iohook.on('mousemove', (event) => {
      const systemEvent = {
        type: 'mouse_move',
        x: event.x,
        y: event.y,
        timestamp: Date.now(),
        context: { x: event.x, y: event.y }
      };
      handleSystemEvent(systemEvent);
      if (systemProcessor) {
        systemProcessor.processSystemEvent(systemEvent);
      }
    });
    
    iohook.on('mousedown', (event) => {
      const systemEvent = {
        type: 'mouse_click',
        button: event.button,
        x: event.x,
        y: event.y,
        timestamp: Date.now(),
        context: { button: event.button, x: event.x, y: event.y }
      };
      handleSystemEvent(systemEvent);
      if (systemProcessor) {
        systemProcessor.processSystemEvent(systemEvent);
      }
    });
    
    iohook.on('mouseup', (event) => {
      const systemEvent = {
        type: 'mouse_release',
        button: event.button,
        x: event.x,
        y: event.y,
        timestamp: Date.now(),
        context: { button: event.button, x: event.x, y: event.y }
      };
      handleSystemEvent(systemEvent);
      if (systemProcessor) {
        systemProcessor.processSystemEvent(systemEvent);
      }
    });
    
    // Keyboard event listeners
    iohook.on('keydown', (event) => {
      const systemEvent = {
        type: 'key_press',
        keycode: event.keycode,
        keychar: event.keychar,
        rawcode: event.rawcode,
        timestamp: Date.now(),
        context: { keycode: event.keycode, keychar: event.keychar, rawcode: event.rawcode }
      };
      handleSystemEvent(systemEvent);
      if (systemProcessor) {
        systemProcessor.processSystemEvent(systemEvent);
      }
    });
    
    iohook.on('keyup', (event) => {
      const systemEvent = {
        type: 'key_release',
        keycode: event.keycode,
        keychar: event.keychar,
        rawcode: event.rawcode,
        timestamp: Date.now(),
        context: { keycode: event.keycode, keychar: event.keychar, rawcode: event.rawcode }
      };
      handleSystemEvent(systemEvent);
      if (systemProcessor) {
        systemProcessor.processSystemEvent(systemEvent);
      }
    });
    
    // Application/window tracking
    iohook.on('windowchange', (event) => {
      const systemEvent = {
        type: 'window_change',
        windowTitle: event.title,
        windowClass: event.class,
        timestamp: Date.now(),
        context: { windowTitle: event.title, windowClass: event.class }
      };
      handleSystemEvent(systemEvent);
      if (systemProcessor) {
        systemProcessor.processSystemEvent(systemEvent);
      }
    });
    
    iohook.on('focus', (event) => {
      const systemEvent = {
        type: 'window_focus',
        windowTitle: event.title,
        windowClass: event.class,
        timestamp: Date.now(),
        context: { windowTitle: event.title, windowClass: event.class }
      };
      handleSystemEvent(systemEvent);
      if (systemProcessor) {
        systemProcessor.processSystemEvent(systemEvent);
      }
    });
    
    // Activity level tracking with enhanced metrics
    setInterval(() => {
      if (eventBuffer.length > 0) {
        // Get enhanced metrics from system processor
        let activityLevel = 'idle';
        let enhancedStatus = {};
        
        if (systemProcessor) {
          const systemStatus = systemProcessor.getSystemStatus();
          activityLevel = systemStatus.systemActivityLevel;
          enhancedStatus = {
            systemMouseClicks: systemStatus.systemMouseClicksPerMin,
            systemKeyPresses: systemStatus.systemKeyPressesPerMin,
            windowSwitches: systemStatus.windowSwitchesPerMin,
            workHoursActive: systemStatus.workHoursActive,
            ...systemStatus
          };
        } else {
          activityLevel = calculateActivityLevel();
        }
        
        // Send enhanced activity update to renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('system-activity-update', {
            activityLevel,
            eventCount: eventBuffer.length,
            timestamp: Date.now(),
            enhanced: enhancedStatus
          });
        }
        
        // Keep buffer manageable
        if (eventBuffer.length > 100) {
          eventBuffer = eventBuffer.slice(-50);
        }
      }
    }, 1000); // Send updates every second
    
  } catch (error) {
    console.error('❌ Failed to initialize system monitoring:', error);
  }
}

// Handle system events with privacy filtering
function handleSystemEvent(event) {
  // Only record timestamps and general patterns, not actual content
  // This ensures privacy while still enabling stress detection
  
  const filteredEvent = {
    type: event.type,
    timestamp: event.timestamp,
    // Add location-based data only (not specific content)
    context: getContextInfo(event)
  };
  
  eventBuffer.push(filteredEvent);
}

// Get context information without revealing sensitive data
function getContextInfo(event) {
  return {
    // Time-based context
    hour: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    
    // Activity context (general patterns, not specific apps)
    isWorkHours: isWorkTime(),
    
    // Pattern context (not specific content)
    recentActivity: getRecentActivityPattern()
  };
}

// Determine if current time is typical work hours
function isWorkTime() {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  
  // Weekdays, 9 AM to 5 PM
  return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
}

// Calculate activity level based on recent events
function calculateActivityLevel() {
  const now = Date.now();
  const recentEvents = eventBuffer.filter(e => now - e.timestamp < 5000);
  
  if (recentEvents.length === 0) return 'idle';
  
  const eventsPerSecond = recentEvents.length / 5;
  
  if (eventsPerSecond < 0.5) return 'low';
  if (eventsPerSecond < 2) return 'medium';
  if (eventsPerSecond < 5) return 'high';
  return 'very_high';
}

// Get recent activity patterns for context
function getRecentActivityPattern() {
  const now = Date.now();
  const last30Seconds = eventBuffer.filter(e => now - e.timestamp < 30000);
  
  return {
    totalEvents: last30Seconds.length,
    mouseEvents: last30Seconds.filter(e => e.type.includes('mouse')).length,
    keyboardEvents: last30Seconds.filter(e => e.type.includes('key')).length,
    contextChanges: last30Seconds.filter(e => e.type.includes('window')).length
  };
}

// Stop system monitoring
function stopSystemMonitoring() {
  if (isMonitoring) {
    iohook.stop();
    isMonitoring = false;
    if (systemProcessor) {
      systemProcessor.reset();
    }
    eventBuffer = [];
    console.log('🔒 System-wide monitoring stopped');
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../extension/icons/icon128.png'), // Use existing icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready-to-show
    title: 'COGA - Stress Detection & Intervention System'
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on the window when it's shown (Windows specific)
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle external links to open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Session',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            createWindow();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Reset Zoom' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Fullscreen' }
      ]
    },
    {
      label: 'Monitoring',
      submenu: [
        {
          label: 'Start System Monitoring',
          click: () => {
            if (!isMonitoring) {
              initializeSystemMonitoring();
            }
          }
        },
        {
          label: 'Stop System Monitoring',
          click: () => {
            if (isMonitoring) {
              stopSystemMonitoring();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'View System Status',
          click: () => {
            const status = {
              isMonitoring,
              eventCount: eventBuffer.length,
              activityLevel: calculateActivityLevel()
            };
            
            require('electron').dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'COGA System Status',
              message: 'System Monitoring Status',
              detail: `Monitoring: ${isMonitoring ? 'Active' : 'Inactive'}\nEvents Captured: ${eventBuffer.length}\nActivity Level: ${calculateActivityLevel()}`,
              buttons: ['OK']
            });
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', label: 'Minimize' },
        { role: 'close', label: 'Close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About COGA',
          click: () => {
            require('electron').dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About COGA',
              message: 'COGA - Real-Time Stress Detection & Intervention System',
              detail: 'Version 0.1.0\n\nCOGA helps monitor your stress levels and provides interventions to improve your well-being and productivity.\n\nDesktop Edition with System-Wide Monitoring',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'COGA Website',
          click: () => {
            shell.openExternal('https://cogalabs.com');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: 'About COGA' },
        { type: 'separator' },
        { role: 'services', label: 'Services' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide COGA' },
        { role: 'hideothers', label: 'Hide Others' },
        { role: 'unhide', label: 'Show All' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit COGA' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for secure communication
ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('open-external', async (event, url) => {
  return await shell.openExternal(url);
});

ipcMain.handle('log', (event, message) => {
  console.log('Renderer log:', message);
  return true;
});

// System monitoring IPC handlers
ipcMain.handle('start-system-monitoring', () => {
  if (!isMonitoring) {
    initializeSystemMonitoring();
    return { success: true, message: 'System monitoring started' };
  }
  return { success: false, message: 'System monitoring already active' };
});

ipcMain.handle('stop-system-monitoring', () => {
  if (isMonitoring) {
    stopSystemMonitoring();
    return { success: true, message: 'System monitoring stopped' };
  }
  return { success: false, message: 'System monitoring not active' };
});

ipcMain.handle('get-system-events', (event, options = {}) => {
  const { limit = 50, since = Date.now() - 300000 } = options; // Last 5 minutes by default
  
  const filteredEvents = eventBuffer
    .filter(e => e.timestamp >= since)
    .slice(-limit);
  
  return {
    success: true,
    events: filteredEvents,
    summary: {
      total: filteredEvents.length,
      activityLevel: calculateActivityLevel(),
      timeRange: { since, now: Date.now() }
    }
  };
});

ipcMain.handle('get-system-status', () => {
  const status = {
    success: true,
    isMonitoring,
    eventCount: eventBuffer.length,
    activityLevel: 'idle',
    lastEvent: eventBuffer[eventBuffer.length - 1] || null
  };
  
  if (systemProcessor) {
    const systemStatus = systemProcessor.getSystemStatus();
    status.activityLevel = systemStatus.systemActivityLevel;
    status.enhanced = systemStatus;
  } else {
    status.activityLevel = calculateActivityLevel();
  }
  
  return status;
});

// Enhanced stress detection IPC handlers
ipcMain.handle('get-enhanced-metrics', (event, webMetrics) => {
  try {
    if (systemProcessor && webMetrics) {
      const enhancedMetrics = systemProcessor.getCombinedMetrics(webMetrics);
      return {
        success: true,
        metrics: enhancedMetrics,
        systemEnhanced: true
      };
    }
    
    return {
      success: false,
      message: 'System processor not available or invalid metrics',
      systemEnhanced: false
    };
  } catch (error) {
    console.error('[COGA Main] Error enhancing metrics:', error);
    return {
      success: false,
      message: error.message,
      systemEnhanced: false
    };
  }
});

ipcMain.handle('get-system-stress-analysis', () => {
  try {
    if (!systemProcessor) {
      return {
        success: false,
        message: 'System processor not available'
      };
    }
    
    const systemStatus = systemProcessor.getSystemStatus();
    
    // Simple stress indicators based on system activity
    let stressIndicators = [];
    let systemStressLevel = 'normal';
    
    if (systemStatus.systemMouseClicksPerMin > 30) {
      stressIndicators.push('High mouse activity');
    }
    
    if (systemStatus.systemKeyPressesPerMin > 60) {
      stressIndicators.push('High typing activity');
    }
    
    if (systemStatus.windowSwitchesPerMin > 10) {
      stressIndicators.push('Frequent application switching');
    }
    
    if (systemStatus.systemTypingErrorRate > 15) {
      stressIndicators.push('High typing error rate');
    }
    
    if (systemStatus.systemActivityLevel === 'very_high') {
      stressIndicators.push('Very high overall activity');
      systemStressLevel = 'high';
    } else if (systemStatus.systemActivityLevel === 'high') {
      stressIndicators.push('High overall activity');
      systemStressLevel = 'moderate';
    }
    
    return {
      success: true,
      analysis: {
        systemStressLevel,
        stressIndicators,
        workHoursActive: systemStatus.workHoursActive,
        timeOfDay: systemStatus.timeOfDay,
        systemStatus
      }
    };
  } catch (error) {
    console.error('[COGA Main] Error getting system stress analysis:', error);
    return {
      success: false,
      message: error.message
    };
  }
});

// App lifecycle IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  return await require('electron').dialog.showMessageBox(mainWindow, options);
});

// Handle renderer ready
ipcMain.on('renderer-ready', () => {
  console.log('Renderer process is ready');
});

// Handle renderer closed
ipcMain.on('renderer-closed', () => {
  console.log('Renderer process is closing');
});

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();
  
  // Start system monitoring automatically in production
  if (!isDev) {
    setTimeout(() => {
      initializeSystemMonitoring();
      console.log('🖥️ COGA desktop app ready with system monitoring');
    }, 2000);
  }

  // macOS specific behavior
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:8080' && 
        parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});

// Clean up system monitoring on app quit
app.on('before-quit', () => {
  if (systemProcessor) {
    systemProcessor.reset();
  }
  stopSystemMonitoring();
});