# COGA Windows Desktop Application

This directory contains the Electron configuration for the COGA Windows desktop application.

## Files Structure

```
electron/
├── main.js          # Main Electron process
├── preload.js       # Preload script for security
└── icons/           # Application icons
```

## Features

- **Real-time stress detection**: Monitors user behavior patterns
- **Desktop notifications**: Native Windows notifications for interventions
- **Cross-platform support**: Works on Windows, macOS, and Linux
- **Secure**: Uses Electron's security features
- **Auto-updates ready**: Prepared for future update mechanisms

## Configuration

### App Details
- **Name**: COGA
- **Version**: 0.1.0
- **Description**: Real-Time Stress Detection & Intervention System
- **App ID**: com.cogalabs.coga-mvp

### Windows Settings
- **Target**: NSIS installer
- **Icon**: Uses existing extension icon
- **Shortcuts**: Desktop and Start Menu shortcuts enabled
- **Installation**: User can choose directory (not one-click)

## Scripts

The following scripts are available in package.json:

```bash
npm run electron          # Run Electron in production mode
npm run electron:dev      # Build and run in development mode  
npm run electron:start    # Build and run Electron
npm run electron:build    # Build the application
npm run electron:build:win # Build for Windows specifically
```

## Security Features

- **Context Isolation**: Enabled for enhanced security
- **Node Integration**: Disabled in renderer process
- **Preload Script**: Secure API exposure to renderer
- **External Links**: Opens in default browser
- **Navigation Protection**: Prevents navigation to untrusted URLs

## Development vs Production

### Development Mode
- Loads from `http://localhost:8080`
- DevTools are open by default
- Full debugging capabilities

### Production Mode
- Loads from local `public/index.html`
- Optimized for performance
- Enhanced security restrictions

## Troubleshooting

### Common Issues

1. **App won't start**
   - Ensure all dependencies are installed: `npm install`
   - Check that the development server is running for dev mode
   - Verify all required files exist

2. **Icons not displaying**
   - Icons are copied from `extension/icons/`
   - Ensure PNG files exist in the extension directory

3. **Security warnings**
   - These are expected in development mode
   - They don't affect functionality

## Building for Distribution

To create a Windows installer:

1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Create Windows installer: `npm run electron:build:win`

The installer will be created in the `electron-dist/` directory.

## Code Signing (Future)

For production distribution, you'll need to:
1. Obtain a code signing certificate
2. Configure electron-builder with signing credentials
3. Update the build configuration

This is not required for development or internal testing.