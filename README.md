# COGA MVP - Real-Time Stress Detection & Intervention System

## Overview

COGA is an intelligent wellness system that monitors behavioral patterns in real-time and provides timely interventions to help users manage stress and maintain productivity.

## Phase 1 Features

### Core Functionality
- **Behavioral Metrics Tracking**: Mouse velocity, click patterns, keyboard typing speed, and scroll behavior
- **Baseline Calibration**: 3-minute initial calibration using median and MAD (Median Absolute Deviation)
- **Stress Detection**: Real-time stress scoring with Z-score calculation
- **Smart Interventions**: 3 core interventions that trigger when stress exceeds threshold

### Interventions
1. **Box Breathing** (15/30/60 seconds)
   - Visual guide with 4-4-4-4 breathing pattern
   - Completion tracking
   - Animated UI feedback

2. **Eye Rest Reminder**
   - 20-20-20 rule implementation
   - Subtle notification
   - Quick dismiss option

3. **Micro-Break Prompt**
   - Stand/stretch suggestions
   - 30-second timer
   - Skip option available

### Annoyance Prevention
- 8-minute cooldown between interventions
- Maximum 3 interventions per hour
- Maximum 12 interventions per day
- Auto-snooze after 2 consecutive dismissals
- Disabled during password fields and video playback
- Paused during fullscreen mode

### UI/Widget
- Minimal floating indicator dot (green/yellow/red)
- Click to view detailed stress metrics
- Adjustable sensitivity (low/medium/high)
- Draggable positioning
- Non-intrusive design

### Data Collection
- Anonymous event logging
- Local storage with periodic batch processing
- Privacy-first approach (no PII collected)
- Usage analytics for improvement

## Tech Stack

- **Build Tool**: Webpack 5
- **Language**: JavaScript (ES6+)
- **Transpiler**: Babel
- **Storage**: LocalStorage
- **Architecture**: Modular component-based design

## Project Structure

```
coga-mvp/
├── src/
│   ├── core/
│   │   ├── EventCapture.js       # Browser event listeners
│   │   ├── BaselineManager.js    # Personal calibration
│   │   └── StressDetector.js     # Scoring algorithm
│   ├── interventions/
│   │   ├── BoxBreathing.js       # Breathing exercise
│   │   ├── EyeRest.js           # Eye rest reminder
│   │   ├── MicroBreak.js        # Break prompts
│   │   └── InterventionManager.js # Intervention orchestration
│   ├── rules/
│   │   └── AnnoyanceRules.js    # Spam prevention
│   ├── ui/
│   │   └── Widget.js            # Main UI component
│   ├── utils/
│   │   ├── storage.js           # LocalStorage wrapper
│   │   └── analytics.js         # Event tracking
│   ├── COGA.js                  # Main class
│   └── index.js                 # Entry point
├── public/
│   └── index.html               # Development test page
├── dist/                        # Build output (generated)
├── .babelrc                     # Babel configuration
├── webpack.config.js            # Webpack configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

This will open `http://localhost:3000` in your browser.

### 3. Build for Production

Create optimized production build:

```bash
npm run build
```

This generates `dist/coga.min.js` (< 50KB target).

### 4. Watch Mode

Continuous build during development:

```bash
npm run watch
```

## Usage

### As a Bookmarklet (Works on Any Website!)

The COGA widget can be injected into **any webpage** using a bookmarklet. This allows you to monitor stress levels on YouTube, Gmail, Facebook, or any other site.

#### Quick Start with Local Testing (HTTP only)

```bash
# 1. Build the project
npm run build

# 2. Start the server
npm run serve

# 3. Visit http://localhost:8080 and drag the bookmarklet to your bookmarks bar
```

#### Production Setup with ngrok (HTTPS) ⭐ Recommended

For testing on HTTPS sites (YouTube, Gmail, etc.):

```bash
# 1. Install ngrok
npm install -g ngrok

# 2. Build the project
npm run build

# 3. Start server and ngrok (Windows)
start-ngrok.bat

# OR (Linux/Mac)
./start-ngrok.sh

# 4. Visit the ngrok HTTPS URL and get the bookmarklet
# 5. Click it on any website!
```

