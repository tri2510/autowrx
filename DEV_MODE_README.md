# Development Mode Auto Sign-In

This AutoWRX frontend includes a development mode with automatic sign-in functionality to streamline development workflow.

## Features

### 🚀 Automatic Sign-In
- Automatically signs in with development credentials when `VITE_DEV_MODE=true`
- No manual login required during development
- Shows toast notification when auto sign-in succeeds or fails

### 🎯 Visual Indicators
- **DEV MODE** badge in top-left corner (orange/red gradient)
- Development mode indicator widget in bottom-right corner
- Shows current user status, backend URL, and authentication state

### 🔧 Development Tools
- Quick sign-in/sign-out buttons in dev widget
- Display of development credentials (masked password)
- Backend connection status
- Real-time authentication state

## Configuration

### Environment Variables (.env)
```env
# Enable development mode
VITE_DEV_MODE=true

# Development bypass credentials
VITE_DEV_BYPASS_EMAIL=dev@autowrx.local
VITE_DEV_BYPASS_PASSWORD=dev123

# Backend server URL
VITE_SERVER_BASE_URL=http://localhost:8080
VITE_SERVER_BASE_WSS_URL=http://localhost:8080
```

## How It Works

1. **Environment Detection**: The app checks if `VITE_DEV_MODE=true`
2. **Auto Sign-In**: When the app loads and no user is authenticated, it automatically attempts to sign in using the development credentials
3. **Visual Feedback**: Shows success/error toasts and UI indicators
4. **Manual Override**: Developers can still sign out and sign in manually via the dev widget

## Components

### Files Added/Modified
- `src/utils/devAuth.ts` - Development authentication utilities
- `src/components/molecules/DaDevModeIndicator.tsx` - Development mode UI widget
- `src/App.tsx` - Auto sign-in logic integration
- `src/index.css` - Development mode visual indicators
- `.env` - Development configuration

### Key Functions
- `autoSignInDev()` - Attempts automatic sign-in with dev credentials
- `isDevMode()` - Checks if running in development mode
- `getDevCredentials()` - Returns development credentials safely

## Usage

### Starting Development
```bash
# Make sure backend is running
cd backend-core
npm run dev

# Start frontend (auto sign-in will activate)
cd autowrx
npm run dev
```

### Manual Development Workflow
1. Backend server must be running at `VITE_SERVER_BASE_URL`
2. Frontend will automatically sign in on first load
3. Use the dev widget (bottom-right) for manual sign-in/out
4. Check browser console for detailed logging

## Security Notes

⚠️ **For Development Only** - Never expose development credentials in production environments.

- Development credentials are only used when `VITE_DEV_MODE=true`
- Auto sign-in is disabled in production builds
- Visual indicators clearly show when in development mode
- Development mode adds CSS classes and console warnings

## Troubleshooting

### Auto Sign-In Fails
1. Check if backend server is running at the correct URL
2. Verify development credentials exist in your backend
3. Check browser console for detailed error messages
4. Use the dev widget to attempt manual sign-in

### No Visual Indicators
1. Verify `VITE_DEV_MODE=true` in your `.env` file
2. Check browser console for "Application running in Development Mode" message
3. Refresh the page after updating environment variables

### Backend Connection Issues
- The dev widget shows the backend URL it's trying to connect to
- Check that your backend server is accessible at that URL
- Verify CORS settings if needed

## Benefits for Development

- **Faster Development**: No need to manually sign in during development
- **Clear Context**: Visual indicators remind you you're in development mode
- **Easy Testing**: Quick sign-in/out for testing different user states
- **Better UX**: Seamless development experience without authentication friction