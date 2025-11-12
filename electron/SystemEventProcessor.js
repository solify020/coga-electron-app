/**
 * SystemEventProcessor.js
 * Processes system-level events from iohook and integrates with COGA stress detection
 */

class SystemEventProcessor {
  constructor() {
    this.metrics = {
      systemMouseClicksPerMin: 0,
      systemMouseVelocity: 0,
      systemMouseAcceleration: 0,
      systemMultiClickRate: 0,
      systemKeyPressesPerMin: 0,
      systemTypingErrorRate: 0,
      systemKeyPauseRegularity: 0,
      windowSwitchesPerMin: 0,
      focusChangesPerMin: 0,
      systemActivityLevel: 'idle',
      workHoursActive: false,
      timeOfDay: new Date().getHours()
    };
    
    this.eventBuffer = [];
    this.lastMetricsUpdate = Date.now();
    this.updateInterval = 10000; // Update metrics every 10 seconds
    
    // Initialize buffers
    this.mouseClickBuffer = [];
    this.keyPressBuffer = [];
    this.windowSwitchBuffer = [];
    this.focusChangeBuffer = [];
    this.multiClickBuffer = [];
    this.typingErrorBuffer = [];
    
    // Start periodic metrics update
    this.startMetricsUpdate();
  }
  
  /**
   * Process raw system events from iohook
   */
  processSystemEvent(event) {
    try {
      this.eventBuffer.push(event);
      this.updateMetricBuffers(event);
      
      // Clean up old events
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      this.eventBuffer = this.eventBuffer.filter(e => e.timestamp >= oneMinuteAgo);
      
    } catch (error) {
      console.error('[COGA System] Error processing system event:', error);
    }
  }
  