See **[BOOKMARKLET.md](./BOOKMARKLET.md)** for complete instructions.

#### Manual Bookmarklet Code

```javascript
javascript:(function(){
  if(window.COGA){alert('COGA already loaded!');return;}
  const s=document.createElement('script');
  s.src='https://YOUR-URL/coga.min.js';
  s.onload=()=>console.log('[COGA] Loaded');
  s.onerror=()=>alert('Error loading COGA');
  document.head.appendChild(s);
})();
```

### Programmatic API

Access COGA through the browser console:

```javascript
// Get current status
window.COGA.getStatus();

// Get statistics
await window.COGA.getStatistics();

// Adjust sensitivity
await window.COGA.setSensitivity('high'); // 'low', 'medium', or 'high'

// Enable/disable interventions
await window.COGA.setEnabled(false);

// Reset all data
await window.COGA.reset();

// Stop/start detection
window.COGA.stop();
window.COGA.start();
```

## Testing

1. Open the development page at `http://localhost:3000`
2. Wait for the 3-minute baseline calibration (first time only)
3. Interact with the page to generate metrics:
   - Type quickly in the text area
   - Make rapid mouse movements
   - Click repeatedly in one spot
   - Use backspace frequently
4. The widget will change color based on stress level
5. Interventions will trigger when stress exceeds threshold

## Configuration

Default configuration can be adjusted:

```javascript
// Sensitivity levels
setSensitivity('low');    // Threshold: 3.5
setSensitivity('medium'); // Threshold: 2.5 (default)
setSensitivity('high');   // Threshold: 1.5

// Intervention limits (via AnnoyanceRules)
{
  maxPerHour: 3,
  maxPerDay: 12,
  cooldownMs: 480000, // 8 minutes
  autoSnoozeAfterDismissals: 2,
  snoozeTimeMs: 1800000 // 30 minutes
}
```

## Performance Targets

- ✅ Initial load: < 2 seconds
- ✅ Stress detection latency: < 100ms
- ✅ Intervention trigger: < 500ms
- ✅ Memory footprint: < 50MB
- ✅ CPU usage: < 2% idle, < 5% active
- ✅ Bundle size: < 50KB (minified)

## Browser Compatibility

- Chrome 90+ (primary)
- Firefox 95+ (secondary)
- Safari 15+ (basic support)
- Edge 90+ (full support)

## Development Workflow

1. **Start Development**:
   ```bash
   npm run dev
   ```

2. **Make Changes**: Edit files in `src/`

3. **Test**: Interact with the development page

4. **Build**: 
   ```bash
   npm run build
   ```

5. **Version Control**:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

## Known Limitations (Phase 1)

- Local storage only (no backend API yet)
- No user accounts or cross-device sync
- No wearable integration (coming in Phase 3)
- No team features (coming in Phase 3)
- Chrome extension not yet implemented (coming in Phase 3)

## Roadmap

### Phase 2 (Weeks 3-4)
- 6 total interventions
- Chrome extension scaffold
- Improved detection with contextual baselines
- Basic dashboard for insights
- Adaptive intervention selection

### Phase 3 (Weeks 5-6)
- Whoop integration
- 10 total interventions
- Full Chrome extension
- Team features (beta)
- API v1

### Phase 4 (Weeks 7-8)
- Additional wearables (Apple Watch, Oura)
- AI/ML optimization
- Safety features
- Enterprise features
- Production-ready

## Troubleshooting

### Widget not appearing
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page

### Interventions not triggering
- Complete the 3-minute calibration first
- Generate more activity (typing, clicking)
- Lower sensitivity: `window.COGA.setSensitivity('high')`
- Check if snoozed: `window.COGA.interventionManager.annoyanceRules.isSnoozed()`

### Reset everything
```javascript
await window.COGA.reset();
location.reload();
```

## Contributing

This is a private MVP project. For questions or issues, contact the development team.

## License

MIT License - Copyright (c) 2024 COGA Labs

---

**Version**: 0.1.0 (Phase 1)  
**Status**: Active Development  
**Last Updated**: October 2024