  /**
   * Update metric buffers based on event type
   */
  updateMetricBuffers(event) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    switch (event.type) {
      case 'mouse_click':
        this.mouseClickBuffer.push(event.timestamp);
        this.mouseClickBuffer = this.mouseClickBuffer.filter(t => t >= oneMinuteAgo);
        break;
        
      case 'mouse_release':
        // Detect double/triple clicks
        const recentClicks = this.mouseClickBuffer.filter(t => now - t < 500);
        if (recentClicks.length >= 2) {
          this.multiClickBuffer.push(event.timestamp);
          this.multiClickBuffer = this.multiClickBuffer.filter(t => t >= oneMinuteAgo);
        }
        break;
        
      case 'key_press':
        this.keyPressBuffer.push(event.timestamp);
        this.keyPressBuffer = this.keyPressBuffer.filter(t => t >= oneMinuteAgo);
        
        // Detect typing errors (backspace usage)
        if (event.context && event.context.keychar === 'Backspace') {
          this.typingErrorBuffer.push(event.timestamp);
          this.typingErrorBuffer = this.typingErrorBuffer.filter(t => t >= oneMinuteAgo);
        }
        break;
        
      case 'window_change':
      case 'window_focus':
        if (event.type === 'window_change') {
          this.windowSwitchBuffer.push(event.timestamp);
        } else {
          this.focusChangeBuffer.push(event.timestamp);
        }
        const buffer = event.type === 'window_change' ? this.windowSwitchBuffer : this.focusChangeBuffer;
        buffer.filter(t => t >= oneMinuteAgo);
        break;
    }
  }
  
  /**
   * Calculate and update metrics
   */
  calculateSystemMetrics() {
    try {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      
      // Time-based context
      this.metrics.timeOfDay = new Date().getHours();
      this.metrics.workHoursActive = this.isWorkTime();
      
      // Mouse metrics (per minute)
      const recentClicks = this.mouseClickBuffer.filter(t => t >= oneMinuteAgo);
      const recentMultiClicks = this.multiClickBuffer.filter(t => t >= oneMinuteAgo);
      
      this.metrics.systemMouseClicksPerMin = recentClicks.length;
      this.metrics.systemMultiClickRate = recentMultiClicks.length;
      
      // Calculate mouse velocity and acceleration from movement events
      const mouseMoveEvents = this.eventBuffer.filter(e => 
        e.type === 'mouse_move' && e.timestamp >= oneMinuteAgo
      );
      
      if (mouseMoveEvents.length > 1) {
        this.metrics.systemMouseVelocity = this.calculateMouseVelocity(mouseMoveEvents);
        this.metrics.systemMouseAcceleration = this.calculateMouseAcceleration(mouseMoveEvents);
      }
      
      // Keyboard metrics
      const recentKeyPresses = this.keyPressBuffer.filter(t => t >= oneMinuteAgo);
      const recentErrors = this.typingErrorBuffer.filter(t => t >= oneMinuteAgo);
      
      this.metrics.systemKeyPressesPerMin = recentKeyPresses.length;
      this.metrics.systemTypingErrorRate = recentKeyPresses.length > 0 
        ? (recentErrors.length / recentKeyPresses.length) * 100 
        : 0;
      
      // Application switching metrics
      const recentSwitches = this.windowSwitchBuffer.filter(t => t >= oneMinuteAgo);
      const recentFocusChanges = this.focusChangeBuffer.filter(t => t >= oneMinuteAgo);
      
      this.metrics.windowSwitchesPerMin = recentSwitches.length;
      this.metrics.focusChangesPerMin = recentFocusChanges.length;
      
      // Overall activity level
      this.metrics.systemActivityLevel = this.calculateActivityLevel();
      
    } catch (error) {
      console.error('[COGA System] Error calculating metrics:', error);
    }
  }
  
  /**
   * Calculate mouse velocity from movement events
   */
  calculateMouseVelocity(events) {
    if (events.length < 2) return 0;
    
    let totalVelocity = 0;
    let count = 0;
    
    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const curr = events[i];
      
      const dt = curr.timestamp - prev.timestamp;
      if (dt > 0 && prev.context && curr.context) {
        const dx = curr.context.x - prev.context.x;
        const dy = curr.context.y - prev.context.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocity = distance / (dt / 1000); // pixels per second
        
        totalVelocity += velocity;
        count++;
      }
    }
    
    return count > 0 ? totalVelocity / count : 0;
  }
  
  /**
   * Calculate mouse acceleration from movement events
   */
  calculateMouseAcceleration(events) {
    if (events.length < 3) return 0;
    
    let totalAcceleration = 0;
    let count = 0;
    
    for (let i = 2; i < events.length; i++) {
      const prev = events[i - 1];
      const curr = events[i];
      
      const dt = curr.timestamp - prev.timestamp;
      if (dt > 0 && prev.context && curr.context) {
        const prevDx = prev.context.x - (events[i - 2].context?.x || prev.context.x);
        const prevDy = prev.context.y - (events[i - 2].context?.y || prev.context.y);
        const currDx = curr.context.x - prev.context.x;
        const currDy = curr.context.y - prev.context.y;
        
        const prevVel = Math.sqrt(prevDx * prevDx + prevDy * prevDy) / ((events[i - 1].timestamp - events[i - 2].timestamp) / 1000);
        const currVel = Math.sqrt(currDx * currDx + currDy * currDy) / (dt / 1000);
        
        const acceleration = (currVel - prevVel) / (dt / 1000);
        totalAcceleration += Math.abs(acceleration);
        count++;
      }
    }
    
    return count > 0 ? totalAcceleration / count : 0;
  }
  
  /**
   * Calculate overall activity level
   */
  calculateActivityLevel() {
    const recentEventCount = this.eventBuffer.filter(e => 
      Date.now() - e.timestamp < 5000
    ).length;
    
    const eventsPerSecond = recentEventCount / 5;
    
    if (eventsPerSecond < 0.2) return 'idle';
    if (eventsPerSecond < 1) return 'low';
    if (eventsPerSecond < 3) return 'medium';
    if (eventsPerSecond < 6) return 'high';
    return 'very_high';
  }
  
  /**
   * Check if current time is work hours
   */
  isWorkTime() {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    // Monday-Friday, 9 AM to 5 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  }
  
  /**
   * Get combined metrics for COGA stress detection
   */
  getCombinedMetrics(webMetrics) {
    try {
      // Create a deep copy to avoid modifying original
      const combined = JSON.parse(JSON.stringify(webMetrics));
      combined.timestamp = Date.now();
      
      // Add system-level mouse metrics
      if (combined.mouse) {
        combined.mouse.systemMouseClicksPerMin = this.metrics.systemMouseClicksPerMin;
        combined.mouse.systemMouseVelocity = this.metrics.systemMouseVelocity;
        combined.mouse.systemMouseAcceleration = this.metrics.systemMouseAcceleration;
        combined.mouse.systemMultiClickRate = this.metrics.systemMultiClickRate;
      }
      
      // Add system-level keyboard metrics  
      if (combined.keyboard) {
        combined.keyboard.systemKeyPressesPerMin = this.metrics.systemKeyPressesPerMin;
        combined.keyboard.systemTypingErrorRate = this.metrics.systemTypingErrorRate;
      }
      
      // Add application switching as additional context
      combined.scroll = combined.scroll || { velocity: 0 };
      combined.scroll.windowSwitchesPerMin = this.metrics.windowSwitchesPerMin;
      combined.scroll.focusChangesPerMin = this.metrics.focusChangesPerMin;
      
      // Add system activity context
      combined.systemContext = {
        activityLevel: this.metrics.systemActivityLevel,
        workHoursActive: this.metrics.workHoursActive,
        timeOfDay: this.metrics.timeOfDay,
        totalSystemEvents: this.eventBuffer.length
      };
      
      console.log('[COGA System] Enhanced metrics with system data:', {
        systemMouseClicks: this.metrics.systemMouseClicksPerMin,
        systemKeyPresses: this.metrics.systemKeyPressesPerMin,
        windowSwitches: this.metrics.windowSwitchesPerMin,
        activityLevel: this.metrics.systemActivityLevel
      });
      
      return combined;
    } catch (error) {
      console.error('[COGA System] Error combining metrics:', error);
      return webMetrics;
    }
  }
  
  /**
   * Get current system status
   */
  getSystemStatus() {
    this.calculateSystemMetrics();
    return { ...this.metrics };
  }
  
  /**
   * Start periodic metrics updates
   */
  startMetricsUpdate() {
    setInterval(() => {
      this.calculateSystemMetrics();
    }, this.updateInterval);
  }
  
  /**
   * Reset all data
   */
  reset() {
    this.eventBuffer = [];
    this.mouseClickBuffer = [];
    this.keyPressBuffer = [];
    this.windowSwitchBuffer = [];
    this.focusChangeBuffer = [];
    this.multiClickBuffer = [];
    this.typingErrorBuffer = [];
    this.lastMetricsUpdate = Date.now();
    
    console.log('[COGA System] System event data reset');
  }
}

module.exports = SystemEventProcessor;